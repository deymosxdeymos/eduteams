import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { canAccessMahasiswaFeatures } from '@/lib/authorization';
import type { Course, ExtendedUser } from '@/lib/types';

interface NavProps {
  user: ExtendedUser;
  className?: Course;
  assignmentTitle?: string;
  answersCrumb?: string | boolean;
}

export default function Nav({
  user,
  className,
  assignmentTitle,
  answersCrumb,
}: NavProps) {
  const isClassCurrent = !!className && !assignmentTitle && !answersCrumb;
  const isAssignmentCurrent = !!className && !!assignmentTitle && !answersCrumb;
  const isAnswersCurrent = !!className && !!assignmentTitle && !!answersCrumb;
  return (
    <div className='flex flex-row justify-between items-center px-3'>
      <div className='flex gap-x-10'>
        <Image
          src='/mascot-yellow-head.svg'
          width={50}
          height={50}
          alt='mascot'
        />
        <div className='leading-loose flex items-center'>
          {className ? (
            <div className='flex items-center gap-2'>
              {/* Class crumb (no leading chevron) */}
              <h1
                className={`text-xl ${isClassCurrent ? 'font-bold' : 'font-medium'} tracking-tight`}
              >
                {className.namaMataKuliah}
                {className.kelas ? ` - ${className.kelas}` : ''}
              </h1>
              {/* Assignment crumb */}
              {assignmentTitle ? (
                <>
                  <ChevronRight
                    strokeWidth={3}
                    className='w-5 h-5 text-black'
                  />
                  <h2
                    className={`text-xl ${isAssignmentCurrent ? 'font-bold' : 'font-medium'} tracking-tight`}
                  >
                    {assignmentTitle}
                  </h2>
                </>
              ) : null}
              {/* Answers crumb */}
              {assignmentTitle && answersCrumb ? (
                <>
                  <ChevronRight
                    strokeWidth={3}
                    className='w-5 h-5 text-black'
                  />
                  <h3
                    className={`text-xl ${isAnswersCurrent ? 'font-bold' : 'font-medium'} tracking-tight`}
                  >
                    {typeof answersCrumb === 'string'
                      ? answersCrumb
                      : 'Jawaban Mahasiswa'}
                  </h3>
                </>
              ) : null}
            </div>
          ) : (
            <div>
              <h1 className='text-3xl font-semibold tracking-tight'>
                Halo, {user.name}!
              </h1>
              <p className='text-lg font-normal mt-2'>
                {canAccessMahasiswaFeatures(user)
                  ? 'Yuk, cek progres kelas dan siap-siap mulai bareng kelompokmu!'
                  : 'Pantau aktivitas dan kelola kelas Anda dengan mudah melalui dashboard ini'}
              </p>
            </div>
          )}
        </div>
      </div>
      <Button variant='outline' size='sm' className='py-7 rounded-full gap-x-4'>
        <h1 className='text-2xl text-stone-950 font-semibold'>ID</h1>
        <Image src='/indo.svg' width={40} height={40} alt='indonesia' />
      </Button>
    </div>
  );
}
