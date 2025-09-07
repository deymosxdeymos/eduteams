'use client';

import { MoreVertical, Search } from 'lucide-react';
import Image from 'next/image';
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
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function StudentList({
  classId,
  initialData,
  currentUserId,
  canManage = false,
  submittedStudentIds,
}: StudentListProps) {
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

  const filteredStudents = students.filter(
    student =>
      student.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      student.nim.toLowerCase().includes(searchValue.toLowerCase())
  );

  if (error) {
    console.error('Failed to load students:', error);
  }

  // If modal is open and fresh data arrives, sync selected student
  useEffect(() => {
    if (!isMbtiOpen || !selectedStudent) return;
    const updated = students.find(s => s.id === selectedStudent.id);
    if (updated) {
      setSelectedStudent(prev => (prev ? { ...prev, ...updated } : updated));
    }
  }, [students, isMbtiOpen, selectedStudent]);

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

  const onRemoveStudent = async (studentId: string) => {
    setIsRemoving(true);
    setRemoveError(null);
    try {
      const res = await fetch(`/api/courses/${classId}/students/${studentId}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || 'Gagal menghapus mahasiswa');
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
      setRemoveError(err instanceof Error ? err.message : 'Terjadi kesalahan');
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
        <div className='flex items-center gap-x-2 mb-4'>
          <h3 className='text-lg font-semibold text-gray-800'>
            Daftar Mahasiswa
          </h3>
          <Badge className='bg-sky-50 px-2 rounded-full'>
            <span className='text-sm text-sky-900 font-medium'>
              {students.length} Mahasiswa
            </span>
          </Badge>
        </div>

        <div className='relative'>
          <input
            type='text'
            placeholder='Cari mahasiswa?'
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            className='w-full px-4 py-3 pr-10 border border-gray-200 rounded-full outline-none focus:border-neutral-500 text-gray-700 placeholder-gray-400'
          />
          <Search className='absolute right-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400' />
        </div>
      </div>

      <div className='flex-1 px-6 pb-6 overflow-y-auto'>
        {students.length === 0 ? (
          <div className='flex flex-col h-full text-center'>
            <p className='text-gray-500 font-medium'>Belum Ada Mahasiswa</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full text-center'>
            <div className='text-gray-400 mb-2'>
              <Search className='w-8 h-8 mx-auto mb-3' />
            </div>
            <p className='text-gray-500 font-medium'>Tidak ditemukan</p>
            <p className='text-gray-400 text-sm'>Coba kata kunci lain</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {filteredStudents.map(student => {
              const isCurrentUser = currentUserId === student.id;
              const hasSubmitted = submittedStudentIds
                ? submittedStudentIds.includes(student.id)
                : true; // default true when context not provided
              return (
                <div
                  key={student.id}
                  className={`flex items-center gap-3 p-3 border rounded-2xl transition-colors cursor-pointer ${
                    isCurrentUser
                      ? 'bg-emerald-50 border-emerald-500 hover:bg-emerald-100'
                      : hasSubmitted
                        ? 'border-gray-200 hover:bg-gray-50'
                        : 'bg-red-50 border-red-400 hover:bg-red-100'
                  }`}
                  role='button'
                  tabIndex={0}
                  onClick={() => {
                    setSelectedStudent(student);
                    setModalContent('profile');
                    setIsMbtiOpen(true);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedStudent(student);
                      setModalContent('profile');
                      setIsMbtiOpen(true);
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
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium text-gray-900 truncate'>
                      {student.name}
                    </p>
                  </div>
                  {canManage && (
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
                      {openMenuStudentId === student.id && (
                        <div className='absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden'>
                          <button
                            className='w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600'
                            onClick={e => {
                              e.stopPropagation();
                              setConfirmStudentId(student.id);
                              setOpenMenuStudentId(null);
                              setRemoveError(null);
                            }}
                          >
                            Hapus mahasiswa
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
              ? 'Profil Mahasiswa'
              : 'Persebaran MBTI'}
          </DialogTitle>
          {selectedStudent &&
            (() => {
              const studentUser: ExtendedUser = {
                id: selectedStudent.id,
                name: selectedStudent.name,
                email: selectedStudent.email,
                role: null,
                nimNpm: selectedStudent.nim,
                isOnboarded: true,
                onboardingStep: null,
                mbtiType: (selectedStudent.mbtiType ||
                  null) as ExtendedUser['mbtiType'],
                ei: selectedStudent.ei,
                sn: selectedStudent.sn,
                tf: selectedStudent.tf,
                pj: selectedStudent.pj,
                createdAt: new Date(0),
                updatedAt: new Date(0),
                image: null,
                emailVerified: false,
                gender: null,
              } as unknown as ExtendedUser;

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
            <DialogTitle className='text-left'>Hapus Mahasiswa</DialogTitle>
            {removeError && (
              <p className='text-sm text-red-600 bg-red-50 p-2 rounded-md text-left'>
                {removeError}
              </p>
            )}
          </DialogHeader>
          <p className='text-sm text-muted-foreground text-left'>
            Mahasiswa akan dihapus dari kelas ini. Lanjutkan?
          </p>
          <DialogFooter className='flex flex-col gap-2 sm:flex-col'>
            <Button
              variant='destructive'
              onClick={() =>
                confirmStudentId && onRemoveStudent(confirmStudentId)
              }
              disabled={isRemoving}
              className='w-full rounded-full'
            >
              {isRemoving ? 'Menghapus...' : 'Hapus'}
            </Button>
            <Button
              variant='outline'
              onClick={() => setConfirmStudentId(null)}
              disabled={isRemoving}
              className='w-full rounded-full'
            >
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
