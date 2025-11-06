'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, MoreVertical, Search, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ExtendedUser } from '@/lib/types';
import { Badge } from '../ui/badge';
import { MBTIOverviewLayout } from './mbti-overview-layout';
import { SearchInput } from './search-input';
import { StudentProfileContent } from './student-profile-content';

interface Student {
  id: string;
  name: string;
  nim: string;
  email: string;
  mbtiType?: string | null;
  ei?: number | null;
  sn?: number | null;
  tf?: number | null;
  pj?: number | null;
}

interface StudentListProps {
  classId: string;
  initialData?: Student[];
  currentUserId?: string;
  canManage?: boolean; // true for dosen in their own class; false for mahasiswa
  submittedStudentIds?: string[]; // students who have filled both quizzes for this assignment
  submittedCount?: number; // number of students who have submitted
  totalStudents?: number; // total number of students in class
  isAssignmentPage?: boolean; // true when on assignment/task pages
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

const convertToExtendedUser = (student: Student): ExtendedUser =>
  ({
    id: student.id,
    name: student.name,
    email: student.email,
    role: null,
    nimNpm: student.nim,
    isOnboarded: true,
    onboardingStep: null,
    mbtiType: (student.mbtiType || null) as ExtendedUser['mbtiType'],
    ei: student.ei ?? null,
    sn: student.sn ?? null,
    tf: student.tf ?? null,
    pj: student.pj ?? null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    image: null,
    emailVerified: false,
    gender: null,
    hasSeenWelcomeSplash: false,
    onboardingData: null,
    personalityData: null,
  }) as ExtendedUser;

export function StudentList({
  classId,
  initialData,
  currentUserId,
  canManage = false,
  submittedStudentIds,
  submittedCount,
  totalStudents,
  isAssignmentPage = false,
}: StudentListProps) {
  const t = useTranslations('dashboard.students');
  const [searchValue, setSearchValue] = useState('');
  const [openMenuStudentId, setOpenMenuStudentId] = useState<string | null>(
    null
  );
  const [confirmStudentId, setConfirmStudentId] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isMbtiOpen, setIsMbtiOpen] = useState(false);
  const [modalContent, setModalContent] = useState<'profile' | 'mbti'>(
    'profile'
  );
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set()
  );

  // For dosen (canManage), fetch to keep up-to-date. For mahasiswa, use initialData if provided
  const shouldFetch = canManage || !initialData || initialData.length === 0;

  const {
    data: studentsData,
    error,
    mutate,
  } = useSWR(shouldFetch ? `/api/courses/${classId}/students` : null, fetcher, {
    fallbackData: initialData ? { data: initialData } : undefined,
    revalidateOnFocus: false, // Reduce unnecessary requests
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // Cache for 1 minute
  });

  const students: Student[] = useMemo(
    () => studentsData?.data || initialData || [],
    [studentsData, initialData]
  );

  const submittedProgressAvailable =
    isAssignmentPage &&
    typeof submittedCount === 'number' &&
    typeof totalStudents === 'number';

  const { badgeLabel, badgeClassName, badgeTextClassName } = (() => {
    const baseLabel =
      isSelectMode && canManage
        ? t('countSelected', { count: selectedStudentIds.size })
        : t('count', { count: students.length });

    return {
      badgeLabel: baseLabel,
      badgeClassName: 'px-3 rounded-full flex items-center gap-1 bg-sky-50',
      badgeTextClassName: 'text-sm font-medium text-sky-900',
    } as const;
  })();

  const filteredStudents = useMemo(
    () =>
      students.filter(
        student =>
          student.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          student.nim.toLowerCase().includes(searchValue.toLowerCase())
      ),
    [students, searchValue]
  );

  if (error) {
    console.error('Failed to load students:', error);
  }

  useEffect(() => {
    if (!isMbtiOpen) return;
    setSelectedStudent(prev => {
      if (!prev) return null;
      const updated = students.find(s => s.id === prev.id);
      return updated || prev;
    });
  }, [students, isMbtiOpen]);

  // Close menus when clicking outside
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpenMenuStudentId(null);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // ESC key to exit select mode
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isSelectMode) {
        setIsSelectMode(false);
        setSelectedStudentIds(new Set());
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isSelectMode]);

  const onRemoveStudent = async (studentId: string) => {
    setIsRemoving(true);
    setRemoveError(null);
    try {
      const res = await fetch(`/api/courses/${classId}/students/${studentId}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || t('errors.removeFailed'));
      }
      // Refresh list if using SWR; otherwise optimistically filter from fallback
      if (shouldFetch) {
        await mutate();
      }
      setConfirmStudentId(null);
      setOpenMenuStudentId(null);
      // If removing from modal, close it and clear selection
      if (selectedStudent && selectedStudent.id === studentId) {
        setIsMbtiOpen(false);
        setSelectedStudent(null);
      }
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : t('errors.error'));
    } finally {
      setIsRemoving(false);
    }
  };

  const onBulkRemoveStudents = async () => {
    setIsRemoving(true);
    setRemoveError(null);
    const idsToRemove = Array.from(selectedStudentIds);

    try {
      const results = await Promise.allSettled(
        idsToRemove.map(studentId =>
          fetch(`/api/courses/${classId}/students/${studentId}`, {
            method: 'DELETE',
          }).then(res => {
            if (!res.ok) {
              return res.json().then(
                json => {
                  throw new Error(json?.error || t('errors.removeFailed'));
                },
                () => {
                  throw new Error('Gagal menghapus mahasiswa');
                }
              );
            }
            return res;
          })
        )
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const errorCount = results.filter(r => r.status === 'rejected').length;

      if (errorCount > 0) {
        setRemoveError(
          t('errors.removePartialSuccess', {
            success: successCount,
            failed: errorCount,
          })
        );
      }

      if (shouldFetch) {
        await mutate();
      }

      if (errorCount === 0) {
        setConfirmStudentId(null);
        setIsSelectMode(false);
        setSelectedStudentIds(new Set());
      }
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : t('errors.error'));
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className='bg-white rounded-3xl rounded-l-none h-full flex flex-col overflow-hidden'
    >
      <div className='p-6 pb-4'>
        <div
          className={
            isAssignmentPage
              ? 'flex flex-col gap-2 mb-4'
              : 'flex gap-x-2 items-center mb-4'
          }
        >
          <h3 className='text-lg font-semibold text-gray-800'>{t('title')}</h3>
          {!(canManage && submittedProgressAvailable && !isSelectMode) && (
            <motion.div
              layout
              transition={{ duration: 0.2, ease: [0.215, 0.61, 0.355, 1] }}
            >
              <Badge className={badgeClassName}>
                <span className={badgeTextClassName}>{badgeLabel}</span>
                <AnimatePresence>
                  {isSelectMode && canManage && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{
                        duration: 0.2,
                        ease: [0.215, 0.61, 0.355, 1],
                      }}
                      className='text-sm font-medium text-sky-900 overflow-hidden whitespace-nowrap'
                    >
                      {t('selected')}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Badge>
            </motion.div>
          )}
          <AnimatePresence mode='popLayout'>
            {!isSelectMode &&
              canManage &&
              submittedProgressAvailable &&
              typeof submittedCount === 'number' &&
              typeof totalStudents === 'number' &&
              (submittedCount === 0 ? (
                <motion.div
                  key='no-submission-badge'
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.2,
                    ease: [0.215, 0.61, 0.355, 1],
                  }}
                >
                  <Badge className='bg-red-50 px-3 rounded-full'>
                    <span className='text-sm text-red-900 font-medium'>
                      {t('status.noSubmissions')}
                    </span>
                  </Badge>
                </motion.div>
              ) : submittedCount < totalStudents ? (
                <motion.div
                  key='submitted-badge'
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.2,
                    ease: [0.215, 0.61, 0.355, 1],
                  }}
                >
                  <Badge className='bg-amber-50 px-3 rounded-full'>
                    <span className='text-sm text-orange-900 font-medium'>
                      {`${Math.min(submittedCount, totalStudents)} dari ${totalStudents} mahasiswa telah mengisi kuesioner`}
                    </span>
                  </Badge>
                </motion.div>
              ) : (
                <motion.div
                  key='ready-badge'
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.2,
                    ease: [0.215, 0.61, 0.355, 1],
                  }}
                >
                  <Badge className='bg-sky-50 px-3 rounded-full'>
                    <span className='text-sm text-sky-900 font-medium'>
                      Grup siap untuk dibagi
                    </span>
                  </Badge>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        <SearchInput
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          placeholder={t('search')}
          showClassActions={false}
          containerClassName='relative'
          className='pr-10 text-gray-700 placeholder:text-gray-400'
          iconClassName='right-5 w-6 h-6'
        />

        <AnimatePresence>
          {isSelectMode && canManage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                duration: 0.2,
                ease: [0.215, 0.61, 0.355, 1],
              }}
              className='overflow-hidden'
              style={{ willChange: 'opacity, transform' }}
            >
              <div className='flex items-center justify-between mt-4'>
                <label
                  className='flex items-center gap-2 cursor-pointer select-none'
                  onClick={() => {
                    if (selectedStudentIds.size === filteredStudents.length) {
                      setSelectedStudentIds(new Set());
                    } else {
                      setSelectedStudentIds(
                        new Set(filteredStudents.map(s => s.id))
                      );
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (selectedStudentIds.size === filteredStudents.length) {
                        setSelectedStudentIds(new Set());
                      } else {
                        setSelectedStudentIds(
                          new Set(filteredStudents.map(s => s.id))
                        );
                      }
                    }
                  }}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors duration-200 ${
                      filteredStudents.length > 0 &&
                      selectedStudentIds.size === filteredStudents.length
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {filteredStudents.length > 0 &&
                      selectedStudentIds.size === filteredStudents.length && (
                        <Check className='w-3.5 h-3.5 text-white' />
                      )}
                  </div>
                  <span className='text-sm font-medium text-gray-700'>
                    {t('selectAll')}
                  </span>
                </label>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='destructive'
                    size='sm'
                    disabled={selectedStudentIds.size === 0}
                    onClick={() => {
                      setConfirmStudentId('bulk');
                    }}
                    className='text-sm rounded-full flex items-center gap-2 cursor-pointer hover:bg-red-700 transition-colors duration-200'
                  >
                    <Trash2 className='w-4 h-4' />
                    {t('removeMultiple')}
                  </Button>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={() => {
                      setIsSelectMode(false);
                      setSelectedStudentIds(new Set());
                    }}
                    className='rounded-full'
                    aria-label={t('exitSelectMode')}
                  >
                    <X className='w-4 h-4' />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className='flex-1 px-6 pb-6 overflow-y-auto'>
        {students.length === 0 ? (
          <div className='flex flex-col h-full text-center'>
            <p className='text-gray-500 font-medium'>{t('noStudents')}</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full text-center'>
            <div className='text-gray-400 mb-2'>
              <Search className='w-8 h-8 mx-auto mb-3' />
            </div>
            <p className='text-gray-500 font-medium'>{t('notFound')}</p>
            <p className='text-gray-400 text-sm'>{t('tryOtherKeyword')}</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {filteredStudents.map(student => {
              const isCurrentUser = currentUserId === student.id;
              const hasSubmitted = submittedStudentIds
                ? submittedStudentIds.includes(student.id)
                : true; // default true when context not provided
              return (
                <motion.div
                  key={student.id}
                  layout
                  className='flex items-center gap-3'
                  transition={{
                    layout: { type: 'spring', stiffness: 300, damping: 30 },
                  }}
                >
                  <AnimatePresence mode='popLayout'>
                    {isSelectMode && canManage && (
                      <motion.div
                        initial={{
                          opacity: 0,
                          scale: 0.9,
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                        }}
                        exit={{
                          opacity: 0,
                          scale: 0.9,
                        }}
                        transition={{
                          duration: 0.2,
                          ease: [0.215, 0.61, 0.355, 1],
                        }}
                        className='shrink-0'
                        style={{ willChange: 'opacity, transform' }}
                      >
                        <button
                          type='button'
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors duration-200 cursor-pointer ${
                            selectedStudentIds.has(student.id)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300 bg-white'
                          }`}
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedStudentIds(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(student.id)) {
                                newSet.delete(student.id);
                              } else {
                                newSet.add(student.id);
                              }
                              return newSet;
                            });
                          }}
                          aria-label={`${selectedStudentIds.has(student.id) ? t('cancelSelection') : t('select')} ${student.name}`}
                        >
                          {selectedStudentIds.has(student.id) && (
                            <Check className='w-3.5 h-3.5 text-white' />
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.div
                    layout
                    transition={{
                      layout: { type: 'spring', stiffness: 300, damping: 30 },
                    }}
                    className={`flex items-center gap-3 p-3 border rounded-2xl cursor-pointer flex-1 transition-colors duration-200 ${
                      isSelectMode && selectedStudentIds.has(student.id)
                        ? 'bg-blue-50 border-blue-500 hover:bg-blue-100'
                        : isCurrentUser
                          ? 'bg-emerald-50 border-emerald-500 hover:bg-emerald-100'
                          : hasSubmitted
                            ? 'border-gray-200 hover:bg-gray-50'
                            : 'bg-red-50 border-red-400 hover:bg-red-100'
                    }`}
                    role='button'
                    tabIndex={0}
                    onClick={() => {
                      if (isSelectMode && canManage) {
                        setSelectedStudentIds(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(student.id)) {
                            newSet.delete(student.id);
                          } else {
                            newSet.add(student.id);
                          }
                          return newSet;
                        });
                      } else {
                        setSelectedStudent(student);
                        setModalContent('profile');
                        setIsMbtiOpen(true);
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (isSelectMode && canManage) {
                          setSelectedStudentIds(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(student.id)) {
                              newSet.delete(student.id);
                            } else {
                              newSet.add(student.id);
                            }
                            return newSet;
                          });
                        } else {
                          setSelectedStudent(student);
                          setModalContent('profile');
                          setIsMbtiOpen(true);
                        }
                      }
                    }}
                  >
                    {student.mbtiType ? (
                      <Image
                        src={`/mbti-logo-normalized/${student.mbtiType}.svg`}
                        alt={student.mbtiType}
                        width={40}
                        height={40}
                        className='w-10 h-10'
                      />
                    ) : (
                      <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                        <span className='text-blue-600 font-semibold text-sm'>
                          {(student.name || t('noName'))
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className='flex-1 min-w-0 flex flex-col'>
                      <p className='font-medium text-gray-900 truncate'>
                        {student.name}
                      </p>
                      <p className='text-[0.625rem] font-normal text-gray-500 truncate'>
                        {student.nim}
                      </p>
                    </div>
                    {canManage && !isSelectMode && (
                      <div className='ml-auto relative'>
                        <button
                          aria-label='Opsi'
                          className='p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300'
                          onClick={e => {
                            e.stopPropagation();
                            setOpenMenuStudentId(prev =>
                              prev === student.id ? null : student.id
                            );
                          }}
                        >
                          <MoreVertical className='w-5 h-5 text-gray-500' />
                        </button>
                        <AnimatePresence>
                          {openMenuStudentId === student.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{
                                duration: 0.2,
                                ease: [0.215, 0.61, 0.355, 1],
                              }}
                              className='absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden'
                              style={{ transformOrigin: 'top right' }}
                            >
                              <button
                                className='w-full text-left px-4 py-2 text-sm hover:bg-gray-50'
                                onClick={e => {
                                  e.stopPropagation();
                                  setIsSelectMode(true);
                                  setSelectedStudentIds(new Set([student.id]));
                                  setOpenMenuStudentId(null);
                                }}
                              >
                                {t('select')}
                              </button>
                              <button
                                className='w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600'
                                onClick={e => {
                                  e.stopPropagation();
                                  setConfirmStudentId(student.id);
                                  setOpenMenuStudentId(null);
                                  setRemoveError(null);
                                }}
                              >
                                {t('remove')}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* MBTI Overview Modal */}
      <Dialog
        open={isMbtiOpen}
        onOpenChange={open => {
          setIsMbtiOpen(open);
          if (!open) {
            setSelectedStudent(null);
            setModalContent('profile');
          }
        }}
      >
        <DialogContent
          className='w-[85vw] max-w-[1200px] rounded-3xl p-0 border-0 gap-0 items-start'
          showCloseButton={false}
        >
          <DialogTitle className='sr-only'>
            {modalContent === 'profile'
              ? t('studentProfile')
              : t('mbtiDistribution')}
          </DialogTitle>
          {selectedStudent &&
            (() => {
              const studentUser = convertToExtendedUser(selectedStudent);

              return modalContent === 'profile' ? (
                <StudentProfileContent
                  student={studentUser}
                  canManage={canManage}
                  onRemoveStudent={() =>
                    selectedStudent && setConfirmStudentId(selectedStudent.id)
                  }
                  onClose={() => setIsMbtiOpen(false)}
                  onShowMBTI={() => setModalContent('mbti')}
                  isModal
                />
              ) : (
                <div className='overflow-hidden'>
                  <MBTIOverviewLayout
                    user={studentUser}
                    isModal
                    isCompact
                    onRequestClose={() => setModalContent('profile')}
                  />
                </div>
              );
            })()}
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Dialog */}
      <Dialog
        open={!!confirmStudentId}
        onOpenChange={open => !open && setConfirmStudentId(null)}
      >
        <DialogContent className='sm:max-w-xs'>
          <DialogHeader>
            <DialogTitle className='text-left'>{t('remove')}</DialogTitle>
            {removeError && (
              <p className='text-sm text-red-600 bg-red-50 p-2 rounded-md text-left'>
                {removeError}
              </p>
            )}
          </DialogHeader>
          <p className='text-sm text-muted-foreground text-left'>
            {confirmStudentId === 'bulk'
              ? t('confirmRemoveMultiple', { count: selectedStudentIds.size })
              : t('confirmRemove')}
          </p>
          <DialogFooter className='flex flex-col gap-2 sm:flex-col'>
            <Button
              variant='destructive'
              onClick={() => {
                if (confirmStudentId === 'bulk') {
                  onBulkRemoveStudents();
                } else if (confirmStudentId) {
                  onRemoveStudent(confirmStudentId);
                }
              }}
              disabled={isRemoving}
              className='w-full rounded-full'
            >
              {isRemoving ? t('removing') : t('delete')}
            </Button>
            <Button
              variant='outline'
              onClick={() => setConfirmStudentId(null)}
              disabled={isRemoving}
              className='w-full rounded-full'
            >
              {t('cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
