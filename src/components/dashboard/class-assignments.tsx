'use client';

import { ArrowLeft, Plus, Share2 } from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import type { Course } from '@/lib/types';
import { EmptyAssignmentState } from './empty-assignment-state';
import { ShareClassModal } from './share-class-modal';

interface ClassAssignmentsProps {
  classId: string;
  dosenId?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function ClassAssignments({ classId }: ClassAssignmentsProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { data: classData, error } = useSWR(`/api/courses/${classId}`, fetcher);

  const course: Course = classData?.data;

  if (error) {
    console.error('Failed to load class:', error);
  }

  if (!course) {
    return <div>Loading...</div>;
  }

  // TODO: Replace with actual assignments fetching
  const assignments: unknown[] = [];
  const hasAssignments = assignments.length > 0;

  return (
    <div className='bg-white rounded-3xl rounded-r-none h-full flex flex-col overflow-hidden'>
      <div className='p-6'>
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
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
              /* TODO: Add create assignment functionality */
            }}
          >
            <Plus strokeWidth={3} className='w-4 h-4 text-white mr-2' />
            <span className='font-semibold text-sm'>Buat Tugas Baru</span>
          </Button>

          <Button
            variant='outline'
            className='rounded-full p-6'
            onClick={() => setIsShareModalOpen(true)}
          >
            <Share2 className='w-4 h-4 mr-2' />
            <span className='font-semibold text-sm'>Bagikan Kelas</span>
          </Button>
        </div>
      </div>

      {/* Assignments section */}
      <div className='p-6 flex-1 flex flex-col overflow-hidden'>
        <div className='flex-1 overflow-hidden'>
          {hasAssignments ? (
            <div className='h-full overflow-y-auto'>
              <div className='text-center py-8'>
                <p>Assignment list will go here</p>
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
        classId={classId}
      />
    </div>
  );
}
