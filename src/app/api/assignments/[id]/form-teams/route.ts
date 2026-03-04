import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@/generated/prisma/client';
import { handleApiError, withRole } from '@/lib/api-utils';
import { callEdu2comBackgroundTeamFormation } from '@/lib/edu2com/api';
import {
  getEdu2comBackgroundTimeoutMs,
  getEdu2comWeights,
  normalizeWeights,
} from '@/lib/edu2com/config';
import type {
  Edu2comBackgroundParameters,
  Edu2comParameters,
} from '@/lib/edu2com/contract';
import { buildEdu2comReplyPostUrl } from '@/lib/edu2com/webhook';
import { logger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { HttpError, ValidationError } from '@/lib/utils/errors';

function isAbortError(error: unknown): error is Error {
  if (!(error instanceof Error)) return false;
  return (
    error.name === 'AbortError' ||
    error.message?.toLowerCase?.().includes('aborted')
  );
}

function normalizeGender(g: unknown): 'MALE' | 'FEMALE' | undefined {
  if (!g || typeof g !== 'string') return undefined;
  const v = g.trim().toLowerCase();
  // Common mappings (ID + EN)
  if (
    v === 'male' ||
    v === 'laki-laki' ||
    v === 'laki laki' ||
    v === 'pria' ||
    v === 'm' ||
    v === 'l'
  )
    return 'MALE';
  if (
    v === 'female' ||
    v === 'perempuan' ||
    v === 'wanita' ||
    v === 'f' ||
    v === 'p'
  )
    return 'FEMALE';
  // Already in expected form
  if (v === 'male'.toLowerCase() || v === 'female'.toLowerCase())
    return v.toUpperCase() as 'MALE' | 'FEMALE';
  if (v === 'ma le') return 'MALE';
  return undefined;
}

type TopicPreference = { personId: string; preference: number };
type TopicRecord = { id: string; name: string };
type TaskSkillRequirement = {
  id: string;
  level: number;
  importance: number;
};

const RETRYABLE_EDU2COM_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_EDU2COM_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1_000;
const RETRY_MAX_DELAY_MS = 30_000;

const clamp01 = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
};

function buildTopicBuckets(topics: TopicRecord[], bucketCount: number) {
  if (bucketCount <= 0) return [];
  const buckets: string[][] = Array.from({ length: bucketCount }, () => []);
  topics.forEach((topic, index) => {
    buckets[index % bucketCount]?.push(topic.id);
  });
  return buckets;
}

function computeTopicAveragePreferences(
  topics: TopicRecord[],
  prefsByTopic: Map<string, TopicPreference[]>
) {
  const avg = new Map<string, number>();
  for (const topic of topics) {
    const prefs = prefsByTopic.get(topic.id) ?? [];
    if (prefs.length === 0) {
      avg.set(topic.id, 0);
      continue;
    }
    const score =
      prefs.reduce((sum, curr) => sum + curr.preference, 0) / prefs.length;
    avg.set(topic.id, clamp01(score));
  }
  return avg;
}

function aggregatePreferencesForBucket(
  topicIds: string[],
  prefsByTopic: Map<string, TopicPreference[]>
): TopicPreference[] | undefined {
  if (topicIds.length === 0) return undefined;
  const prefByPerson = new Map<string, number[]>();
  for (const topicId of topicIds) {
    const prefs = prefsByTopic.get(topicId) ?? [];
    for (const pref of prefs) {
      const arr = prefByPerson.get(pref.personId) ?? [];
      arr.push(pref.preference);
      prefByPerson.set(pref.personId, arr);
    }
  }

  if (prefByPerson.size === 0) return undefined;
  const merged: TopicPreference[] = [];
  for (const [personId, values] of prefByPerson) {
    const avg = values.reduce((sum, curr) => sum + curr, 0) / values.length;
    merged.push({ personId, preference: clamp01(avg) });
  }
  return merged;
}

function pickRepresentativeTopic(
  bucketTopicIds: string[],
  topicAvgPref: Map<string, number>,
  fallbackTopics: TopicRecord[],
  bucketIndex: number
) {
  if (bucketTopicIds.length === 0) {
    return fallbackTopics[bucketIndex % fallbackTopics.length]?.id;
  }
  let bestId = bucketTopicIds[0];
  let bestScore = topicAvgPref.get(bestId) ?? 0;
  for (let i = 1; i < bucketTopicIds.length; i++) {
    const candidate = bucketTopicIds[i];
    const score = topicAvgPref.get(candidate) ?? 0;
    if (score > bestScore) {
      bestId = candidate;
      bestScore = score;
    }
  }
  return bestId;
}

function buildTaskFromBucket({
  bucketIndex,
  bucketTopicIds,
  fallbackTopics,
  topicAvgPref,
  prefsByTopic,
  defaultTaskSkills,
  teamSize,
}: {
  bucketIndex: number;
  bucketTopicIds: string[];
  fallbackTopics: TopicRecord[];
  topicAvgPref: Map<string, number>;
  prefsByTopic: Map<string, TopicPreference[]>;
  defaultTaskSkills: TaskSkillRequirement[];
  teamSize: number;
}) {
  const representativeTopicId =
    pickRepresentativeTopic(
      bucketTopicIds,
      topicAvgPref,
      fallbackTopics,
      bucketIndex
    ) ?? `bucket-${bucketIndex + 1}`;
  const aggregatedPrefs = aggregatePreferencesForBucket(
    bucketTopicIds,
    prefsByTopic
  );

  return {
    id: `${representativeTopicId}-${bucketIndex + 1}`,
    skills: defaultTaskSkills,
    teamSize,
    preferences: aggregatedPrefs?.length ? aggregatedPrefs : undefined,
  };
}

const sleep = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

function shouldRetryEdu2comError(error: unknown) {
  if (error instanceof HttpError) {
    return RETRYABLE_EDU2COM_STATUSES.has(error.status);
  }
  return isAbortError(error);
}

async function callEdu2comWithRetry(
  payload: Edu2comBackgroundParameters,
  opts: { timeoutMs: number }
) {
  for (let attempt = 1; attempt <= MAX_EDU2COM_ATTEMPTS; attempt += 1) {
    try {
      await callEdu2comBackgroundTeamFormation(payload, opts);
      return;
    } catch (error) {
      if (!shouldRetryEdu2comError(error) || attempt === MAX_EDU2COM_ATTEMPTS) {
        throw error;
      }
      const delayMs = Math.min(
        RETRY_MAX_DELAY_MS,
        RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)
      );
      logger.warn(
        `[Team Formation] Edu2com call failed (attempt ${attempt}/${MAX_EDU2COM_ATTEMPTS}):`,
        error
      );
      logger.info(
        `[Team Formation] Retrying Edu2com call in ${delayMs}ms (timeout ${opts.timeoutMs}ms)`
      );
      await sleep(delayMs);
    }
  }
}

const BODY_SCHEMA = z
  .object({
    method: z.enum(['JUMLAH_KELOMPOK', 'JUMLAH_MHS_PER_KELOMPOK']),
    value: z.number().int().min(1),
    weights: z
      .object({
        alpha: z.number().min(0).max(1).optional(),
        beta: z.number().min(0).max(1).optional(),
        gamma: z.number().min(0).max(1).optional(),
        delta: z.number().min(0).max(1).optional(),
      })
      .optional(),
  })
  .strict();

export const runtime = 'nodejs';
const STUCK_REQUEST_TIMEOUT_MS = 3 * 60 * 1000; // Auto-fail background requests after 3 minutes

// POST /api/assignments/[id]/form-teams
export const POST = withRole<{ id: string }>('TEACHER', async (req, ctx) => {
  const startTime = performance.now();
  try {
    const { id: assignmentId } = await ctx.params;
    logger.info(`[Team Formation] Starting for assignment: ${assignmentId}`);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('Invalid JSON in request body');
    }

    let parsedBody: z.infer<typeof BODY_SCHEMA>;
    try {
      parsedBody = BODY_SCHEMA.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          `Validation failed: ${error.issues.map(issue => issue.message).join(', ')}`
        );
      }
      throw error;
    }

    const { method, value } = parsedBody;
    logger.info(`[Team Formation] Method: ${method}, Value: ${value}`);

    // Verify assignment and ownership
    const assignmentQueryStart = performance.now();
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        courseId: true,
        course: { select: { dosenId: true } },
        description: true,
      },
    });
    const assignmentQueryTime = performance.now() - assignmentQueryStart;
    logger.info(
      `[Team Formation] Assignment query took ${assignmentQueryTime.toFixed(2)}ms`
    );

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }
    if (assignment.course.dosenId !== ctx.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Primary cleanup: Auto-fail stale requests when new team formation is attempted
    // (Runs immediately on each POST request - more reliable than daily cron on Hobby plan)
    const cleanupStart = performance.now();
    const now = new Date();
    const staleCutoff = new Date(now.getTime() - STUCK_REQUEST_TIMEOUT_MS);
    await prisma.teamFormationRequest.updateMany({
      where: {
        assignmentId,
        status: { in: ['PENDING', 'PROCESSING'] },
        updatedAt: { lt: staleCutoff },
      },
      data: {
        status: 'FAILED',
        errorMessage:
          'Permintaan otomatis gagal karena tidak ada respons dari Edu2com dalam batas waktu.',
        completedAt: now,
      },
    });
    const cleanupTime = performance.now() - cleanupStart;
    logger.info(
      `[Team Formation] Cleanup stale requests took ${cleanupTime.toFixed(2)}ms`
    );

    const inFlight = await prisma.teamFormationRequest.findFirst({
      where: {
        assignmentId,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      select: { id: true },
    });
    if (inFlight) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Masih ada proses pembentukan kelompok yang berjalan. Silakan tunggu hingga selesai sebelum menjalankan lagi.',
        },
        { status: 409 }
      );
    }

    // Gather enrolled students for the course
    const enrollmentQueryStart = performance.now();
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId: assignment.courseId },
      select: {
        student: {
          select: {
            id: true,
            gender: true,
            personalityProfile: {
              select: { ei: true, sn: true, tf: true, pj: true },
            },
            personSkills: { select: { skillId: true, level: true } },
          },
        },
      },
    });
    const enrollmentQueryTime = performance.now() - enrollmentQueryStart;
    logger.info(
      `[Team Formation] Enrollment query took ${enrollmentQueryTime.toFixed(2)}ms, found ${enrollments.length} students`
    );

    // Get students who have submitted the assignment quiz
    const submissionQueryStart = performance.now();
    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      select: { studentId: true },
    });
    const submittedStudentIds = new Set(
      submissions.map((s: { studentId: string }) => s.studentId)
    );
    const submissionQueryTime = performance.now() - submissionQueryStart;
    logger.info(
      `[Team Formation] Submission query took ${submissionQueryTime.toFixed(2)}ms, found ${submissions.length} submissions`
    );

    type PersonalityComplete<T> = T & {
      ei: number;
      sn: number;
      tf: number;
      pj: number;
    };

    // Helper to check if student has valid personality scores
    const hasValidPersonality = <
      T extends {
        ei: number | null;
        sn: number | null;
        tf: number | null;
        pj: number | null;
      },
    >(
      student: T
    ): student is PersonalityComplete<T> => {
      return (
        student.ei !== null &&
        student.sn !== null &&
        student.tf !== null &&
        student.pj !== null &&
        typeof student.ei === 'number' &&
        typeof student.sn === 'number' &&
        typeof student.tf === 'number' &&
        typeof student.pj === 'number' &&
        Number.isFinite(student.ei) &&
        Number.isFinite(student.sn) &&
        Number.isFinite(student.tf) &&
        Number.isFinite(student.pj)
      );
    };

    // Filter to only include students who:
    // 1. Have submitted the assignment quiz
    // 2. Have valid personality scores (MBTI)
    type EnrollmentStudent = {
      id: string;
      gender: string | null;
      personalityProfile: {
        ei: number | null;
        sn: number | null;
        tf: number | null;
        pj: number | null;
      } | null;
      personSkills: { skillId: string; level: number }[];
    };
    type EnrolledStudent = {
      id: string;
      gender: string | null;
      ei: number | null;
      sn: number | null;
      tf: number | null;
      pj: number | null;
      personSkills: { skillId: string; level: number }[];
    };
    const allStudents = enrollments.map((e: { student: EnrollmentStudent }) => {
      const profile = e.student.personalityProfile;
      return {
        id: e.student.id,
        gender: e.student.gender,
        ei: profile?.ei ?? null,
        sn: profile?.sn ?? null,
        tf: profile?.tf ?? null,
        pj: profile?.pj ?? null,
        personSkills: e.student.personSkills,
      };
    });
    const students = allStudents
      .filter((s: EnrolledStudent) => submittedStudentIds.has(s.id))
      .filter(hasValidPersonality);

    const totalEnrolled = allStudents.length;
    const n = students.length;
    const notSubmitted = totalEnrolled - submittedStudentIds.size;

    // Check if any students haven't submitted the assignment quiz
    if (notSubmitted > 0) {
      logger.info(
        `[Team Formation] ${notSubmitted} of ${totalEnrolled} students excluded: haven't submitted assignment quiz`
      );
    }

    // Validate minimum students with submissions
    if (submittedStudentIds.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Tidak ada mahasiswa yang telah mengisi kuesioner tugas. Pembentukan kelompok memerlukan minimal 2 mahasiswa yang telah mengisi kuesioner.',
        },
        { status: 400 }
      );
    }

    if (n < 2) {
      return NextResponse.json(
        {
          success: false,
          error: `Hanya ${n} mahasiswa yang telah mengisi kuesioner dan memiliki data kepribadian lengkap. Minimal 2 mahasiswa diperlukan untuk membentuk kelompok.`,
        },
        { status: 400 }
      );
    }

    // Determine skills from DB (no hardcoding):
    // Use union of students' PersonSkill.skillId. If empty, fallback to all Skill ids available.
    type PersonSkill = { skillId: string; level: number };
    let declaredSkillIds: string[] = Array.from(
      new Set(
        students.flatMap((s: PersonalityComplete<EnrolledStudent>) =>
          (s.personSkills || []).map((ps: PersonSkill) => ps.skillId)
        )
      )
    );
    if (declaredSkillIds.length === 0) {
      const allSkills = await prisma.skill.findMany({ select: { id: true } });
      declaredSkillIds = allSkills.map((s: { id: string }) => s.id);
    }
    if (declaredSkillIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Tidak ada skill yang ditemukan di database. Tambahkan skill terlebih dahulu.',
        },
        { status: 400 }
      );
    }

    // Build people payload as required by openapi.json
    // Note: students are already filtered to have valid personality scores
    let fallbackSkillAssigned = 0;
    const people = students.map((s: PersonalityComplete<EnrolledStudent>) => {
      const skills = (s.personSkills || [])
        .filter((ps: PersonSkill) => declaredSkillIds.includes(ps.skillId))
        .map((ps: PersonSkill) => ({
          id: ps.skillId,
          level: Math.max(0, Math.min(1, ps.level)),
        }));
      // Ensure at least one skill so student isn't silently dropped by downstream service
      if (skills.length === 0 && declaredSkillIds.length > 0) {
        skills.push({ id: declaredSkillIds[0], level: 0 });
        fallbackSkillAssigned++;
      }
      return {
        id: s.id,
        gender: normalizeGender(s.gender ?? undefined),
        personality: { ei: s.ei, sn: s.sn, tf: s.tf, pj: s.pj },
        skills,
        preferences: [],
      };
    });
    if (fallbackSkillAssigned > 0) {
      logger.info(
        `[Team Formation] Added fallback skill to ${fallbackSkillAssigned} students lacking skill data`
      );
    }

    // Compute group sizes based on method
    const groupSizes: number[] = [];
    if (method === 'JUMLAH_KELOMPOK') {
      const k = Math.max(1, value);
      // Ensure at least 2 students per group
      if (k > Math.floor(n / 2)) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Jumlah kelompok terlalu banyak. Minimal 2 mahasiswa per kelompok.',
          },
          { status: 400 }
        );
      }
      const base = Math.floor(n / k);
      const rem = n % k;
      for (let i = 0; i < k; i++) groupSizes.push(base + (i < rem ? 1 : 0));
    } else {
      // JUMLAH_MHS_PER_KELOMPOK
      if (value < 2) {
        return NextResponse.json(
          {
            success: false,
            error: 'Minimal 2 mahasiswa per kelompok.',
          },
          { status: 400 }
        );
      }
      const size = value;
      const count = Math.floor(n / size);
      const rem = n % size;
      if (count === 0) {
        // If not enough students for one full group, require at least 2 overall
        if (n < 2) {
          return NextResponse.json(
            {
              success: false,
              error: 'Minimal 2 mahasiswa untuk membentuk kelompok',
            },
            { status: 400 }
          );
        }
        groupSizes.push(n);
      } else {
        for (let i = 0; i < count; i++) groupSizes.push(size);
        for (let i = 0; i < rem; i++) groupSizes[i % groupSizes.length] += 1;
      }
    }
    if (groupSizes.some(sz => sz < 2)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Konfigurasi kelompok tidak valid. Minimal 2 mahasiswa per kelompok.',
        },
        { status: 400 }
      );
    }

    // Optionally load assignment topics and preferences
    const topicQueryStart = performance.now();
    const topics: TopicRecord[] = await prisma.assignmentTopic.findMany({
      where: { assignmentId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    const topicPrefs = topics.length
      ? await prisma.assignmentTopicPreference.findMany({
          where: { assignmentTopicId: { in: topics.map(t => t.id) } },
          select: { assignmentTopicId: true, personId: true, preference: true },
        })
      : [];
    const topicQueryTime = performance.now() - topicQueryStart;
    logger.info(
      `[Team Formation] Topic queries took ${topicQueryTime.toFixed(2)}ms, found ${topics.length} topics, ${topicPrefs.length} preferences`
    );

    const prefsByTopic = new Map<string, TopicPreference[]>();
    for (const p of topicPrefs) {
      const arr = prefsByTopic.get(p.assignmentTopicId) ?? [];
      arr.push({
        personId: p.personId,
        preference: clamp01(p.preference),
      });
      prefsByTopic.set(p.assignmentTopicId, arr);
    }

    // Build tasks payload
    const defaultTaskSkills: TaskSkillRequirement[] = declaredSkillIds.length
      ? declaredSkillIds.map(id => ({ id, level: 0.5, importance: 1 }))
      : [{ id: 'default_skill', level: 0.5, importance: 1 }];

    let tasks = groupSizes.map((sz, idx) => ({
      id: `group-${idx + 1}`,
      skills: defaultTaskSkills,
      teamSize: sz,
    }));

    // Map preferences best-effort to tasks
    if (topics.length > 0 && topics.length === groupSizes.length) {
      // Exact mapping: one topic per group (kept)
      tasks = topics.map((t, i) => ({
        id: t.id,
        skills: defaultTaskSkills,
        teamSize: groupSizes[i],
        preferences: prefsByTopic.get(t.id),
      }));
    } else if (topics.length > 0) {
      const topicBuckets = buildTopicBuckets(topics, groupSizes.length);
      const topicAvgPref = computeTopicAveragePreferences(topics, prefsByTopic);

      tasks = groupSizes.map((sz, index) =>
        buildTaskFromBucket({
          bucketIndex: index,
          bucketTopicIds: topicBuckets[index] ?? [],
          fallbackTopics: topics,
          topicAvgPref,
          prefsByTopic,
          defaultTaskSkills,
          teamSize: sz,
        })
      );
    }

    const weights = getEdu2comWeights(parsedBody.weights);
    const initRandom = false;
    const payload: Edu2comParameters = {
      people,
      tasks,
      initRandom,
      ...weights,
    };

    // Create a TeamFormationRequest log
    const requestId = randomUUID();
    const replyPostUrl = buildEdu2comReplyPostUrl(requestId);
    const dataPreparationTime = performance.now() - startTime;
    logger.info(
      `[Team Formation] Data preparation completed in ${dataPreparationTime.toFixed(2)}ms`
    );

    const createRequestStart = performance.now();
    const tf = await prisma.teamFormationRequest.create({
      data: {
        id: requestId,
        ownerId: ctx.user.id,
        assignmentId,
        status: 'PROCESSING',
        alpha: weights.alpha,
        beta: weights.beta,
        gamma: weights.gamma,
        delta: weights.delta,
        initRandom,
        requestData: payload as unknown as Prisma.InputJsonValue,
        replyPostUrl,
      },
      select: { id: true },
    });
    const createRequestTime = performance.now() - createRequestStart;
    logger.info(
      `[Team Formation] Creating TeamFormationRequest took ${createRequestTime.toFixed(2)}ms`
    );

    // Call official Edu2com API endpoint (background mode)
    const edu2comCallStart = performance.now();
    logger.info('[Team Formation] Calling Edu2com API...');
    const backgroundTimeoutMs = getEdu2comBackgroundTimeoutMs({
      studentCount: students.length,
      taskCount: tasks.length,
    });
    logger.info(
      `[Team Formation] Using background timeout ${backgroundTimeoutMs}ms`
    );
    try {
      const normalizedWeights = normalizeWeights(weights);
      await callEdu2comWithRetry(
        {
          ...payload,
          ...normalizedWeights,
          replyPostUrl,
        },
        { timeoutMs: backgroundTimeoutMs }
      );
      const edu2comCallTime = performance.now() - edu2comCallStart;
      const totalTime = performance.now() - startTime;
      logger.info(
        `[Team Formation] Edu2com API call took ${edu2comCallTime.toFixed(2)}ms`
      );
      logger.info(
        `[Team Formation] Total request time: ${totalTime.toFixed(2)}ms`
      );

      return NextResponse.json({
        success: true,
        data: { requestId: tf.id, status: 'PROCESSING' },
        message:
          'Permintaan pembentukan kelompok sedang diproses di latar belakang. Hasil akan muncul setelah Edu2com selesai.',
      });
    } catch (err) {
      const edu2comCallTime = performance.now() - edu2comCallStart;
      logger.info(
        `[Team Formation] Edu2com API call failed after ${edu2comCallTime.toFixed(2)}ms`
      );
      logger.error('[Team Formation] Edu2com API error:', err);

      const text = err instanceof Error ? err.message : String(err);
      const abort = isAbortError(err);
      const httpError = err instanceof HttpError ? err : undefined;
      const status = abort ? 504 : (httpError?.status ?? 400);
      const userError = abort
        ? 'Permintaan ke Edu2com melebihi batas waktu. Silakan coba lagi.'
        : (httpError?.message ??
          'Gagal mengirim permintaan pembentukan kelompok');
      await prisma.teamFormationRequest.update({
        where: { id: tf.id },
        data: {
          status: 'FAILED',
          errorMessage:
            (abort ? `Timeout contacting Edu2com: ${text}` : text)?.slice(
              0,
              250
            ) || 'Failed to enqueue team formation',
        },
      });
      return NextResponse.json(
        { success: false, error: userError },
        { status }
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
});
