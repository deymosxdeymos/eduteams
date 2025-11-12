'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputRounded } from '@/components/ui/input-rounded';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MultiSelectComboboxBadges } from '@/components/ui/multi-select-combobox-badges';
import { Textarea } from '@/components/ui/textarea';

interface CreateAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
}

export function CreateAssignmentModal({
  open,
  onOpenChange,
  classId,
}: CreateAssignmentModalProps) {
  const t = useTranslations('dashboard.assignments.create');
  const [skills, setSkills] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFormValid = Boolean(title.trim()) && skills.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl rounded-2xl'>
        <DialogHeader>
          <DialogTitle className='text-xl font-medium'>
            {t('title')}
          </DialogTitle>
          <p className='text-base font-normal'>{t('description')}</p>
        </DialogHeader>

        <div className='grid grid-cols-2 gap-8 mb-8'>
          {/* Left Column */}
          <div className='space-y-6'>
            <div>
              <h3 className='font-medium text-base mb-2'>{t('titleField')}</h3>
              <InputRounded
                className='w-full'
                placeholder={t('titlePlaceholder')}
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div>
              <h3 className='font-medium text-base mb-2'>
                {t('descriptionField')}{' '}
                <span className='font-light'>({t('optional')})</span>
              </h3>
              <Textarea
                className='bg-neutral-50 w-full h-32 resize-none'
                placeholder={t('descriptionPlaceholder')}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className='space-y-6'>
            <div>
              <h3 className='font-medium text-base mb-2'>{t('skills')}</h3>
              <MultiSelectComboboxBadges
                value={skills}
                onChange={setSkills}
                placeholder={t('skillsPlaceholder')}
                suggestionsEndpoint={`/api/courses/${classId}/skills`}
                emptyLabel={t('skillsEmptyLabel')}
                createLabel={query => t('skillsCreateLabel', { query })}
                showCombobox={true}
              />
            </div>

            <div>
              <h3 className='font-medium text-base mb-2'>
                {t('topics')}{' '}
                <span className='font-light'>({t('optional')})</span>
              </h3>
              <MultiSelectComboboxBadges
                value={topics}
                onChange={setTopics}
                placeholder={t('topicsPlaceholder')}
                emptyLabel={t('topicsEmptyLabel')}
                createLabel={query => t('topicsCreateLabel', { query })}
                showCombobox={false}
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && <p className='text-red-600 text-sm mb-2'>{error}</p>}

        {/* Create Button */}
        <Button
          variant='onboarding'
          className='w-full py-6 rounded-4xl font-medium'
          disabled={submitting || !isFormValid}
          onClick={async () => {
            if (!isFormValid || submitting) {
              return;
            }
            try {
              setSubmitting(true);
              setError(null);
              const res = await fetch(`/api/courses/${classId}/assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: title.trim(),
                  description: description.trim() || undefined,
                  skills,
                  topics,
                }),
              });
              const data = await res.json();
              if (!res.ok || !data?.success) {
                throw new Error(data?.error || t('error'));
              }
              // Reset form and close
              setTitle('');
              setDescription('');
              setSkills([]);
              setTopics([]);
              onOpenChange(false);
              // Let caller refresh via SWR (handled in parent by mutate)
              const ev = new CustomEvent('assignment:created', {
                detail: { classId },
              });
              window.dispatchEvent(ev);
            } catch (e) {
              setError(e instanceof Error ? e.message : t('error'));
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {submitting ? (
            <LoadingSpinner size='sm' className='mr-2' />
          ) : (
            <Plus strokeWidth={3} className='w-4 h-4 mr-2' />
          )}
          <span className='text-sm'>
            {submitting ? t('creating') : t('create')}
          </span>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
