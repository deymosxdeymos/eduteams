'use client';

import {
  ArrowLeft,
  Brain,
  ChartLineIcon,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Lightbulb,
  Pencil,
  Plus,
} from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
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
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Link, useRouter } from '@/i18n/routing';
import { fetcher } from '@/lib/client-api';

interface AssignmentActionsProps {
  classId: string;
  assignmentId: string;
  canManage: boolean;
  disableForm?: boolean;
  incompleteStudentCount?: number;
  retryFormationModalSignal?: string;
  onEditModeChange?: (isEdit: boolean) => void;
  defaultWeights?: {
    alpha: number;
    beta: number;
    delta: number;
  };
  isStudent?: boolean;
  hasTeams?: boolean;
  topicCount?: number;
  enrollmentCount?: number;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  isTeamFormationProcessing?: boolean;
  isEditMode?: boolean;
  onSaveClick?: () => void;
  isSaving?: boolean;
}

interface TeamWeights {
  personality: number;
  skills: number;
  taskPreferences: number;
}

interface ApiWeights {
  alpha: number;
  beta: number;
  delta: number;
}

const DEFAULT_WEIGHTS: TeamWeights = {
  personality: 0.3,
  skills: 0.4,
  taskPreferences: 0.1,
};

const mapApiWeights = (weights: ApiWeights): TeamWeights => ({
  skills: weights.alpha,
  personality: weights.beta,
  taskPreferences: weights.delta,
});

export function AssignmentActions({
  assignmentId,
  classId,
  canManage,
  disableForm,
  incompleteStudentCount = 0,
  retryFormationModalSignal,
  onEditModeChange,
  defaultWeights,
  isStudent = false,
  hasTeams = false,
  topicCount,
  enrollmentCount,
  searchValue = '',
  onSearchChange,
  isTeamFormationProcessing = false,
  isEditMode = false,
  onSaveClick,
  isSaving = false,
}: AssignmentActionsProps) {
  const router = useRouter();
  const t = useTranslations('dashboard.assignment.actions');
  const tTeams = useTranslations('dashboard.teams');
  const [modalOpen, setModalOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [method, setMethod] = useState<
    'JUMLAH_KELOMPOK' | 'JUMLAH_MHS_PER_KELOMPOK' | ''
  >('');
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customWeights, setCustomWeights] = useState<TeamWeights | null>(null);
  const lastRetrySignalRef = useRef(retryFormationModalSignal);
  const createButtonLabel = hasTeams
    ? t('recreateTeamsButton')
    : t('createTeamsButton');
  const isProcessing = Boolean(isTeamFormationProcessing);
  const shouldDisableForm = submitting || isProcessing;

  const { data: fetchedWeights } = useSWR<ApiWeights>(
    defaultWeights ? null : '/api/edu2com/weights',
    fetcher<ApiWeights>
  );
  const resolvedWeights = customWeights
    ? customWeights
    : defaultWeights
      ? mapApiWeights(defaultWeights)
      : fetchedWeights
        ? mapApiWeights(fetchedWeights)
        : DEFAULT_WEIGHTS;
  const weightsModified = customWeights !== null;

  const canSubmit = Boolean(
    method && value && Number(value) > 0 && !shouldDisableForm
  );

  useEffect(() => {
    if (retryFormationModalSignal === lastRetrySignalRef.current) return;
    lastRetrySignalRef.current = retryFormationModalSignal;
    if (!canManage) return;
    setModalOpen(true);
    setWarningOpen(false);
    setError('');
    setSuccess('');
  }, [retryFormationModalSignal, canManage]);

  const handleModalOpenChange = (open: boolean) => {
    if (open && incompleteStudentCount > 0) {
      // Show warning first if there are incomplete students
      setWarningOpen(true);
    } else {
      setModalOpen(open);
    }
    if (!open) {
      setWarningOpen(false);
    }
  };

  const handleWarningContinue = () => {
    setWarningOpen(false);
    setModalOpen(true);
  };

  const handleCreateClick = () => {
    if (!canSubmit) return;
    handleCreate();
  };

  const handleCreate = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/form-teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          value: Number(value),
          // Only send weight overrides if user explicitly modified them
          weights: weightsModified
            ? {
                alpha: resolvedWeights.skills,
                beta: resolvedWeights.personality,
                delta: resolvedWeights.taskPreferences,
              }
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(
          res.status === 409
            ? t('alreadyProcessing')
            : data?.error || t('errorCreateFailed')
        );
        return;
      }
      setSuccess(t('successCreate'));
      setMethod('');
      setValue('');
      setModalOpen(false);
      router.refresh();
    } catch {
      setError(t('networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='flex items-center gap-4 shrink-0'>
      {!isEditMode && (
        <Button variant='ghost' size='icon' className='rounded-full' asChild>
          <Link href={`/dashboard/class/${classId}`} prefetch>
            <ArrowLeft strokeWidth={2} className='w-6 h-6 text-gray-600' />
          </Link>
        </Button>
      )}

      {isEditMode && canManage && (
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            className='rounded-full p-6'
            onClick={() => onEditModeChange?.(false)}
          >
            <ArrowLeft strokeWidth={2} className='w-6 h-6 text-gray-600' />
            <span className='text-gray-900 font-semibold text-sm'>
              {tTeams('cancelEdit')}
            </span>
          </Button>
          <Button
            variant='onboarding'
            className='rounded-full p-6'
            onClick={() => {
              onSaveClick?.();
            }}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <LoadingSpinner size='sm' className='mr-2' />
                <span className='font-semibold text-sm'>
                  {t('submitCreating')}
                </span>
              </>
            ) : (
              <span className='font-semibold text-sm'>
                {tTeams('saveChanges')}
              </span>
            )}
          </Button>
        </div>
      )}

      {isStudent && !isEditMode && (
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

      <div className='flex items-center gap-4'>
        {canManage && !isEditMode && (
          <div className='flex flex-col gap-2'>
            <Dialog open={modalOpen} onOpenChange={handleModalOpenChange}>
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
                      disabled={disableForm}
                      onValueChange={v => {
                        setMethod(v as typeof method);
                        setError('');
                      }}
                    >
                      <SelectTrigger className='!h-12 !min-h-[3rem] w-full rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-base focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/20 disabled:cursor-not-allowed disabled:opacity-60'>
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
                        disabled={disableForm}
                        onChange={e =>
                          setValue(e.target.value.replace(/[^0-9]/g, ''))
                        }
                        className='w-full disabled:cursor-not-allowed disabled:opacity-60'
                      />
                      {topicCount != null &&
                        enrollmentCount != null &&
                        value && (
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
                                          (enrollmentCount ?? 0) /
                                            Math.max(1, val)
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

                  <div className='pt-2'>
                    <button
                      type='button'
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className='flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors'
                    >
                      {t('advancedSettings')}
                      {showAdvanced ? (
                        <ChevronDown className='h-4 w-4' />
                      ) : (
                        <ChevronRight className='h-4 w-4' />
                      )}
                    </button>
                    <div
                      className={`grid transition-all duration-200 ease-out ${
                        showAdvanced
                          ? 'grid-rows-[1fr] opacity-100'
                          : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className='overflow-hidden'>
                        <div className='mt-6 space-y-6 pl-1'>
                          <div className='space-y-1'>
                            <h4 className='font-bold text-base text-gray-900'>
                              {t('weightAdjustmentTitle')}
                            </h4>
                            <p className='text-sm text-gray-500 leading-relaxed'>
                              {t('weightAdjustmentDesc')}
                            </p>
                          </div>

                          <div className='grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8'>
                            {/* Personality */}
                            <div className='space-y-4'>
                              <div className='flex items-center gap-3'>
                                <div className='p-2 bg-emerald-100 rounded-lg'>
                                  <Brain className='w-5 h-5 text-emerald-600' />
                                </div>
                                <span className='text-sm font-medium text-gray-900'>
                                  {t('weightPersonality')}
                                </span>
                              </div>
                              <div className='space-y-1'>
                                <Slider
                                  value={[resolvedWeights.personality]}
                                  max={1}
                                  step={0.1}
                                  showSteps
                                  onValueChange={val => {
                                    setCustomWeights({
                                      ...resolvedWeights,
                                      personality: val[0],
                                    });
                                  }}
                                />
                                <div className='flex justify-between text-xs text-gray-500 font-medium pt-1'>
                                  <span>0.0</span>
                                  <span className='font-bold text-emerald-700'>
                                    {resolvedWeights.personality.toFixed(1)}
                                  </span>
                                  <span>1.0</span>
                                </div>
                              </div>
                            </div>

                            {/* Skills */}
                            <div className='space-y-4'>
                              <div className='flex items-center gap-3'>
                                <div className='p-2 bg-amber-100 rounded-lg'>
                                  <Lightbulb className='w-5 h-5 text-amber-600' />
                                </div>
                                <span className='text-sm font-medium text-gray-900'>
                                  {t('weightSkills')}
                                </span>
                              </div>
                              <div className='space-y-1'>
                                <Slider
                                  value={[resolvedWeights.skills]}
                                  max={1}
                                  step={0.1}
                                  showSteps
                                  onValueChange={val => {
                                    setCustomWeights({
                                      ...resolvedWeights,
                                      skills: val[0],
                                    });
                                  }}
                                />
                                <div className='flex justify-between text-xs text-gray-500 font-medium pt-1'>
                                  <span>0.0</span>
                                  <span className='font-bold text-amber-700'>
                                    {resolvedWeights.skills.toFixed(1)}
                                  </span>
                                  <span>1.0</span>
                                </div>
                              </div>
                            </div>

                            {/* Task Preferences */}
                            <div className='space-y-4'>
                              <div className='flex items-center gap-3'>
                                <div className='p-2 bg-violet-100 rounded-lg'>
                                  <ClipboardList className='w-5 h-5 text-violet-600' />
                                </div>
                                <span className='text-sm font-medium text-gray-900'>
                                  {t('weightTaskPreferences')}
                                </span>
                              </div>
                              <div className='space-y-1'>
                                <Slider
                                  value={[resolvedWeights.taskPreferences]}
                                  max={1}
                                  step={0.1}
                                  showSteps
                                  onValueChange={val => {
                                    setCustomWeights({
                                      ...resolvedWeights,
                                      taskPreferences: val[0],
                                    });
                                  }}
                                />
                                <div className='flex justify-between text-xs text-gray-500 font-medium pt-1'>
                                  <span>0.0</span>
                                  <span className='font-bold text-violet-700'>
                                    {resolvedWeights.taskPreferences.toFixed(1)}
                                  </span>
                                  <span>1.0</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <p className='text-sm text-red-600' role='alert'>
                      {error}
                    </p>
                  )}
                  {success && (
                    <p className='text-sm text-emerald-700' role='status'>
                      {success}
                    </p>
                  )}

                  <div className='pt-1'>
                    <Button
                      className='w-full rounded-full py-6 font-semibold'
                      variant='onboarding'
                      disabled={!canSubmit}
                      onClick={handleCreateClick}
                    >
                      {submitting ? t('submitCreating') : t('submitCreate')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={warningOpen} onOpenChange={setWarningOpen}>
              <DialogContent
                className='border max-w-md rounded-3xl p-0 gap-0'
                onPointerDownOutside={e => {
                  e.preventDefault();
                }}
                onEscapeKeyDown={e => {
                  e.preventDefault();
                }}
              >
                <DialogHeader className='p-6 pb-2'>
                  <div className='flex justify-center'>
                    <Image
                      src='/team-formation-warning.svg'
                      alt='Warning'
                      width={160}
                      height={160}
                    />
                  </div>
                  <DialogTitle className='text-xl font-semibold text-left'>
                    {t('warningTitle')}
                  </DialogTitle>
                  <p className='text-gray-600 text-sm font-normal text-left mt-2'>
                    {t('warningMessage')}
                  </p>
                </DialogHeader>
                <div className='p-6 pt-0'>
                  <div className='flex flex-col gap-3'>
                    <Button
                      className='w-full rounded-full py-6 font-semibold'
                      variant='onboarding'
                      onClick={handleWarningContinue}
                    >
                      {t('warningContinue')}
                    </Button>
                    <Button
                      className='w-full rounded-full py-6 font-semibold'
                      variant='outline'
                      onClick={() => setWarningOpen(false)}
                    >
                      {t('warningCancel')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {!isStudent && !isEditMode && (
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

        {!isEditMode && (
          <ExportButtons
            assignmentId={assignmentId}
            hasTeams={hasTeams}
            canManage={canManage}
          />
        )}

        {canManage && hasTeams && !isEditMode && (
          <Button
            variant='outline'
            size='icon'
            className='rounded-full border border-gray-600 h-12 w-12'
            onClick={() => onEditModeChange?.(true)}
            title={tTeams('editTeams')}
          >
            <Pencil className='w-4 h-4 text-gray-600' />
          </Button>
        )}
      </div>

      {hasTeams && !isEditMode && (
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
    </div>
  );
}
