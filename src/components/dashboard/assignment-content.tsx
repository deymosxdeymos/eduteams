import Image from 'next/image';
import { AssignmentActions } from '@/components/dashboard/assignment-actions';
import { AssignmentCharts } from '@/components/dashboard/assignment-charts';
import { AssignmentTeams } from '@/components/dashboard/assignment-teams';
import { ChartsToggle } from '@/components/dashboard/charts-toggle';
import prisma from '@/lib/prisma';
import type { AssignmentStats } from '@/lib/stats/assignment';
import { getDictionary } from '@/i18n/get-dictionary';
import { getClientLocaleFromCookie, onLocaleChange } from '@/i18n/client';
import type { Locale } from '@/i18n/config';
import { useEffect, useState } from 'react';

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
  const [topics, enrollments, assignment] = (await Promise.all([
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
        course: { select: { dosenId: true } },
      },
    }),
  ])) as unknown as [
    Array<{ id: string }>,
    Array<{ studentId: string }>,
    { id: string; startAt: Date; course: { dosenId: string } } | null,
  ];

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

  // Client-only i18n messages for static texts inside JSX
  // biome-ignore lint/suspicious/noExplicitAny: dynamic messages
  const [messages, setMessages] = ((): [Record<string, any> | null, any] => {
    // Prevent React hooks on server by lazy initializing no-op state
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useState<Record<string, any> | null>(null);
    } catch {
      return [null, () => {}];
    }
  })();

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const load = async (l: Locale) => {
        const dict = await getDictionary(l);
        setMessages(dict);
      };
      load(getClientLocaleFromCookie());
      const unsub = onLocaleChange(l => load(l));
      return unsub;
    }, []);
  } catch {}

  return (
    <div className='flex-1 p-8 min-h-0'>
      <div className='h-full flex flex-col space-y-4 text-gray-500 overflow-y-auto'>
        <AssignmentActions
          assignmentId={assignmentId}
          classId={classId}
          canManage={canManage}
          isStudent={isStudent}
          hasTeams={percentAssigned > 0}
          topicCount={topics.length}
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
                  alt={
                    messages?.dashboard?.assignment?.studentWaiting?.alt ||
                    'Menunggu pembagian kelompok'
                  }
                  width={120}
                  height={120}
                  className='mb-6'
                  priority
                />
                <h1 className='text-2xl font-bold text-gray-800 mb-2'>
                  {messages?.dashboard?.assignment?.studentWaiting?.title ||
                    'Menunggu pembagian kelompok!'}
                </h1>
                <p className='text-gray-600'>
                  {messages?.dashboard?.assignment?.studentWaiting
                    ?.description ||
                    'Tenang, datamu sudah terekam dengan baik. Tunggu sebentar ya, dosen sedang memproses pembagian kelompok.'}
                </p>
              </div>
            </div>
          )
        ) : (
          <>
            <ChartsToggle percentAssigned={percentAssigned}>
              <AssignmentCharts stats={stats} isStudent={isStudent} />
            </ChartsToggle>
            <AssignmentTeams assignmentId={assignmentId} />
          </>
        )}
      </div>
    </div>
  );
}
