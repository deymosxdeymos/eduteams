'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { AssignmentActions } from '@/components/dashboard/assignment-actions';
import { AssignmentCharts } from '@/components/dashboard/assignment-charts';
import { AssignmentTeamsClient } from '@/components/dashboard/assignment-teams-client';
import { ChartsToggle } from '@/components/dashboard/charts-toggle';
import type { AssignmentStats } from '@/lib/stats/assignment';

interface TeamMemberUser {
  id: string;
  name: string | null;
  email?: string | null;
  mbtiType?: string | null;
  nim?: string | null;
}

interface TeamMemberItem {
  id: string;
  user: TeamMemberUser;
}

interface Team {
  id: string;
  quality?: number | null;
  createdAt: Date;
  members: TeamMemberItem[];
}

interface AssignmentContentProps {
  assignmentId: string;
  classId: string;
  courseId: string;
  canManage: boolean;
  isStudent?: boolean;
  hasSubmitted?: boolean;
  stats: AssignmentStats;
  hasTeams?: boolean;
  topicCount?: number;
  enrollmentCount?: number;
  quizCompletionPercent?: number;
  teams?: Team[];
  topicNames?: Record<string, string>;
  taskIdByIndex?: string[];
  isTeamFormationProcessing?: boolean;
  incompleteStudentCount?: number;
}

export function AssignmentContent({
  assignmentId,
  classId,
  courseId,
  canManage,
  isStudent = false,
  stats,
  hasTeams = false,
  topicCount = 0,
  enrollmentCount = 0,
  quizCompletionPercent = 0,
  teams = [],
  topicNames = {},
  taskIdByIndex = [],
  isTeamFormationProcessing = false,
  incompleteStudentCount = 0,
}: AssignmentContentProps) {
  const t = useTranslations('dashboard.assignment');
  const [searchValue, setSearchValue] = useState('');

  return (
    <div className='flex-1 p-8 min-h-0'>
      <div className='h-full flex flex-col space-y-4 text-gray-500 overflow-y-auto'>
        <AssignmentActions
          assignmentId={assignmentId}
          classId={classId}
          canManage={canManage}
          isStudent={isStudent}
          hasTeams={hasTeams}
          topicCount={topicCount}
          enrollmentCount={enrollmentCount}
          onSearchChange={setSearchValue}
          searchValue={searchValue}
          isTeamFormationProcessing={isTeamFormationProcessing}
          incompleteStudentCount={incompleteStudentCount}
        />

        {isStudent ? (
          hasTeams ? (
            <AssignmentTeamsClient
              teams={teams}
              assignmentId={assignmentId}
              courseId={courseId}
              topicNames={topicNames}
              taskIdByIndex={taskIdByIndex}
              isStudent
              searchValue={searchValue}
              canManage={false}
            />
          ) : (
            <div className='flex-1 flex items-center justify-center'>
              <div className='flex flex-col items-center text-center max-w-xl'>
                <Image
                  src='/waiting-form.svg'
                  alt={t('studentWaiting.alt')}
                  width={120}
                  height={120}
                  className='mb-6'
                  priority
                />
                <h1 className='text-2xl font-bold text-gray-800 mb-2'>
                  {t('studentWaiting.title')}
                </h1>
                <p className='text-gray-600'>
                  {t('studentWaiting.description')}
                </p>
              </div>
            </div>
          )
        ) : (
          <>
            <ChartsToggle
              progressPercent={quizCompletionPercent}
              defaultVisible={!hasTeams}
            >
              <AssignmentCharts stats={stats} isStudent={isStudent} />
            </ChartsToggle>
            <AssignmentTeamsClient
              teams={teams}
              assignmentId={assignmentId}
              courseId={courseId}
              topicNames={topicNames}
              taskIdByIndex={taskIdByIndex}
              searchValue={searchValue}
              canManage={canManage}
            />
          </>
        )}
      </div>
    </div>
  );
}
