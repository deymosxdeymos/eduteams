import Image from 'next/image';
import { AssignmentActions } from '@/components/dashboard/assignment-actions';
import { AssignmentCharts } from '@/components/dashboard/assignment-charts';
import type { AssignmentStats } from '@/lib/stats/assignment';

interface AssignmentContentProps {
  assignmentId: string;
  classId: string;
  canManage: boolean;
  isStudent?: boolean;
  hasSubmitted?: boolean;
  stats: AssignmentStats;
}

export function AssignmentContent({
  assignmentId,
  classId,
  canManage,
  isStudent = false,
  stats,
}: AssignmentContentProps) {
  return (
    <div className='flex-1 p-8 min-h-0'>
      <div className='h-full flex flex-col space-y-4 text-gray-500'>
        <AssignmentActions
          assignmentId={assignmentId}
          classId={classId}
          canManage={canManage}
          isStudent={isStudent}
        />

        {isStudent ? (
          <div className='flex-1 flex items-center justify-center'>
            <div className='flex flex-col items-center text-center max-w-xl'>
              <Image
                src='/waiting-form.svg'
                alt='Menunggu pembagian kelompok'
                width={120}
                height={120}
                className='mb-6'
                priority
              />
              <h1 className='text-2xl font-bold text-gray-800 mb-2'>
                Menunggu pembagian kelompok!
              </h1>
              <p className='text-gray-600'>
                Tenang, datamu sudah terekam dengan baik. Tunggu sebentar ya,
                dosen sedang memproses pembagian kelompok.
              </p>
            </div>
          </div>
        ) : (
          <AssignmentCharts stats={stats} isStudent={isStudent} />
        )}
      </div>
    </div>
  );
}
