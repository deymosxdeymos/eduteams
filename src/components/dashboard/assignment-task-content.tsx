'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface AssignmentTaskContentProps {
  assignmentId: string;
  classId: string;
}

export function AssignmentTaskContent({
  assignmentId: _assignmentId,
  classId,
}: AssignmentTaskContentProps) {
  const router = useRouter();

  return (
    <div className='flex-1 p-8 min-h-0'>
      <div className='h-full flex flex-col space-y-4 text-gray-500'>
        <div className='flex items-center gap-4 flex-shrink-0'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => router.push(`/dashboard/class/${classId}`)}
            className='rounded-full'
          >
            <ArrowLeft strokeWidth={2} className='w-6 h-6 text-gray-600' />
          </Button>
        </div>

        <div className='flex-1 flex items-center justify-center'>
          <div className='text-center max-w-md'>
            <div className='mb-6'>
              <div className='w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg
                  className='w-12 h-12 text-blue-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                  />
                </svg>
              </div>
              <h1 className='text-2xl font-bold text-gray-800 mb-2'>
                Menunggu Pembagian Kelompok
              </h1>
              <p className='text-gray-600'>
                Sistem sedang memproses pembagian kelompok berdasarkan jawaban
                quiz Anda. Silakan tunggu sebentar atau hubungi dosen jika ada
                pertanyaan.
              </p>
            </div>

            <div className='flex items-center justify-center space-x-2'>
              <div className='w-2 h-2 bg-blue-600 rounded-full animate-bounce'></div>
              <div
                className='w-2 h-2 bg-blue-600 rounded-full animate-bounce'
                style={{ animationDelay: '0.1s' }}
              ></div>
              <div
                className='w-2 h-2 bg-blue-600 rounded-full animate-bounce'
                style={{ animationDelay: '0.2s' }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
