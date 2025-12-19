import type { Gender, MBTIType } from '@/generated/prisma/client';
import prisma from '@/lib/prisma';
import type { AssignmentExportData, TeamExportData } from '@/types/export';

// Type definitions for Prisma query results
interface PersonSkillResult {
  skillId: string;
  level: number;
  skill: {
    id: string;
    name: string;
  };
}

interface UserResult {
  id: string;
  name: string;
  email: string;
  nim: string | null;
  gender: Gender | null;
  personalityProfile: {
    mbtiType: MBTIType | null;
    ei: number | null;
    sn: number | null;
    tf: number | null;
    pj: number | null;
  } | null;
  personSkills: PersonSkillResult[];
}

interface MemberResult {
  id: string;
  userId: string;
  assignedSkillIds: string[];
  user: UserResult;
}

interface TeamResult {
  id: string;
  name: string | null;
  quality: number | null;
  taskId: string | null;
  members: MemberResult[];
}

/**
 * Retrieves comprehensive team formation data for export purposes.
 * Includes assignment details, course info, teams, members, skills, and metadata.
 *
 * @param assignmentId - The ID of the assignment
 * @param userId - The ID of the user requesting the export (must be course dosen)
 * @returns AssignmentExportData or null if not found/unauthorized/no teams
 */
export async function getAssignmentExportData(
  assignmentId: string,
  userId: string
): Promise<AssignmentExportData | null> {
  // Fetch assignment with course and verify ownership
  const assignment = await prisma.assignment.findFirst({
    where: {
      id: assignmentId,
      course: {
        dosenId: userId,
      },
    },
    select: {
      id: true,
      title: true,
      startAt: true,
      courseId: true,
      course: {
        select: {
          id: true,
          namaMataKuliah: true,
          kelas: true,
          dosen: {
            select: {
              name: true,
            },
          },
        },
      },
      AssignmentTopic: {
        select: {
          id: true,
          name: true,
        },
      },
      teamFormationRequests: {
        where: {
          status: 'COMPLETED',
        },
        select: {
          id: true,
          completedAt: true,
          updatedAt: true,
          createdAt: true,
          responseData: true,
          teams: {
            select: {
              id: true,
              name: true,
              quality: true,
              taskId: true,
              members: {
                select: {
                  id: true,
                  userId: true,
                  assignedSkillIds: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      nim: true,
                      gender: true,
                      personalityProfile: {
                        select: {
                          mbtiType: true,
                          ei: true,
                          sn: true,
                          tf: true,
                          pj: true,
                        },
                      },
                      personSkills: {
                        select: {
                          skillId: true,
                          level: true,
                          skill: {
                            select: {
                              id: true,
                              name: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
                orderBy: {
                  createdAt: 'asc',
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy: [
          { completedAt: 'desc' },
          { updatedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        take: 1,
      },
    },
  });

  // Return null if assignment not found or user not authorized
  if (!assignment) {
    return null;
  }

  // Return null if no completed team formations exist
  if (assignment.teamFormationRequests.length === 0) {
    return null;
  }

  const teamFormationRequest = assignment.teamFormationRequests[0];

  // Return null if no teams in the formation
  if (teamFormationRequest.teams.length === 0) {
    return null;
  }

  // Create a map of topic IDs to topic names for quick lookup
  const topicMap = new Map<string, string>(
    assignment.AssignmentTopic.map((topic: { id: string; name: string }) => [
      topic.id,
      topic.name,
    ])
  );

  // Derive topic names using taskId information persisted in responseData
  let topicNamesByIndex: Array<string | null> = [];
  try {
    const response = teamFormationRequest.responseData as unknown as {
      teams?: Array<{ taskId?: string | null }>;
    } | null;
    if (response?.teams?.length) {
      topicNamesByIndex = response.teams.map((team): string | null => {
        if (!team?.taskId) return null;
        const match = team.taskId.match(/^(.+)-\d+$/);
        const topicId = match ? match[1] : team.taskId;
        return topicMap.get(topicId) ?? null;
      });
    }
  } catch {
    topicNamesByIndex = [];
  }

  // Transform teams data
  const teams: TeamExportData[] = teamFormationRequest.teams.map(
    (team: TeamResult, index: number) => {
      const topicName =
        topicNamesByIndex[index] ??
        (team.taskId ? topicMap.get(team.taskId) || null : null);

      return {
        teamNumber: index + 1,
        teamName: team.name || `Team ${index + 1}`,
        topicName,
        quality: team.quality,
        members: team.members.map((member: MemberResult) => {
          const profile = member.user.personalityProfile;
          return {
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
            nim: member.user.nim,
            mbtiType: profile?.mbtiType ?? null,
            gender: member.user.gender,
            personalityScores: {
              ei: profile?.ei ?? null,
              sn: profile?.sn ?? null,
              tf: profile?.tf ?? null,
              pj: profile?.pj ?? null,
            },
            skills: member.user.personSkills.map((ps: PersonSkillResult) => ({
              skillId: ps.skill.id,
              skillName: ps.skill.name,
              level: ps.level,
            })),
            assignedSkillIds: member.assignedSkillIds,
          };
        }),
      };
    }
  );

  // Calculate metadata
  const totalStudents = teams.reduce(
    (sum, team) => sum + team.members.length,
    0
  );
  const totalTeams = teams.length;
  const averageTeamSize = totalStudents / totalTeams;

  // Calculate average quality (excluding null values)
  const qualityScores = teams
    .map(team => team.quality)
    .filter((q): q is number => q !== null);
  const averageQuality =
    qualityScores.length > 0
      ? qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length
      : null;

  return {
    assignmentId: assignment.id,
    assignmentTitle: assignment.title,
    courseId: assignment.course.id,
    courseName: assignment.course.namaMataKuliah,
    courseClass: assignment.course.kelas,
    dosenName: assignment.course.dosen.name,
    formationDate:
      teamFormationRequest.completedAt ??
      teamFormationRequest.updatedAt ??
      teamFormationRequest.createdAt ??
      assignment.startAt,
    teams,
    metadata: {
      totalStudents,
      totalTeams,
      averageTeamSize,
      averageQuality,
    },
  };
}
