'use client';

import { ArrowLeft } from 'lucide-react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import type { Course } from '@/lib/types';
import { EmptyStudentAssignmentState } from './empty-student-assignment-state';

interface StudentClassAssignmentsProps {
  classId: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function StudentClassAssignments({
  classId,
}: StudentClassAssignmentsProps) {
  const { data: classData, error } = useSWR(`/api/courses/${classId}`, fetcher);

  const course: Course = classData?.data;

  if (error) {
    console.error('Failed to load class:', error);
  }

  if (!course) {
    return <div>Loading...</div>;
  }

  // TODO: Fetch student assignments/tasks for this class
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

          <span className='text-gray-600 font-medium'>Kembali</span>
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
              <EmptyStudentAssignmentState />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
