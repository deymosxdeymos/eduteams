import type { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  withAuth,
} from '@/lib/api-utils';
import { canAccessMahasiswaFeatures } from '@/lib/authorization';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export const POST = withAuth<{ id: string; assignmentId: string }>(
  async (request: NextRequest, { user, params }) => {
    try {
      const { id: courseId, assignmentId } = await params;

      const isMahasiswa = canAccessMahasiswaFeatures(user);
      if (!isMahasiswa) {
        return createErrorResponse('Access denied', 403);
      }

      // Check if user is enrolled in the course
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          courseId_studentId: { courseId, studentId: user.id },
        },
      });

      if (!enrollment) {
        return createErrorResponse('Not enrolled in this course', 403);
      }

      // Check if assignment exists
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId, courseId },
      });

      if (!assignment) {
        return createErrorResponse('Assignment not found', 404);
      }

      // Check if user has already submitted
      const existingSubmission = await prisma.assignmentSubmission.findUnique({
        where: {
          assignmentId_studentId: { assignmentId, studentId: user.id },
        },
      });

      if (existingSubmission && !existingSubmission.needsUpdate) {
        return createErrorResponse('Already submitted', 400);
      }

      const body = await request.json().catch(() => ({}));

      // New structured shape: arrays of { name, level/preference }
      const ArraysSchema = z.object({
        skills: z
          .array(
            z.object({
              name: z.string().min(1),
              level: z.number().min(0).max(1), // normalized 0..1
            })
          )
          .optional(),
        topics: z
          .array(
            z.object({
              name: z.string().min(1),
              preference: z.number().min(0).max(1), // normalized 0..1
            })
          )
          .optional(),
      });

      const MapsSchema = z.object({
        skillsAnswers: z.record(z.string(), z.number()).optional(), // index->1..5
        topicsAnswers: z.record(z.string(), z.number()).optional(), // index->1..5
      });

      const arraysParse = ArraysSchema.safeParse(body);
      const mapsParse = MapsSchema.safeParse(body);

      // Fetch assignment to recover skills/topics names if needed
      const dbAssignment = await prisma.assignment.findUnique({
        where: { id: assignmentId, courseId },
        select: { id: true, description: true, structureVersion: true },
      });
      if (!dbAssignment)
        return createErrorResponse('Assignment not found', 404);

      let skillsToPersist: Array<{ name: string; level: number }> = [];
      let topicsToPersist: Array<{ name: string; preference: number }> = [];

      // Helper to parse skills/topics from assignment.description JSON if present
      const parsedDesc = (() => {
        try {
          return dbAssignment.description
            ? JSON.parse(dbAssignment.description)
            : null;
        } catch {
          return null;
        }
      })();
      const assignmentSkills: string[] = Array.isArray(parsedDesc?.skills)
        ? parsedDesc?.skills
        : [];
      const assignmentTopics: string[] = Array.isArray(parsedDesc?.topics)
        ? parsedDesc?.topics
        : [];

      if (
        arraysParse.success &&
        (arraysParse.data.skills || arraysParse.data.topics)
      ) {
        skillsToPersist = (arraysParse.data.skills ?? []).map(s => ({
          name: s.name.trim(),
          level: s.level,
        }));
        topicsToPersist = (arraysParse.data.topics ?? []).map(t => ({
          name: t.name.trim(),
          preference: t.preference,
        }));
      } else if (
        mapsParse.success &&
        (mapsParse.data.skillsAnswers || mapsParse.data.topicsAnswers)
      ) {
        // Back-compat: map index-based answers to names from assignment description arrays
        const normalize = (val: number) =>
          Math.max(0, Math.min(1, (val - 1) / 4));
        if (mapsParse.data.skillsAnswers && assignmentSkills.length > 0) {
          skillsToPersist = Object.entries(mapsParse.data.skillsAnswers)
            .map(([k, v]) => ({ index: Number(k.replace(/\D/g, '')), raw: v }))
            .filter(
              x =>
                Number.isFinite(x.index) &&
                assignmentSkills[x.index] !== undefined
            )
            .map(x => ({
              name: String(assignmentSkills[x.index]).trim(),
              level: normalize(x.raw),
            }));
        }
        if (mapsParse.data.topicsAnswers && assignmentTopics.length > 0) {
          topicsToPersist = Object.entries(mapsParse.data.topicsAnswers)
            .map(([k, v]) => ({ index: Number(k.replace(/\D/g, '')), raw: v }))
            .filter(
              x =>
                Number.isFinite(x.index) &&
                assignmentTopics[x.index] !== undefined
            )
            .map(x => ({
              name: String(assignmentTopics[x.index]).trim(),
              preference: normalize(x.raw),
            }));
        }
      } else {
        return createErrorResponse('Missing or invalid answers', 400);
      }

      // Persist efficiently
      // 1) Skills: upsert Skill by name (createMany for missing), then upsert PersonSkill
      const uniqueSkillNames = Array.from(
        new Set(skillsToPersist.map(s => s.name))
      );
      if (uniqueSkillNames.length > 0) {
        const existingSkills = await prisma.skill.findMany({
          where: { name: { in: uniqueSkillNames } },
          select: { id: true, name: true },
        });
        const existingByName = new Map(existingSkills.map(s => [s.name, s.id]));
        const missing = uniqueSkillNames.filter(n => !existingByName.has(n));
        if (missing.length > 0) {
          await prisma.skill.createMany({
            data: missing.map(n => ({ name: n })),
            skipDuplicates: true,
          });
        }
      }
      const allSkills = await prisma.skill.findMany({
        where: { name: { in: uniqueSkillNames } },
        select: { id: true, name: true },
      });
      const nameToSkillId = new Map(allSkills.map(s => [s.name, s.id]));

      // 2) Topics: create/find AssignmentTopic per name
      const uniqueTopicNames = Array.from(
        new Set(topicsToPersist.map(t => t.name))
      );
      let topicNameToId = new Map<string, string>();
      if (uniqueTopicNames.length > 0) {
        let existingTopics: Array<{ id: string; name: string }> = [];
        existingTopics = await prisma.assignmentTopic.findMany({
          where: { assignmentId, name: { in: uniqueTopicNames } },
          select: { id: true, name: true },
        });
        const existingTopicByName = new Map(
          existingTopics.map(t => [t.name, t.id])
        );
        const missingTopics = uniqueTopicNames.filter(
          n => !existingTopicByName.has(n)
        );
        if (missingTopics.length > 0) {
          await prisma.assignmentTopic.createMany({
            data: missingTopics.map(n => ({ assignmentId, name: n })),
            skipDuplicates: true,
          });
        }
        let allTopics: Array<{ id: string; name: string }> = [];
        allTopics = await prisma.assignmentTopic.findMany({
          where: { assignmentId, name: { in: uniqueTopicNames } },
          select: { id: true, name: true },
        });
        topicNameToId = new Map(allTopics.map(t => [t.name, t.id]));
      }

      // 3) Transaction: upsert PersonSkill and AssignmentTopicPreference; upsert submission idempotently
      await prisma.$transaction(async tx => {
        // Upsert skills
        for (const s of skillsToPersist) {
          const skillId = nameToSkillId.get(s.name);
          if (!skillId) continue;
          await tx.personSkill.upsert({
            where: { personId_skillId: { personId: user.id, skillId } },
            update: { level: s.level },
            create: { personId: user.id, skillId, level: s.level },
          });
        }

        // Upsert topic preferences
        for (const t of topicsToPersist) {
          const assignmentTopicId = topicNameToId.get(t.name);
          if (!assignmentTopicId) continue;
          await tx.assignmentTopicPreference.upsert({
            where: {
              assignmentTopicId_personId: {
                assignmentTopicId,
                personId: user.id,
              },
            },
            update: { preference: t.preference },
            create: {
              assignmentTopicId,
              personId: user.id,
              preference: t.preference,
            },
          });
        }

        // Idempotent submission record with current structure version
        await tx.assignmentSubmission.upsert({
          where: {
            assignmentId_studentId: { assignmentId, studentId: user.id },
          },
          update: {
            structureVersion: dbAssignment.structureVersion,
            needsUpdate: false,
          },
          create: {
            assignmentId,
            studentId: user.id,
            structureVersion: dbAssignment.structureVersion,
            needsUpdate: false,
          },
        });
      });

      return createApiResponse({ success: true });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
