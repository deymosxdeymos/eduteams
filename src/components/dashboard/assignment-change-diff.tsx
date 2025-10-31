'use client';

import { MinusCircle, PlusCircle, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { AssignmentChanges } from '@/lib/utils/assignment-change-detection';
import { formatChangesForDisplay } from '@/lib/utils/assignment-change-detection';

interface AssignmentChangeDiffProps {
  changes: AssignmentChanges;
}

export function AssignmentChangeDiff({ changes }: AssignmentChangeDiffProps) {
  const t = useTranslations('dashboard.assignments.edit');
  const formatted = formatChangesForDisplay(changes);

  const hasSkillChanges = formatted.skills.length > 0;
  const hasTopicChanges = formatted.topics.length > 0;

  if (!hasSkillChanges && !hasTopicChanges) {
    return null;
  }

  return (
    <div className='space-y-4'>
      {hasSkillChanges && (
        <div>
          <h4 className='text-sm font-medium mb-2'>
            {t('skillsChanges', { defaultValue: 'Skills Changes' })}:
          </h4>
          <ul className='space-y-1'>
            {formatted.skills.map((change, index) => (
              <li
                key={index}
                className={`flex items-center gap-2 text-sm ${
                  change.type === 'removed'
                    ? 'text-red-600'
                    : change.type === 'added'
                      ? 'text-green-600'
                      : 'text-amber-600'
                }`}
              >
                {change.type === 'removed' && (
                  <MinusCircle className='w-4 h-4 flex-shrink-0' />
                )}
                {change.type === 'added' && (
                  <PlusCircle className='w-4 h-4 flex-shrink-0' />
                )}
                {change.type === 'renamed' && (
                  <RefreshCw className='w-4 h-4 flex-shrink-0' />
                )}
                <span>{change.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasTopicChanges && (
        <div>
          <h4 className='text-sm font-medium mb-2'>
            {t('topicsChanges', { defaultValue: 'Topics Changes' })}:
          </h4>
          <ul className='space-y-1'>
            {formatted.topics.map((change, index) => (
              <li
                key={index}
                className={`flex items-center gap-2 text-sm ${
                  change.type === 'removed'
                    ? 'text-red-600'
                    : change.type === 'added'
                      ? 'text-green-600'
                      : 'text-amber-600'
                }`}
              >
                {change.type === 'removed' && (
                  <MinusCircle className='w-4 h-4 flex-shrink-0' />
                )}
                {change.type === 'added' && (
                  <PlusCircle className='w-4 h-4 flex-shrink-0' />
                )}
                {change.type === 'renamed' && (
                  <RefreshCw className='w-4 h-4 flex-shrink-0' />
                )}
                <span>{change.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
