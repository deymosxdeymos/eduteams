'use client';

import { MoreVertical, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface StudentClass {
  id: string;
  namaMataKuliah: string;
  kelas: string;
  tahunAwalPeriode: number;
  tahunAkhirPeriode: number;
  studentCount: number; // Add student count
  dosen?: {
    name: string;
  };
}

interface StudentClassGridProps {
  classes: StudentClass[];
  showNoResults: boolean;
  onClassLeft?: () => void;
}

const getClassBadgeColor = (classCode: string) => {
  const colorMap: Record<string, { bg: string; text: string; dot: string }> = {
    RA: { bg: 'bg-violet-100', text: 'text-violet-800', dot: 'bg-violet-800' },
    RB: { bg: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-800' },
    RC: { bg: 'bg-pink-100', text: 'text-pink-800', dot: 'bg-pink-800' },
    RD: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-800' },
    RE: { bg: 'bg-lime-100', text: 'text-lime-800', dot: 'bg-lime-800' },
    'tanpa-kelas': {
      bg: 'bg-gray-50',
      text: 'text-gray-900',
      dot: 'bg-gray-900',
    },
  };

  return (
    colorMap[classCode] || {
      bg: 'bg-gray-50',
      text: 'text-gray-900',
      dot: 'bg-gray-900',
    }
  );
};

export function StudentClassGrid({
  classes,
  showNoResults,
  onClassLeft,
}: StudentClassGridProps) {
  const router = useRouter();
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<StudentClass | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLeaveClass = async () => {
    if (!selectedClass) return;

    setIsLeaving(true);
    setError(null);

    try {
      const response = await fetch('/api/student/leave-class', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: selectedClass.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to leave class');
      }

      // Close modal and trigger data refresh
      setShowLeaveModal(false);
      setSelectedClass(null);

      // Always call the refresh callback, even on success
      // This ensures the UI updates immediately
      if (onClassLeft) {
        onClassLeft();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleOptionsClick = (e: React.MouseEvent, classItem: StudentClass) => {
    e.stopPropagation();
    setSelectedClass(classItem);
    setShowLeaveModal(true);
    setError(null); // Reset error when opening modal
  };

  if (showNoResults) {
    return (
      <div className='flex flex-col items-center justify-center h-64 text-center'>
        <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4'>
          <svg
            className='w-8 h-8 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            role='img'
            aria-label='Search icon'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
          </svg>
        </div>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>
          Tidak ada hasil
        </h3>
        <p className='text-gray-500'>Coba gunakan kata kunci yang berbeda</p>
      </div>
    );
  }

  const handleClassClick = (classId: string) => {
    router.push(`/dashboard/class/${classId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent, classId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClassClick(classId);
    }
  };

  return (
    <>
      <div className='flex h-full flex-col pt-4 pb-6'>
        <div
          className='grid flex-1 grid-cols-1 gap-6 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3 lg:grid-rows-3'
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent',
          }}
        >
          {classes.map(classItem => {
            const badgeColors = getClassBadgeColor(classItem.kelas);

            return (
              <div
                key={classItem.id}
                role='button'
                tabIndex={0}
                className='group flex h-full w-full cursor-pointer flex-col rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:opacity-95 md:px-5 md:py-4'
                onClick={() => handleClassClick(classItem.id)}
                onKeyDown={e => handleKeyDown(e, classItem.id)}
              >
                <div className='flex items-start justify-between'>
                  <div className='flex flex-wrap gap-2'>
                    {classItem.kelas !== 'tanpa-kelas' && (
                      <Badge
                        variant='destructive'
                        className={`${badgeColors.bg} ${badgeColors.text} text-xs font-medium transition-colors group-hover:brightness-95`}
                      >
                        <div
                          className={`h-2 w-2 rounded-full ${badgeColors.dot}`}
                        ></div>{' '}
                        {classItem.kelas}
                      </Badge>
                    )}
                    <Badge
                      variant='default'
                      className='rounded-2xl bg-sky-50 text-xs font-medium text-sky-900'
                    >
                      {classItem.studentCount} mahasiswa
                    </Badge>
                  </div>
                  <button
                    type='button'
                    className='rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100'
                    onClick={e => handleOptionsClick(e, classItem)}
                  >
                    <MoreVertical className='h-4 w-4' />
                  </button>
                </div>
                <h3 className='min-h-[3.6rem] text-[1.35rem] font-semibold leading-tight text-gray-800 line-clamp-2 md:min-h-[3.75rem] md:text-[1.65rem]'>
                  {classItem.namaMataKuliah}
                </h3>
                <div className='mt-auto space-y-2 pt-1'>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <User className='h-4 w-4' />
                    <span>{classItem.dosen?.name || 'N/A'}</span>
                  </div>
                  <p className='text-xs font-medium tracking-wide text-gray-500 md:text-sm md:tracking-normal'>
                    {classItem.tahunAwalPeriode}/{classItem.tahunAkhirPeriode}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leave Class Modal */}
      <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
        <DialogContent className='sm:max-w-xs'>
          <DialogHeader>
            <DialogTitle className='text-left'>Keluar Kelas?</DialogTitle>
            <div className='text-left space-y-4'>
              <DialogDescription>
                Jika kamu keluar dari kelas ini, kamu tidak akan bisa mengakses
                tugas, pengumuman, atau informasi dari kelas ini lagi.
              </DialogDescription>
              <p className='font-medium text-muted-foreground text-sm'>
                Apakah kamu yakin ingin keluar?
              </p>
              {error && (
                <p className='text-sm text-red-600 bg-red-50 p-2 rounded-md'>
                  {error}
                </p>
              )}
            </div>
          </DialogHeader>
          <DialogFooter className='flex flex-col gap-2 sm:flex-col'>
            <Button
              variant='destructive'
              onClick={handleLeaveClass}
              disabled={isLeaving}
              className='w-full rounded-full'
            >
              {isLeaving ? 'Meninggalkan...' : 'Keluar'}
            </Button>
            <Button
              variant='outline'
              onClick={() => setShowLeaveModal(false)}
              disabled={isLeaving}
              className='w-full rounded-full'
            >
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
