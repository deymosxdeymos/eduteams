'use client';

import { AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface ChartsToggleProps {
  progressPercent: number; // 0..100
  children: React.ReactNode;
  defaultVisible?: boolean;
  hideToggle?: boolean;
  incompleteStudentCount?: number;
  hasTeams?: boolean;
}

export function ChartsToggle({
  progressPercent,
  children,
  defaultVisible = true,
  hideToggle = false,
  incompleteStudentCount = 0,
  hasTeams = false,
}: ChartsToggleProps) {
  const t = useTranslations('dashboard.charts');
  const [visible, setVisible] = useState(defaultVisible);
  const onKey = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setVisible(v => !v);
    }
  }, []);
  if (hideToggle) {
    return null;
  }

  const showMissingStudentsBadge = hasTeams && incompleteStudentCount > 0;

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <div
          role='button'
          tabIndex={0}
          onClick={() => setVisible(v => !v)}
          onKeyDown={onKey}
          className='inline-flex items-center gap-2 text-black select-none cursor-pointer'
          aria-expanded={visible}
        >
          <span className='font-medium'>{t('viewAnalysis')}</span>
          {visible ? (
            <ChevronDown className='w-4 h-4' />
          ) : (
            <ChevronRight className='w-4 h-4' />
          )}
        </div>
        {showMissingStudentsBadge ? (
          <Badge
            variant='destructive'
            className='rounded-full bg-red-50 text-red-700 border-transparent'
          >
            <AlertCircle className='w-3 h-3' />
            {t('missingStudents', { count: incompleteStudentCount })}
          </Badge>
        ) : (
          <Badge className='rounded-full bg-emerald-50 text-emerald-700'>
            {t('completionRate', { percent: Math.round(progressPercent) })}
          </Badge>
        )}
      </div>
      {visible && children}
    </div>
  );
}
