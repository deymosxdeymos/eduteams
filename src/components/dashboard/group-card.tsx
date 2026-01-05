'use client';

import { Calendar } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { GroupListItem } from '@/types/manage';

interface GroupCardProps {
  item: GroupListItem;
}

export function GroupCard({ item }: GroupCardProps) {
  const t = useTranslations('dashboard.studentManage.card');
  const locale = useLocale();
  const router = useRouter();

  const handleClick = () => {
    // Navigate to quiz page for "not-started" status, assignment page for others
    if (item.status === 'not-started') {
      router.push(
        `/dashboard/class/${item.courseId}/assignments/${item.id}/quiz`
      );
    } else {
      router.push(`/dashboard/class/${item.courseId}/assignments/${item.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Navigate to quiz page for "not-started" status, assignment page for others
      if (item.status === 'not-started') {
        router.push(
          `/dashboard/class/${item.courseId}/assignments/${item.id}/quiz`
        );
      } else {
        router.push(`/dashboard/class/${item.courseId}/assignments/${item.id}`);
      }
    }
  };
  const count = item.teamMembers?.length ?? 0;
  const gridColsClass =
    count <= 2 ? 'grid-cols-1' : count <= 6 ? 'grid-cols-2' : 'grid-cols-3';

  // For "my-group" status with team members, show nested card structure
  if (
    item.status === 'my-group' &&
    item.teamMembers &&
    item.teamMembers.length > 0
  ) {
    return (
      <div
        className='border rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer bg-gray-50'
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role='button'
        tabIndex={0}
      >
        <div className='flex flex-col gap-3'>
          {/* Inner Top Card - Task Info */}
          <div className='border rounded-2xl p-3 hover:bg-gray-50 bg-white'>
            <h3 className='font-semibold text-lg text-gray-800 line-clamp-2'>
              {item.taskTitle}
            </h3>
            <p className='text-sm text-muted-foreground mt-1 line-clamp-1'>
              {item.className}
            </p>
          </div>

          {/* Inner Bottom Card - Team Info & Members */}
          <div className='border rounded-xl p-4 flex flex-col gap-3 bg-white'>
            {/* Team Header */}
            <div className='flex items-start justify-between gap-3'>
              <h2 className='font-semibold text-lg text-gray-800'>
                {item.teamName || t('yourTeam')}
              </h2>
              {item.topicName && (
                <div className='rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 text-xs'>
                  {t('topic', { name: item.topicName })}
                </div>
              )}
            </div>

            {/* Team Members */}
            <div className={cn('grid gap-2', gridColsClass)}>
              {item.teamMembers.map(member => (
                <div
                  key={member.id}
                  className='flex items-center gap-3 p-3 border rounded-2xl hover:bg-gray-50'
                >
                  {member.user.mbtiType ? (
                    <Image
                      src={`/mbti-logo-normalized/${member.user.mbtiType}.svg`}
                      alt={member.user.mbtiType}
                      width={40}
                      height={40}
                      className='w-10 h-10'
                    />
                  ) : (
                    <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                      <span className='text-blue-600 font-semibold text-sm'>
                        {(member.user.name || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium text-gray-900 truncate'>
                      {member.user.name || t('noName')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For "waiting" and "not-started", show simple assignment card (like class-assignments.tsx)
  const getBadgeInfo = () => {
    if (item.status === 'waiting') {
      return {
        text: t('waitingBadge'),
        color: 'bg-sky-50 text-sky-900',
      };
    }
    return {
      text: t('notFilledBadge'),
      color: 'bg-red-50 text-red-900',
    };
  };

  const badge = getBadgeInfo();

  // Format date/time based on locale
  const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formatDateTime = (input: Date | string) => {
    const d = new Date(input);
    return dateTimeFormatter.format(d);
  };

  // Extract description text (handle JSON format)
  const extractDescriptionText = (description: string | null | undefined) => {
    if (!description) return null;
    try {
      const parsed = JSON.parse(description);
      return parsed.text || null;
    } catch {
      return description;
    }
  };

  const descriptionText = extractDescriptionText(item.description);

  return (
    <div
      className='border rounded-2xl p-4 bg-card cursor-pointer hover:shadow-sm active:opacity-95'
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role='button'
      tabIndex={0}
    >
      <div className='flex items-start justify-between gap-3'>
        <div
          className={`rounded-full ${badge.color} border px-2 py-0.5 text-xs`}
        >
          {badge.text}
        </div>
      </div>
      <h3 className='mt-2 text-lg font-normal text-stone-900'>
        {item.taskTitle}
      </h3>
      <div className='mt-1 flex items-center gap-4 text-xs font-normal text-neutral-600'>
        {item.startAt && (
          <span className='inline-flex items-center gap-1'>
            <Calendar className='w-4 h-4' />
            {formatDateTime(item.startAt)}
          </span>
        )}
      </div>
      {descriptionText && (
        <p className='mt-2 font-light text-sm text-neutral-800 whitespace-pre-wrap'>
          {descriptionText}
        </p>
      )}
    </div>
  );
}
