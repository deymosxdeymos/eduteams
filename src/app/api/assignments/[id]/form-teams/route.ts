import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@/generated/prisma';
import { handleApiError, withRole } from '@/lib/api-utils';
import { DASHBOARD_STATISTICS_TAG } from '@/lib/dashboard/statistics';
import { callEdu2comTeamFormation } from '@/lib/edu2com/api';
import type { Edu2comParameters } from '@/lib/edu2com/contract';
import prisma from '@/lib/prisma';
import { ValidationError } from '@/lib/utils/errors';

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

const BODY_SCHEMA = z
  .object({
    method: z.enum(['JUMLAH_KELOMPOK', 'JUMLAH_MHS_PER_KELOMPOK']),
    value: z.number().int().min(1),
  })
  .strict();

export const runtime = 'nodejs';

// POST /api/assignments/[id]/form-teams
export const POST = withRole<{ id: string }>('dosen', async (req, ctx) => {
  try {
    const { id: assignmentId } = await ctx.params;

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

    // Verify assignment and ownership
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        courseId: true,
        course: { select: { dosenId: true } },
        description: true,
      },
    });
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

    // Gather enrolled students for the course
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId: assignment.courseId },
      select: {
        student: {
          select: {
            id: true,
            gender: true,
            ei: true,
            sn: true,
            tf: true,
            pj: true,
            personSkills: { select: { skillId: true, level: true } },
          },
        },
      },
    });

    const students = enrollments.map(e => e.student);
    const n = students.length;
    if (n < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Minimal 2 mahasiswa untuk membentuk kelompok',
        },
        { status: 400 }
      );
    }

    // Determine skills from DB (no hardcoding):
    // Use union of students' PersonSkill.skillId. If empty, fallback to all Skill ids available.
    let declaredSkillIds: string[] = Array.from(
      new Set(
        students.flatMap(s => (s.personSkills || []).map(ps => ps.skillId))
      )
    );
    if (declaredSkillIds.length === 0) {
      const allSkills = await prisma.skill.findMany({ select: { id: true } });
      declaredSkillIds = allSkills.map(s => s.id);
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
    const people = students.map(s => ({
      id: s.id,
      gender: normalizeGender(s.gender ?? undefined),
      personality: {
        ei: Number.isFinite(s.ei ?? 0) ? (s.ei ?? 0) : 0,
        sn: Number.isFinite(s.sn ?? 0) ? (s.sn ?? 0) : 0,
        tf: Number.isFinite(s.tf ?? 0) ? (s.tf ?? 0) : 0,
        pj: Number.isFinite(s.pj ?? 0) ? (s.pj ?? 0) : 0,
      },
      skills: (s.personSkills || [])
        .filter(ps => declaredSkillIds.includes(ps.skillId))
        .map(ps => ({
          id: ps.skillId,
          level: Math.max(0, Math.min(1, ps.level)),
        })),
      preferences: [], // person-to-person preferences not collected in this flow
    }));

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
    const topics = await prisma.assignmentTopic.findMany({
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
    const prefsByTopic = new Map<
      string,
      Array<{ personId: string; preference: number }>
    >();
    for (const p of topicPrefs) {
      const arr = prefsByTopic.get(p.assignmentTopicId) ?? [];
      arr.push({
        personId: p.personId,
        preference: Math.max(0, Math.min(1, p.preference)),
      });
      prefsByTopic.set(p.assignmentTopicId, arr);
    }

    // Build tasks payload
    const defaultTaskSkills = declaredSkillIds.length
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
      // Best‑effort mapping when topic count ≠ group count.
      // Strategy: distribute topics into k buckets; for each bucket, pick a representative
      // topic (highest average preference) and use its AssignmentTopic.id as the task id
      // so the UI can display a topic instead of '-'. Preferences are aggregated per bucket.
      const k = groupSizes.length;
      const buckets: string[][] = Array.from({ length: k }, () => []);
      for (let i = 0; i < topics.length; i++) {
        const t = topics[i];
        if (t) buckets[i % k].push(t.id);
      }

      // Pre-compute average preference for each topic for representative selection
      const topicAvgPref = new Map<string, number>();
      for (const t of topics) {
        const prefs = prefsByTopic.get(t.id) || [];
        if (prefs.length === 0) {
          topicAvgPref.set(t.id, 0);
        } else {
          const avg =
            prefs.reduce((a, b) => a + b.preference, 0) / prefs.length;
          topicAvgPref.set(t.id, Math.max(0, Math.min(1, avg)));
        }
      }

      const prefsByBucket: Array<
        Array<{ personId: string; preference: number }>
      > = [];
      const representativeTopicId: string[] = [];

      for (let i = 0; i < k; i++) {
        const topicIds = buckets[i] ?? [];

        // Aggregate preferences for the bucket
        const prefPerPerson = new Map<string, number[]>();
        for (const topicId of topicIds) {
          const prefs = prefsByTopic.get(topicId) || [];
          for (const p of prefs) {
            const arr = prefPerPerson.get(p.personId) ?? [];
            arr.push(p.preference);
            prefPerPerson.set(p.personId, arr);
          }
        }
        const merged: Array<{ personId: string; preference: number }> = [];
        for (const [personId, arr] of prefPerPerson) {
          const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
          merged.push({ personId, preference: Math.max(0, Math.min(1, avg)) });
        }
        prefsByBucket.push(merged);

        // Choose representative topic for this bucket
        if (topicIds.length > 0) {
          let bestId = topicIds[0];
          let bestScore = topicAvgPref.get(bestId) ?? 0;
          for (let j = 1; j < topicIds.length; j++) {
            const tid = topicIds[j];
            const score = topicAvgPref.get(tid) ?? 0;
            if (score > bestScore) {
              bestId = tid;
              bestScore = score;
            }
          }
          representativeTopicId.push(bestId);
        } else {
          // If the bucket is empty (happens when topics < k), fall back to any topic
          // to ensure a visible topic in UI. Use a stable round‑robin pick.
          const fallback = topics[i % topics.length]?.id ?? topics[0]?.id;
          representativeTopicId.push(fallback as string);
        }
      }

      tasks = groupSizes.map((sz, i) => ({
        // Ensure task IDs remain unique even if the same topic is reused
        id: `${representativeTopicId[i]}-${i + 1}`,
        skills: defaultTaskSkills,
        teamSize: sz,
        preferences: prefsByBucket[i]?.length ? prefsByBucket[i] : undefined,
      }));
    }

    const payload: Edu2comParameters = {
      people,
      tasks,
      initRandom: false,
    };

    // Create a TeamFormationRequest log
    const tf = await prisma.teamFormationRequest.create({
      data: {
        ownerId: ctx.user.id,
        status: 'PROCESSING',
        requestData: payload as unknown as Prisma.InputJsonValue,
      },
      select: { id: true },
    });

    // Call official Edu2com API endpoint
    try {
      const data = await callEdu2comTeamFormation(payload);

      // Persist team results
      const created = await prisma.teamFormationRequest.update({
        where: { id: tf.id },
        data: {
          status: 'COMPLETED',
          responseData: data as unknown as Prisma.InputJsonValue,
          teams: {
            create: data.teams.map((t, i) => ({
              name: `Kelompok ${i + 1}`,
              quality: t.quality ?? null,
              members: {
                create: t.people.map(p => ({
                  userId: p.id,
                  assignedSkillIds: p.skillIds ?? [],
                })),
              },
            })),
          },
        },
        select: { id: true },
      });

      // Optionally, update assignment status
      try {
        await prisma.assignment.update({
          where: { id: assignmentId },
          data: { status: 'BERHASIL_PEMBAGIAN_GRUP' },
        });
      } catch {
        // Optional field; ignore if not present in schema
      }

      revalidateTag(DASHBOARD_STATISTICS_TAG);
      return NextResponse.json({
        success: true,
        data: { requestId: created.id },
      });
    } catch (err) {
      const text = err instanceof Error ? err.message : String(err);
      await prisma.teamFormationRequest.update({
        where: { id: tf.id },
        data: {
          status: 'FAILED',
          errorMessage: text?.slice(0, 250) || 'Failed to form teams',
        },
      });
      return NextResponse.json(
        { success: false, error: 'Gagal membentuk kelompok' },
        { status: 400 }
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
});
