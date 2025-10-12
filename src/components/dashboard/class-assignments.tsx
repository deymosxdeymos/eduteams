'use client';

import { ArrowLeft, Calendar, Plus, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFuzzySearch } from '@/lib/hooks/use-fuzzy-search';
import type { AssignmentResponse } from '@/lib/validation/assignments';
import { CreateAssignmentModal } from './create-assignment-modal';
import { EmptyAssignmentState } from './empty-assignment-state';
import { SearchInput } from './search-input';
import { ShareClassModal } from './share-class-modal';

interface ClassAssignmentsProps {
  classId: string;
  dosenId?: string;
  courseData?: {
    id: string;
    namaMataKuliah: string;
    kelas: string;
    shareToken?: string | null;
  };
  initialAssignments?: AssignmentResponse[];
  studentCount?: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function ClassAssignments({
  classId,
  courseData,
  initialAssignments,
  studentCount = 0,
}: ClassAssignmentsProps) {
  const router = useRouter();
  const t = useTranslations('dashboard.classAssignments');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreateAssignmentModalOpen, setIsCreateAssignmentModalOpen] =
    useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Use courseData if provided, otherwise fetch via SWR
  const { data: classData, error } = useSWR(
    courseData ? null : `/api/courses/${classId}`,
    fetcher
  );

  const course = courseData || classData?.data;

  if (error) {
    console.error('Failed to load class:', error);
  }

  // Avoid early return to keep hooks order stable

  // Assignments fetching
  const { data: assignmentsData, mutate: mutateAssignments } = useSWR(
    course ? `/api/courses/${classId}/assignments` : null,
    fetcher,
    {
      fallbackData: initialAssignments
        ? { data: initialAssignments }
        : undefined,
    }
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ classId: string }>;
      if (ce.detail?.classId === classId) mutateAssignments();
    };
    window.addEventListener('assignment:created', handler);
    return () => window.removeEventListener('assignment:created', handler);
  }, [classId, mutateAssignments]);

  const assignments: AssignmentResponse[] = assignmentsData?.data ?? [];
  const hasAssignments = assignments.length > 0;

  const filteredAssignments = useFuzzySearch<AssignmentResponse>({
    data: assignments,
    searchTerm,
    keys: ['title'],
    debounceDelay: 250,
  });

  const formatIdTimeDate = (input: Date | string) => {
    const d = new Date(input);
    return `${timeFormatter.format(d)}, ${dateFormatter.format(d)}`;
  };

  const extractDescriptionText = (description: string | null | undefined) => {
    if (!description) return null;
    try {
      const parsed = JSON.parse(description);
      return parsed.text || null;
    } catch {
      return description;
    }
  };

  return (
    <div className='bg-white rounded-3xl rounded-r-none h-full flex flex-col overflow-hidden'>
      <div className='p-6'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => window.history.back()}
            className='rounded-full'
          >
            <ArrowLeft strokeWidth={2} className='w-5 h-5 text-gray-600' />
          </Button>

          <Button
            variant='onboarding'
            className='rounded-full p-6'
            onClick={() => {
              setIsCreateAssignmentModalOpen(true);
            }}
          >
            <Plus strokeWidth={3} className='w-4 h-4 text-white' />
            <span className='font-semibold text-sm'>
              {t('createAssignment')}
            </span>
          </Button>

          <Button
            variant='outline'
            className='rounded-full p-6'
            onClick={() => setIsShareModalOpen(true)}
          >
            <Share2 className='w-4 h-4' />
            <span className='font-semibold text-sm'>{t('shareClass')}</span>
          </Button>

          {hasAssignments && (
            <SearchInput
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              placeholder={t('searchPlaceholder')}
              ariaLabel={t('searchAria')}
              showClassActions={false}
              containerClassName='ml-auto w-80'
              className='pr-10'
            />
          )}
        </div>
      </div>

      {/* Assignments section */}
      <div className='p-6 flex-1 flex flex-col overflow-hidden'>
        <div className='flex-1 overflow-hidden'>
          {hasAssignments ? (
            <div className='h-full overflow-y-auto'>
              <div className='grid grid-cols-1 gap-4 pr-2'>
                {searchTerm.trim() !== '' &&
                filteredAssignments.length === 0 ? (
                  <div className='text-sm text-neutral-500 px-1 py-2'>
                    {t('noMatches', { query: searchTerm })}
                  </div>
                ) : null}
                {filteredAssignments.map(a => {
                  const descriptionText = extractDescriptionText(a.description);
                  return (
                    <div
                      key={a.id}
                      className='border rounded-2xl p-4 bg-card cursor-pointer hover:shadow-sm active:opacity-95'
                      role='button'
                      tabIndex={0}
                      onClick={() =>
                        router.push(
                          `/dashboard/class/${classId}/assignments/${a.id}`
                        )
                      }
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          router.push(
                            `/dashboard/class/${classId}/assignments/${a.id}`
                          );
                        }
                      }}
                    >
                      <div className='flex items-start justify-between gap-3'>
                        {(() => {
                          const safeTotalStudents = Math.max(0, studentCount);
                          const safeSubmittedCount = Math.max(
                            0,
                            a.submissionsCount
                          );
                          const clampedSubmittedCount =
                            safeTotalStudents > 0
                              ? Math.min(safeSubmittedCount, safeTotalStudents)
                              : safeSubmittedCount;
                          const allStudentsSubmitted =
                            safeTotalStudents > 0 &&
                            clampedSubmittedCount === safeTotalStudents;

                          let text = '';
                          let color = '';

                          if (a.status === 'BERHASIL_PEMBAGIAN_GRUP') {
                            text = t('status.formed');
                            color = 'bg-emerald-50 text-emerald-900';
                          } else if (
                            a.status === 'MENUNGGU' ||
                            allStudentsSubmitted
                          ) {
                            text = t('status.waiting');
                            color = 'bg-sky-50 text-sky-900';
                          } else if (safeSubmittedCount === 0) {
                            text = t('status.noneFilled');
                            color = 'bg-red-50 text-red-900';
                          } else {
                            const totalForMessage =
                              safeTotalStudents > 0
                                ? safeTotalStudents
                                : clampedSubmittedCount;
                            text = t('status.progress', {
                              filled: clampedSubmittedCount,
                              total: totalForMessage,
                            });
                            color = 'bg-amber-50 text-orange-900';
                          }

                          return (
                            <Badge className={`rounded-full ${color} border`}>
                              {text}
                            </Badge>
                          );
                        })()}
                      </div>
                      <h3 className='mt-2 text-lg font-normal text-stone-900'>
                        {a.title}
                      </h3>
                      <div className='mt-1 flex items-center gap-4 text-xs font-normal  text-neutral-600'>
                        <span className='inline-flex items-center gap-1'>
                          <Calendar className='w-4 h-4' />
                          {formatIdTimeDate(a.startAt)}
                        </span>
                      </div>
                      {descriptionText ? (
                        <p className='mt-2 font-light text-sm text-neutral-800 whitespace-pre-wrap'>
                          {descriptionText}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className='h-full flex items-center justify-center'>
              <EmptyAssignmentState />
            </div>
          )}
        </div>
      </div>

      <ShareClassModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        courseData={course}
      />

      <CreateAssignmentModal
        open={isCreateAssignmentModalOpen}
        onOpenChange={setIsCreateAssignmentModalOpen}
        classId={classId}
      />
    </div>
  );
}
