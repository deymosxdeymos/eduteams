'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { AssignmentActions } from '@/components/dashboard/assignment-actions';
import { AssignmentCharts } from '@/components/dashboard/assignment-charts';
import { AssignmentTeamsClient } from '@/components/dashboard/assignment-teams-client';
import { ChartsToggle } from '@/components/dashboard/charts-toggle';
import { TeamFormationLoading } from '@/components/dashboard/team-formation-loading';
import { Button } from '@/components/ui/button';
import type { Gender } from '@/generated/prisma';
import { useTeamFormationStatus } from '@/hooks/use-team-formation-status';
import { useRouter } from '@/i18n/routing';
import type { AssignmentStats } from '@/lib/stats/assignment';

interface TeamMemberUser {
  id: string;
  name: string | null;
  email?: string | null;
  mbtiType?: string | null;
  nim?: string | null;
  ei?: number | null;
  sn?: number | null;
  tf?: number | null;
  pj?: number | null;
  gender?: Gender | null;
}

interface TeamMemberItem {
  id: string;
  assignedSkillIds?: string[] | null;
  topSkills?: string[];
  preferredTopics?: string[];
  user: TeamMemberUser;
}

interface Team {
  id: string;
  quality?: number | null;
  createdAt: Date;
  members: TeamMemberItem[];
}

interface EnrolledStudent {
  id: string;
  name: string | null;
  nim: string | null;
  email: string | null;
  mbtiType: string | null;
  gender: string | null;
}

interface AssignmentContentProps {
  assignmentId: string;
  classId: string;
  courseId: string;
  assignmentTitleLabel: string;
  courseNameLabel: string;
  courseClassLabel: string;
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
  currentUserId?: string;
  enrolledStudents?: EnrolledStudent[];
  submittedStudentIds?: Set<string>;
  retryFormationModalSignal?: number;
}

export function AssignmentContent({
  assignmentId,
  classId,
  courseId,
  assignmentTitleLabel,
  courseNameLabel,
  courseClassLabel,
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
  currentUserId,
  enrolledStudents = [],
  submittedStudentIds = new Set(),
}: AssignmentContentProps) {
  const t = useTranslations('dashboard.assignment');
  const tTeams = useTranslations('dashboard.teams');
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [showError, setShowError] = useState(false);
  const [retryModalSignal, setRetryModalSignal] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saveTrigger, setSaveTrigger] = useState(0);
  const [pendingAdditionIds, setPendingAdditionIds] = useState<Set<string>>(
    new Set()
  );
  const [isSaving, setIsSaving] = useState(false);

  const allAssignedStudentIds = new Set(
    teams.flatMap(team => team.members.map(m => m.user.id))
  );
  // Calculate missing students (enrolled but not in teams)
  const missingStudents = enrolledStudents.filter(
    student => !allAssignedStudentIds.has(student.id)
  );
  const visibleMissingStudents = missingStudents.filter(
    student => !pendingAdditionIds.has(student.id)
  );
  const adjustedIncompleteCount = visibleMissingStudents.length;

  const shouldFetchStatus = !isStudent;
  const shouldPollStatus = shouldFetchStatus && isTeamFormationProcessing;

  // Poll for team formation status for teachers; only keep interval while processing
  const { status, errorMessage } = useTeamFormationStatus({
    assignmentId,
    enabled: shouldFetchStatus,
    shouldPoll: shouldPollStatus,
    onComplete: () => {
      // Auto-refresh when team formation completes
      router.refresh();
    },
    onFailed: error => {
      // Show error message inline
      setShowError(true);
      console.error('Team formation failed:', error);
    },
  });

  useEffect(() => {
    if (status !== 'FAILED' && showError) {
      setShowError(false);
    }
  }, [status, showError]);

  const handleRetry = () => {
    setShowError(false);
    setRetryModalSignal(prev => prev + 1);
  };

  return (
    <div className='flex-1 p-8 min-h-0'>
      <div className='h-full flex flex-col space-y-4 text-gray-500 overflow-y-auto'>
        <AssignmentActions
          assignmentId={assignmentId}
          classId={classId}
          canManage={canManage}
          disableForm={!canManage}
          incompleteStudentCount={incompleteStudentCount}
          retryFormationModalSignal={retryModalSignal.toString()}
          onEditModeChange={setIsEditMode}
          isStudent={isStudent}
          hasTeams={hasTeams}
          topicCount={topicCount}
          enrollmentCount={enrollmentCount}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          isTeamFormationProcessing={isTeamFormationProcessing}
          isEditMode={isEditMode}
          onSaveClick={() => setSaveTrigger(prev => prev + 1)}
          isSaving={isSaving}
        />

        {isStudent ? (
          hasTeams ? (
            <AssignmentTeamsClient
              teams={teams}
              assignmentId={assignmentId}
              courseId={courseId}
              topicNames={topicNames}
              taskIdByIndex={taskIdByIndex}
              assignmentTitleLabel={assignmentTitleLabel}
              courseNameLabel={courseNameLabel}
              courseClassLabel={courseClassLabel}
              isStudent
              searchValue={searchValue}
              canManage={false}
              currentUserId={currentUserId}
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
        ) : isTeamFormationProcessing && status !== 'FAILED' ? (
          // Show loading animation for teachers when team formation is processing
          <TeamFormationLoading />
        ) : showError || status === 'FAILED' ? (
          // Show error message with retry button
          <div className='flex-1 flex items-center justify-center'>
            <div className='flex flex-col items-center text-center max-w-xl gap-4'>
              <div className='rounded-2xl border border-red-200 bg-red-50 text-red-900 px-6 py-4'>
                <h3 className='font-semibold text-lg mb-2'>
                  {tTeams('formationFailed')}
                </h3>
                <p className='text-sm text-red-700'>
                  {errorMessage || tTeams('formationFailedDesc')}
                </p>
              </div>
              <Button
                onClick={handleRetry}
                variant='onboarding'
                className='rounded-full px-8 py-6'
              >
                {tTeams('retryFormation')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {!hasTeams ? (
              <AssignmentCharts stats={stats} isStudent={isStudent} />
            ) : (
              <ChartsToggle
                progressPercent={quizCompletionPercent}
                defaultVisible={false}
                incompleteStudentCount={adjustedIncompleteCount}
                hasTeams={hasTeams}
                missingStudents={visibleMissingStudents}
              >
                <AssignmentCharts stats={stats} isStudent={isStudent} />
              </ChartsToggle>
            )}
            <AssignmentTeamsClient
              teams={teams}
              assignmentId={assignmentId}
              courseId={courseId}
              topicNames={topicNames}
              taskIdByIndex={taskIdByIndex}
              assignmentTitleLabel={assignmentTitleLabel}
              courseNameLabel={courseNameLabel}
              courseClassLabel={courseClassLabel}
              searchValue={searchValue}
              canManage={canManage}
              currentUserId={currentUserId}
              isEditMode={isEditMode}
              enrolledStudents={enrolledStudents}
              submittedStudentIds={submittedStudentIds}
              saveTrigger={saveTrigger}
              onPendingAdditionsChange={ids =>
                setPendingAdditionIds(new Set(ids))
              }
              onSavingChange={setIsSaving}
            />
          </>
        )}
      </div>
    </div>
  );
}
