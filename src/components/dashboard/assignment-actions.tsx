'use client';

import { ArrowLeft, ChartLineIcon, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ExportButtons } from '@/components/dashboard/export-buttons';
import { SearchInput } from '@/components/dashboard/search-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { InputRounded } from '@/components/ui/input-rounded';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link, useRouter } from '@/i18n/routing';

interface AssignmentActionsProps {
  assignmentId: string;
  classId: string;
  canManage: boolean;
  isStudent?: boolean;
  hasTeams?: boolean;
  topicCount?: number;
  enrollmentCount?: number;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function AssignmentActions({
  assignmentId,
  classId,
  canManage,
  isStudent = false,
  hasTeams = false,
  topicCount,
  enrollmentCount,
  searchValue = '',
  onSearchChange,
}: AssignmentActionsProps) {
  const router = useRouter();
  const t = useTranslations('dashboard.assignment.actions');
  const tTeams = useTranslations('dashboard.teams');
  const [modalOpen, setModalOpen] = useState(false);
  const [method, setMethod] = useState<
    'JUMLAH_KELOMPOK' | 'JUMLAH_MHS_PER_KELOMPOK' | ''
  >('');
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const createButtonLabel = hasTeams
    ? t('recreateTeamsButton')
    : t('createTeamsButton');

  const canSubmit = Boolean(
    method && value && Number(value) > 0 && !submitting
  );

  const handleCreate = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/form-teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, value: Number(value) }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error || t('errorCreateFailed'));
        return;
      }
      setSuccess(t('successCreate'));
      setTimeout(() => {
        setModalOpen(false);
        setMethod('');
        setValue('');
        router.refresh();
      }, 900);
    } catch {
      setError(t('networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='flex items-center gap-4 shrink-0'>
      <Button variant='ghost' size='icon' className='rounded-full' asChild>
        <Link href={`/dashboard/class/${classId}`} prefetch>
          <ArrowLeft strokeWidth={2} className='w-6 h-6 text-gray-600' />
        </Link>
      </Button>

      <div className='flex items-center gap-4'>
        {canManage && (
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button
                variant='onboarding'
                className={`rounded-full p-6 ${hasTeams ? 'w-[14rem]' : 'w-[11rem]'}`}
              >
                <Plus strokeWidth={3} className='w-4 h-4 text-white' />
                <span className='font-semibold text-sm'>
                  {createButtonLabel}
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className='border max-w-md md:max-w-xl rounded-3xl p-0 gap-0'>
              <DialogHeader className='p-6 pb-2'>
                <DialogTitle className='text-xl font-semibold text-left'>
                  {t('createTeamsTitle')}
                </DialogTitle>
                <p className='text-gray-600 text-sm font-normal text-left mt-2'>
                  {t('createTeamsDesc')}
                </p>
              </DialogHeader>
              <div className='p-6 pt-0 space-y-5'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-900'>
                    {t('methodLabel')}
                  </label>
                  <Select
                    value={method}
                    onValueChange={v => {
                      setMethod(v as typeof method);
                      setError('');
                    }}
                  >
                    <SelectTrigger className='!h-12 !min-h-[3rem] w-full rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-base focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/20'>
                      <SelectValue placeholder={t('methodPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='JUMLAH_KELOMPOK'>
                        {t('methodByGroupCount')}
                      </SelectItem>
                      <SelectItem value='JUMLAH_MHS_PER_KELOMPOK'>
                        {t('methodByStudentsPerGroup')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {method && (
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-gray-900'>
                      {method === 'JUMLAH_KELOMPOK'
                        ? t('methodByGroupCount')
                        : t('methodByStudentsPerGroup')}
                    </label>
                    <InputRounded
                      type='number'
                      min={method === 'JUMLAH_MHS_PER_KELOMPOK' ? 2 : 1}
                      placeholder={
                        method === 'JUMLAH_KELOMPOK'
                          ? t('valuePlaceholderGroups')
                          : t('valuePlaceholderStudents')
                      }
                      value={value}
                      onChange={e =>
                        setValue(e.target.value.replace(/[^0-9]/g, ''))
                      }
                      className='w-full'
                    />
                    {topicCount != null && enrollmentCount != null && value && (
                      <p className='text-xs text-neutral-500'>
                        {(() => {
                          const val = Number(value);
                          const groups =
                            method === 'JUMLAH_KELOMPOK'
                              ? val
                              : val > 0
                                ? Math.max(
                                    1,
                                    Math.ceil(
                                      (enrollmentCount ?? 0) / Math.max(1, val)
                                    )
                                  )
                                : 0;
                          if (
                            groups &&
                            (topicCount ?? 0) > 0 &&
                            groups !== topicCount
                          ) {
                            return t('noteTopicsMismatch', {
                              topicCount,
                              groups,
                            });
                          }
                          return null;
                        })()}
                      </p>
                    )}
                  </div>
                )}

                {error && (
                  <p className='text-sm text-red-600' role='alert'>
                    {error}
                  </p>
                )}
                {success && <p className='text-sm text-green-600'>{success}</p>}

                <div className='pt-1'>
                  <Button
                    className='w-full rounded-full py-6 font-semibold'
                    variant='onboarding'
                    disabled={!canSubmit}
                    onClick={handleCreate}
                  >
                    {submitting ? t('submitCreating') : t('submitCreate')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {!isStudent && (
          <Button
            variant='outline'
            className='rounded-full border border-black p-6 w-[15rem]'
            onClick={() =>
              router.push(
                `/dashboard/class/${classId}/assignments/${assignmentId}/answers`
              )
            }
          >
            <ChartLineIcon className='w-4 h-4 text-black' />
            <span className='text-black font-semibold text-sm'>
              {t('viewAnswers')}
            </span>
          </Button>
        )}

        <ExportButtons
          assignmentId={assignmentId}
          hasTeams={hasTeams}
          canManage={canManage}
        />
      </div>

      {hasTeams && (
        <div className='ml-auto'>
          <SearchInput
            searchValue={searchValue}
            onSearchChange={onSearchChange || (() => {})}
            placeholder={tTeams('searchStudents')}
            showClassActions={false}
            containerClassName='relative'
            className='pr-10 text-gray-700 placeholder:text-gray-400 w-80'
            iconClassName='right-5 w-6 h-6'
          />
        </div>
      )}

      {isStudent && (
        <Button
          variant='outline'
          className='rounded-full border border-black p-6 w-[14rem]'
          onClick={() =>
            router.push(
              `/dashboard/class/${classId}/assignments/${assignmentId}/quiz`
            )
          }
        >
          <ChartLineIcon className='w-4 h-4 text-black' />
          <span className='text-black font-semibold text-sm'>
            {t('viewMyAnswers')}
          </span>
        </Button>
      )}
    </div>
  );
}
