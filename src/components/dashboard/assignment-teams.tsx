import { TeamMemberListClient } from '@/components/dashboard/team-member-list-client';
import prisma from '@/lib/prisma';

interface AssignmentTeamsProps {
  assignmentId: string;
}

export async function AssignmentTeams({ assignmentId }: AssignmentTeamsProps) {
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
                select: { id: true, name: true, email: true, mbtiType: true },
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
        .then(rows => new Map(rows.map(r => [r.id, r.name] as const)))
    : new Map<string, string>();

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className='flex flex-col gap-4 pt-4 border-t border-gray-200'>
      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
        {latest.teams.map((team, idx) => {
          const topicName = topicNames.get(taskIdByIndex[idx] || '') || '-';
          const qualityPct =
            team.quality != null ? Math.round(team.quality * 100) : null;
          return (
            <div
              key={team.id}
              className='border rounded-xl shadow-sm p-4 flex flex-col gap-3'
            >
              <div className='flex items-start justify-between gap-3'>
                <h2 className='font-semibold text-lg text-gray-800'>
                  Kelompok {pad(idx + 1)}
                </h2>
                <div className='flex flex-col items-end gap-1 text-sm text-gray-600'>
                  <div className='rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 text-xs'>
                    Kualitas Skor: {qualityPct != null ? `${qualityPct}%` : '-'}
                  </div>
                  <div>Topik Tugas: {topicName}</div>
                </div>
              </div>
              <TeamMemberListClient
                members={team.members.map(m => ({
                  id: m.id,
                  user: {
                    id: m.user.id,
                    name: m.user.name,
                    email: m.user.email,
                    mbtiType: m.user.mbtiType as unknown as string | null,
                  },
                }))}
                courseId={assignment.course.id}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
