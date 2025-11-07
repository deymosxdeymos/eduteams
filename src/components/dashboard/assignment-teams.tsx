import { AssignmentTeamsClient } from '@/components/dashboard/assignment-teams-client';
import prisma from '@/lib/prisma';

interface AssignmentTeamsProps {
  assignmentId: string;
  isStudent?: boolean;
  searchValue?: string;
  canManage?: boolean;
}

export async function AssignmentTeams({
  assignmentId,
  isStudent = false,
  searchValue = '',
  canManage = false,
}: AssignmentTeamsProps) {
  // Load assignment to infer owner/time window
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      startAt: true,
      course: { select: { dosenId: true, id: true } },
    },
  });
  if (!assignment) return null;

  const latest = await prisma.teamFormationRequest.findFirst({
    where: {
      ownerId: assignment.course.dosenId,
      createdAt: { gte: assignment.startAt },
      status: 'COMPLETED',
    },
    orderBy: { createdAt: 'desc' },
    include: {
      teams: {
        orderBy: { createdAt: 'asc' },
        include: {
          members: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  mbtiType: true,
                  nimNpm: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!latest || latest.teams.length === 0) return null;

  // Try to extract taskId mapping from responseData
  let taskIdByIndex: string[] = [];
  try {
    const resp = latest.responseData as unknown as {
      teams?: Array<{ taskId: string }>;
    } | null;
    if (resp?.teams?.length) {
      taskIdByIndex = resp.teams.map(t => t.taskId);
    }
  } catch {
    // ignore
  }

  // If taskId looks like assignmentTopic id, fetch names
  const topicNames = taskIdByIndex.length
    ? await prisma.assignmentTopic
        .findMany({
          where: { assignmentId, id: { in: taskIdByIndex } },
          select: { id: true, name: true },
        })
        .then(rows => Object.fromEntries(rows.map(r => [r.id, r.name] as const)))
    : {};

  return (
    <AssignmentTeamsClient
      teams={latest.teams.map(team => ({
        id: team.id,
        quality: team.quality,
        createdAt: team.createdAt,
        members: team.members.map(m => ({
          id: m.id,
          user: {
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            mbtiType: m.user.mbtiType,
            nimNpm: m.user.nimNpm,
          },
        })),
      }))}
      assignmentId={assignmentId}
      courseId={assignment.course.id}
      topicNames={topicNames}
      taskIdByIndex={taskIdByIndex}
      isStudent={isStudent}
      searchValue={searchValue}
      canManage={canManage}
    />
  );
}
