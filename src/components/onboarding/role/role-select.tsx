'use client';

import Image from 'next/image';

interface RoleSelectProps {
  onRoleSelect: (role: 'dosen' | 'mahasiswa') => void;
  selectedRole?: 'dosen' | 'mahasiswa';
}

export default function RoleSelect({
  onRoleSelect,
  selectedRole,
}: RoleSelectProps) {
  return (
    <div className='flex gap-x-16 items-center justify-center'>
      <div
        className={`flex flex-col items-center justify-center rounded-4xl w-[20rem] h-[20rem] p-2 cursor-pointer transition-all duration-200 ${
          selectedRole === 'dosen'
            ? 'bg-amber-200 ring-4 ring-amber-300 scale-105'
            : 'bg-amber-100 hover:bg-amber-200'
        }`}
        onClick={() => onRoleSelect('dosen')}
      >
        {' '}
        <Image
          src='/dosen.svg'
          width={240}
          height={240}
          alt='dosen'
          className='mb-[-30px] w-auto h-auto'
          priority
        />
        <h1
          className='font-bold text-center text-amber-950 text-5xl 
		tracking-tighter leading-none uppercase'
        >
          Dosen
        </h1>
      </div>
      <div
        className={`flex flex-col items-center justify-center rounded-4xl w-[20rem] h-[20rem] p-2 cursor-pointer transition-all duration-200 ${
          selectedRole === 'mahasiswa'
            ? 'bg-green-200 ring-4 ring-green-300 scale-105'
            : 'bg-green-100 hover:bg-green-200'
        }`}
        onClick={() => onRoleSelect('mahasiswa')}
      >
        {' '}
        <Image
          src='/mahasiswa.svg'
          width={240}
          height={240}
          alt='mahasiswa'
          className='mb-[-30px] w-auto h-auto'
        />
        <h1 className='font-bold text-center text-green-950 text-5xl tracking-tighter leading-none uppercase'>
          Mahasiswa
        </h1>
      </div>
    </div>
  );
}
