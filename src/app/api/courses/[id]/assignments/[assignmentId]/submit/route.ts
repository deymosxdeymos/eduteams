import type { NextRequest } from "next/server";
import { z } from "zod";
import { CompetencyKind } from "@/generated/prisma/client";
import { createApiResponse, createErrorResponse, handleApiError, withAuth } from "@/lib/api-utils";
import { canAccessMahasiswaFeatures } from "@/lib/authorization";
import { isActiveDemoAccountEmail } from "@/lib/demo/auth";
import { normalizeTopicKey } from "@/lib/data/student-competency-profiles";
import {
  DEMO_ASSIGNMENT_ID,
  DEMO_COURSE_ID,
  isDemoSandboxUser,
  isLocalDemoAssignmentId,
} from "@/lib/demo/sandbox";
import prisma, { type TransactionClient } from "@/lib/prisma";
import { HttpError } from "@/lib/types";

export const runtime = "nodejs";

export const POST = withAuth<{ id: string; assignmentId: string }>(
  async (request: NextRequest, { user, params }) => {
    try {
      const bodyPromise = request.json().catch(() => ({}));
      const { id: courseId, assignmentId } = await params;

      const isMahasiswa = canAccessMahasiswaFeatures(user);
      if (!isMahasiswa) {
        return createErrorResponse("Access denied", 403);
      }

      if (
        courseId === DEMO_COURSE_ID &&
        isDemoSandboxUser(user) &&
        (assignmentId === DEMO_ASSIGNMENT_ID || isLocalDemoAssignmentId(assignmentId))
      ) {
        return createApiResponse({ success: true });
      }

      const isDemoAccount = isActiveDemoAccountEmail(user.email);

      const [body, enrollment, assignment, existingSubmission] = await Promise.all([
        bodyPromise,
        prisma.courseEnrollment.findUnique({
          where: {
            courseId_studentId: { courseId, studentId: user.id },
          },
        }),
        prisma.assignment.findUnique({
          where: { id: assignmentId, courseId },
          select: { id: true, description: true, structureVersion: true },
        }),
        prisma.assignmentSubmission.findUnique({
          where: {
            assignmentId_studentId: { assignmentId, studentId: user.id },
          },
        }),
      ]);

      if (!enrollment) {
        return createErrorResponse("Not enrolled in this course", 403);
      }

      if (!assignment) {
        return createErrorResponse("Assignment not found", 404);
      }

      if (existingSubmission && !existingSubmission.needsUpdate) {
        return createErrorResponse("Already submitted", 400);
      }

      // New structured shape: arrays of { name, level/preference }
      const ArraysSchema = z.object({
        skills: z
          .array(
            z.object({
              name: z.string().min(1),
              level: z.number().min(0).max(1), // normalized 0..1
              profileId: z.string().uuid().optional(),
              profileUpdatedAt: z.string().optional(),
            }),
          )
          .optional(),
        topics: z
          .array(
            z.object({
              name: z.string().min(1),
              preference: z.number().min(0).max(1), // normalized 0..1
              profileId: z.string().uuid().optional(),
              profileUpdatedAt: z.string().optional(),
            }),
          )
          .optional(),
      });

      const MapsSchema = z.object({
        skillsAnswers: z.record(z.string(), z.number()).optional(), // index->1..5
        topicsAnswers: z.record(z.string(), z.number()).optional(), // index->1..5
      });

      const arraysParse = ArraysSchema.safeParse(body);
      const mapsParse = MapsSchema.safeParse(body);

      // Use already fetched assignment data
      const dbAssignment = assignment;

      let skillsToPersist: Array<{
        name: string;
        level: number;
        profileId?: string;
        profileUpdatedAt?: string;
      }> = [];
      let topicsToPersist: Array<{
        name: string;
        preference: number;
        profileId?: string;
        profileUpdatedAt?: string;
      }> = [];

      // Helper to parse skills/topics from assignment.description JSON if present
      const parsedDesc = (() => {
        try {
          return dbAssignment.description ? JSON.parse(dbAssignment.description) : null;
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

      if (arraysParse.success && (arraysParse.data.skills || arraysParse.data.topics)) {
        skillsToPersist = (arraysParse.data.skills ?? []).map((s) => ({
          name: s.name.trim(),
          level: s.level,
          profileId: s.profileId,
          profileUpdatedAt: s.profileUpdatedAt,
        }));
        topicsToPersist = (arraysParse.data.topics ?? []).map((t) => ({
          name: t.name.trim(),
          preference: t.preference,
          profileId: t.profileId,
          profileUpdatedAt: t.profileUpdatedAt,
        }));
      } else if (
        mapsParse.success &&
        (mapsParse.data.skillsAnswers || mapsParse.data.topicsAnswers)
      ) {
        // Back-compat: map index-based answers to names from assignment description arrays
        const normalize = (val: number) => Math.max(0, Math.min(1, (val - 1) / 4));
        if (mapsParse.data.skillsAnswers && assignmentSkills.length > 0) {
          skillsToPersist = Object.entries(mapsParse.data.skillsAnswers)
            .map(([k, v]) => ({ index: Number(k.replace(/\D/g, "")), raw: v }))
            .filter((x) => Number.isFinite(x.index) && assignmentSkills[x.index] !== undefined)
            .map((x) => ({
              name: String(assignmentSkills[x.index]).trim(),
              level: normalize(x.raw),
            }));
        }
        if (mapsParse.data.topicsAnswers && assignmentTopics.length > 0) {
          topicsToPersist = Object.entries(mapsParse.data.topicsAnswers)
            .map(([k, v]) => ({ index: Number(k.replace(/\D/g, "")), raw: v }))
            .filter((x) => Number.isFinite(x.index) && assignmentTopics[x.index] !== undefined)
            .map((x) => ({
              name: String(assignmentTopics[x.index]).trim(),
              preference: normalize(x.raw),
            }));
        }
      } else {
        return createErrorResponse("Missing or invalid answers", 400);
      }

      skillsToPersist = Array.from(
        new Map(skillsToPersist.map((skill) => [skill.name, skill])).values(),
      );
      topicsToPersist = Array.from(
        new Map(topicsToPersist.map((topic) => [topic.name, topic])).values(),
      );

      const uniqueSkillNames = Array.from(new Set(skillsToPersist.map((s) => s.name)));
      const uniqueTopicNames = Array.from(new Set(topicsToPersist.map((t) => t.name)));

      const [nameToSkillId, topicNameToId] = await Promise.all([
        (async () => {
          if (uniqueSkillNames.length === 0) {
            return new Map<string, string>();
          }

          const existingSkills = await prisma.skill.findMany({
            where: { name: { in: uniqueSkillNames } },
            select: { id: true, name: true },
          });
          const existingByName = new Map(
            existingSkills.map((s: { id: string; name: string }) => [s.name, s.id]),
          );
          const missing = uniqueSkillNames.filter((n) => !existingByName.has(n));

          if (missing.length > 0 && !isDemoAccount) {
            await prisma.skill.createMany({
              data: missing.map((n) => ({ name: n })),
              skipDuplicates: true,
            });
          }

          const allSkills =
            missing.length > 0
              ? await prisma.skill.findMany({
                  where: { name: { in: uniqueSkillNames } },
                  select: { id: true, name: true },
                })
              : existingSkills;

          return new Map<string, string>(
            allSkills.map((s: { id: string; name: string }) => [s.name, s.id]),
          );
        })(),
        (async () => {
          if (uniqueTopicNames.length === 0) {
            return new Map<string, string>();
          }

          const existingTopics = await prisma.assignmentTopic.findMany({
            where: { assignmentId, name: { in: uniqueTopicNames } },
            select: { id: true, name: true },
          });
          const existingTopicByName = new Map(
            existingTopics.map((topic: { id: string; name: string }) => [topic.name, topic.id]),
          );
          const missingTopics = uniqueTopicNames.filter((name) => !existingTopicByName.has(name));

          if (missingTopics.length > 0) {
            await prisma.assignmentTopic.createMany({
              data: missingTopics.map((name) => ({ assignmentId, name })),
              skipDuplicates: true,
            });
          }

          const allTopics =
            missingTopics.length > 0
              ? await prisma.assignmentTopic.findMany({
                  where: { assignmentId, name: { in: uniqueTopicNames } },
                  select: { id: true, name: true },
                })
              : existingTopics;

          return new Map<string, string>(
            allTopics.map((topic: { id: string; name: string }) => [topic.name, topic.id]),
          );
        })(),
      ]);

      const topicKeyByName = new Map<string, string>();
      for (const topic of topicsToPersist) {
        if (!topicKeyByName.has(topic.name)) {
          topicKeyByName.set(topic.name, normalizeTopicKey(topic.name));
        }
      }

      await prisma.$transaction(async (tx: TransactionClient) => {
        await Promise.all(
          skillsToPersist.map(async (s) => {
            const skillId = nameToSkillId.get(s.name);
            if (!skillId) {
              return;
            }

            await tx.personSkill.upsert({
              where: { personId_skillId: { personId: user.id, skillId } },
              update: { level: s.level },
              create: { personId: user.id, skillId, level: s.level },
            });

            const profileData = {
              value: s.level,
              sourceAssignmentId: assignmentId,
            };
            const profileUnique = {
              studentId_competencyKind_skillId: {
                studentId: user.id,
                competencyKind: CompetencyKind.SKILL,
                skillId,
              },
            } as const;

            if (s.profileId) {
              const baseWhere = {
                id: s.profileId,
                studentId: user.id,
                competencyKind: CompetencyKind.SKILL,
                skillId,
              } as const;

              if (s.profileUpdatedAt) {
                const expected = new Date(s.profileUpdatedAt);
                if (Number.isNaN(expected.getTime())) {
                  throw new HttpError(
                    400,
                    "Profil kompetensi tidak valid.",
                    "INVALID_PROFILE_VERSION",
                  );
                }
                const updated = await tx.studentCompetencyProfile.updateMany({
                  where: { ...baseWhere, updatedAt: expected },
                  data: profileData,
                });
                if (updated.count === 0) {
                  throw new HttpError(
                    409,
                    "Profil kompetensi telah berubah. Silakan muat ulang halaman.",
                    "COMPETENCY_CONFLICT",
                  );
                }
                return;
              }

              const updated = await tx.studentCompetencyProfile.updateMany({
                where: baseWhere,
                data: profileData,
              });
              if (updated.count === 0) {
                await tx.studentCompetencyProfile.upsert({
                  where: profileUnique,
                  update: profileData,
                  create: {
                    studentId: user.id,
                    competencyKind: CompetencyKind.SKILL,
                    skillId,
                    value: s.level,
                    sourceAssignmentId: assignmentId,
                  },
                });
              }
              return;
            }

            await tx.studentCompetencyProfile.upsert({
              where: profileUnique,
              update: profileData,
              create: {
                studentId: user.id,
                competencyKind: CompetencyKind.SKILL,
                skillId,
                value: s.level,
                sourceAssignmentId: assignmentId,
              },
            });
          }),
        );

        await Promise.all(
          topicsToPersist.map(async (t) => {
            const assignmentTopicId = topicNameToId.get(t.name);
            if (!assignmentTopicId) {
              return;
            }

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

            const topicKey = topicKeyByName.get(t.name);
            if (!topicKey) {
              return;
            }

            const topicProfileData = {
              value: t.preference,
              topicKey,
              sourceAssignmentId: assignmentId,
            };
            const topicProfileUnique = {
              studentId_competencyKind_topicKey: {
                studentId: user.id,
                competencyKind: CompetencyKind.TOPIC,
                topicKey,
              },
            } as const;

            if (t.profileId) {
              const baseWhere = {
                id: t.profileId,
                studentId: user.id,
                competencyKind: CompetencyKind.TOPIC,
                topicKey,
              } as const;

              if (t.profileUpdatedAt) {
                const expected = new Date(t.profileUpdatedAt);
                if (Number.isNaN(expected.getTime())) {
                  throw new HttpError(
                    400,
                    "Profil kompetensi tidak valid.",
                    "INVALID_PROFILE_VERSION",
                  );
                }
                const updated = await tx.studentCompetencyProfile.updateMany({
                  where: { ...baseWhere, updatedAt: expected },
                  data: topicProfileData,
                });
                if (updated.count === 0) {
                  throw new HttpError(
                    409,
                    "Profil kompetensi telah berubah. Silakan muat ulang halaman.",
                    "COMPETENCY_CONFLICT",
                  );
                }
                return;
              }

              const updated = await tx.studentCompetencyProfile.updateMany({
                where: baseWhere,
                data: topicProfileData,
              });
              if (updated.count === 0) {
                await tx.studentCompetencyProfile.upsert({
                  where: topicProfileUnique,
                  update: topicProfileData,
                  create: {
                    studentId: user.id,
                    competencyKind: CompetencyKind.TOPIC,
                    topicKey,
                    value: t.preference,
                    sourceAssignmentId: assignmentId,
                  },
                });
              }
              return;
            }

            await tx.studentCompetencyProfile.upsert({
              where: topicProfileUnique,
              update: topicProfileData,
              create: {
                studentId: user.id,
                competencyKind: CompetencyKind.TOPIC,
                topicKey,
                value: t.preference,
                sourceAssignmentId: assignmentId,
              },
            });
          }),
        );

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
  },
  { allowDemoSandbox: true },
);
