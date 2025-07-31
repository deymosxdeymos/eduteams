import Image from 'next/image';
import JoinClassModal from './join-class-modal';

interface EmptyStudentClassStateProps {
  onClassJoined?: () => void;
}

export function EmptyStudentClassState({
  onClassJoined,
}: EmptyStudentClassStateProps) {
  return (
    <div className='flex flex-col items-center justify-center gap-y-4 mx-auto h-full'>
      <Image
        src='/belum-kelas.svg'
        width={180}
        height={180}
        alt='belum kelas'
      />
      <div className='text-center'>
        <h1 className='text-3xl font-semibold text-gray-800 tracking-tight pb-2'>
          Anda belum memiliki kelas
        </h1>
        <p className='text-gray-600 text-sm font-normal'>
          Masukkan token kelas yang diberikan oleh dosen untuk bergabung ke
          kelas
        </p>
      </div>
      <JoinClassModal onClassJoined={onClassJoined} />
    </div>
  );
}
