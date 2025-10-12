import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { AssignmentActions } from '@/components/dashboard/assignment-actions';
import { AssignmentCharts } from '@/components/dashboard/assignment-charts';
import { AssignmentTeams } from '@/components/dashboard/assignment-teams';
import { ChartsToggle } from '@/components/dashboard/charts-toggle';
import prisma from '@/lib/prisma';
import type { AssignmentStats } from '@/lib/stats/assignment';

interface AssignmentContentProps {
  assignmentId: string;
  classId: string;
  canManage: boolean;
  isStudent?: boolean;
  hasSubmitted?: boolean;
  stats: AssignmentStats;
}

export async function AssignmentContent({
  assignmentId,
  classId,
  canManage,
  isStudent = false,
  stats,
}: AssignmentContentProps) {
  // Server-side: gather counts for UI and teams percentage
  // Topics count and enrollments
  const [topicRecords, enrollments, assignment] = await Promise.all([
    prisma.assignmentTopic.findMany({
      where: { assignmentId },
      select: { id: true },
    }),
    prisma.courseEnrollment.findMany({
      where: { courseId: classId },
      select: { studentId: true },
    }),
    prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: {
        id: true,
        startAt: true,
        description: true,
        course: { select: { dosenId: true } },
      },
    }),
  ]);

  // Topics are optional: prefer the assignment's current description JSON;
  // fall back to historical topic records only if parsing fails.
  let topicCount = 0;
  if (assignment?.description) {
    try {
      const parsed = JSON.parse(assignment.description) as {
        topics?: unknown;
      };
      if (Array.isArray(parsed?.topics)) {
        topicCount = parsed.topics
          .map(topic => (typeof topic === 'string' ? topic.trim() : ''))
          .filter(Boolean).length;
      } else {
        topicCount = 0;
      }
    } catch {
      topicCount = topicRecords.length;
    }
  } else {
    topicCount = topicRecords.length;
  }

  let percentAssigned = 0;
  if (assignment) {
    const latest = await prisma.teamFormationRequest.findFirst({
      where: {
        ownerId: assignment.course.dosenId,
        createdAt: { gte: assignment.startAt },
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        teams: { include: { members: true } },
      },
    });
    if (latest) {
      const memberIds = new Set(
        latest.teams.flatMap(t => t.members.map(m => m.userId))
      );
      const total = enrollments.length;
      percentAssigned =
        total > 0 ? Math.round((memberIds.size / total) * 100) : 0;
    }
  }

  const t = await getTranslations('dashboard.assignment.studentWaiting');
  const totalEnrollments = enrollments.length;
  const quizCompletionPercent = totalEnrollments
    ? Math.round(
        (Math.min(stats.quizSubmissions, totalEnrollments) / totalEnrollments) *
          100
      )
    : 0;

  return (
    <div className='flex-1 p-8 min-h-0'>
      <div className='h-full flex flex-col space-y-4 text-gray-500 overflow-y-auto'>
        <AssignmentActions
          assignmentId={assignmentId}
          classId={classId}
          canManage={canManage}
          isStudent={isStudent}
          hasTeams={percentAssigned > 0}
          topicCount={topicCount}
          enrollmentCount={enrollments.length}
        />

        {isStudent ? (
          percentAssigned > 0 ? (
            <AssignmentTeams assignmentId={assignmentId} isStudent />
          ) : (
            <div className='flex-1 flex items-center justify-center'>
              <div className='flex flex-col items-center text-center max-w-xl'>
                <Image
                  src='/waiting-form.svg'
                  alt={t('alt')}
                  width={120}
                  height={120}
                  className='mb-6'
                  priority
                />
                <h1 className='text-2xl font-bold text-gray-800 mb-2'>
                  {t('title')}
                </h1>
                <p className='text-gray-600'>{t('description')}</p>
              </div>
            </div>
          )
        ) : (
          <>
            <ChartsToggle progressPercent={quizCompletionPercent}>
              <AssignmentCharts stats={stats} isStudent={isStudent} />
            </ChartsToggle>
            <AssignmentTeams assignmentId={assignmentId} />
          </>
        )}
      </div>
    </div>
  );
}
