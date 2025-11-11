'use client';

import { useTranslations } from 'next-intl';
import { TeamMemberListClient } from '@/components/dashboard/team-member-list-client';

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
  topicId?: string;
  topicName?: string;
  groupNumber?: number;
}

interface AssignmentTeamsContentProps {
  teams: Team[];
  assignmentId: string;
  courseId: string;
  isStudent?: boolean;
  searchValue?: string;
  hasSearchResults?: boolean;
  canManage?: boolean;
}

export function AssignmentTeamsContent({
  teams,
  courseId,
  isStudent = false,
  searchValue = '',
  hasSearchResults = true,
  canManage = false,
}: AssignmentTeamsContentProps) {
  const t = useTranslations('dashboard.teams');
  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div
      className={
        isStudent
          ? 'flex flex-col gap-4'
          : 'flex flex-col gap-4 pt-4 border-t border-gray-200'
      }
    >
      {!hasSearchResults ? (
        <div className='flex flex-col items-center justify-center py-12 text-center'>
          <p className='text-gray-500 text-sm'>{t('noStudentsFound')}</p>
          <p className='text-gray-400 text-xs mt-1'>
            {t('tryDifferentSearch')}
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
          {teams.map((team, idx) => {
            const topicName = team.topicName || '-';
            const qualityPct =
              team.quality != null ? Math.round(team.quality * 100) : null;
            const hasTopic = topicName && topicName !== '-';
            const groupNumber = team.groupNumber ?? idx + 1;
            return (
              <div
                key={team.id}
                className='border rounded-xl shadow-sm p-4 flex flex-col gap-3'
              >
                <div className='flex items-start justify-between gap-3'>
                  <h2 className='font-bold text-2xl text-gray-800 uppercase'>
                    {t('group')} {pad(groupNumber)}
                  </h2>
                  {isStudent ? (
                    hasTopic ? (
                      <div className='rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 text-xs'>
                        {t('topic')}: {topicName}
                      </div>
                    ) : null
                  ) : (
                    <div className='flex flex-col items-end gap-1 text-sm text-gray-600'>
                      <div className='rounded-sm bg-green-50 text-green-900 px-2 py-0.5 text-xs'>
                        {t('qualityScore')}:{' '}
                        {qualityPct != null ? `${qualityPct}%` : '-'}
                      </div>
                      <div className='rounded-sm bg-sky-50 text-sky-900 px-2 py-0.5 text-xs'>
                        {t('topic')}: {hasTopic ? topicName : '-'}
                      </div>
                    </div>
                  )}
                </div>
                <TeamMemberListClient
                  members={team.members.map(m => ({
                    id: m.id,
                    user: {
                      id: m.user.id,
                      name: m.user.name,
                      email: m.user.email,
                      mbtiType: m.user.mbtiType as unknown as string | null,
                      nim: m.user.nim,
                      ei: m.user.ei,
                      sn: m.user.sn,
                      tf: m.user.tf,
                      pj: m.user.pj,
                    },
                  }))}
                  courseId={courseId}
                  searchValue={searchValue}
                  canManage={canManage}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
