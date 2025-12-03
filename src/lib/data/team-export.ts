import prisma from '@/lib/prisma';
import type { AssignmentExportData } from '@/types/export';

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
                      mbtiType: true,
                      gender: true,
                      ei: true,
                      sn: true,
                      tf: true,
                      pj: true,
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

  if (teamFormationRequest.teams.length === 0) {
    return null;
  }

  const topicMap = new Map(
    assignment.AssignmentTopic.map(topic => [topic.id, topic.name])
  );

  // Derive topic names using taskId information persisted in responseData
  let topicNamesByIndex: Array<string | null> = [];
  try {
    const response = teamFormationRequest.responseData as unknown as {
      teams?: Array<{ taskId?: string | null }>;
    } | null;
    if (response?.teams?.length) {
      topicNamesByIndex = response.teams.map(team => {
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
  const teams = teamFormationRequest.teams.map((team, index) => {
    const topicName =
      topicNamesByIndex[index] ??
      (team.taskId ? topicMap.get(team.taskId) || null : null);

    return {
      teamNumber: index + 1,
      teamName: team.name || `Team ${index + 1}`,
      topicName,
      quality: team.quality,
      members: team.members.map(member => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        nim: member.user.nim,
        mbtiType: member.user.mbtiType,
        gender: member.user.gender,
        personalityScores: {
          ei: member.user.ei,
          sn: member.user.sn,
          tf: member.user.tf,
          pj: member.user.pj,
        },
        skills: member.user.personSkills.map(ps => ({
          skillId: ps.skill.id,
          skillName: ps.skill.name,
          level: ps.level,
        })),
        assignedSkillIds: member.assignedSkillIds,
      })),
    };
  });

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
