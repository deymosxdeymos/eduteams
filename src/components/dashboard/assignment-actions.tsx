'use client';

import { ArrowLeft, ChartLineIcon, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface AssignmentActionsProps {
  assignmentId: string;
  classId: string;
  canManage: boolean;
  isStudent?: boolean;
}

export function AssignmentActions({
  assignmentId,
  classId,
  canManage,
  isStudent = false,
}: AssignmentActionsProps) {
  const router = useRouter();

  return (
    <div className='flex items-center gap-4 flex-shrink-0'>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => window.history.back()}
        className='rounded-full'
      >
        <ArrowLeft strokeWidth={2} className='w-6 h-6 text-gray-600' />
      </Button>

      {canManage && (
        <Button variant='onboarding' className='rounded-full p-6 w-[11rem]'>
          <Plus strokeWidth={3} className='w-4 h-4 text-white' />
          <span className='font-semibold text-sm'>Buat Kelompok</span>
        </Button>
      )}

      {!isStudent && (
        <Button
          variant='outline'
          className='rounded-full border border-black p-6 w-[15rem]'
        >
          <ChartLineIcon className='w-4 h-4 text-black' />
          <span className='text-black font-semibold text-sm'>
            Lihat Jawaban Mahasiswa
          </span>
        </Button>
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
            Lihat Jawaban Saya
          </span>
        </Button>
      )}
    </div>
  );
}
