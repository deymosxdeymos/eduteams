'use client';

import Image from 'next/image';
import { useState } from 'react';

interface RoleSelectProps {
  onRoleSelect: (role: 'dosen' | 'mahasiswa') => void;
  selectedRole?: 'dosen' | 'mahasiswa';
}

export default function RoleSelect({
  onRoleSelect,
  selectedRole,
}: RoleSelectProps) {
  const [hoveredRole, setHoveredRole] = useState<'dosen' | 'mahasiswa' | null>(
    null
  );

  return (
    <div className='flex gap-x-16 items-center justify-center'>
      <button
        type='button'
        className={`flex flex-col items-center justify-center rounded-4xl w-[20rem] h-[20rem] p-2 cursor-pointer transition-all duration-200 ${
          selectedRole === 'dosen'
            ? 'bg-amber-200 ring-4 ring-amber-300 scale-105'
            : 'bg-accent hover:bg-amber-200'
        }`}
        onClick={() => onRoleSelect('dosen')}
        onKeyDown={e => e.key === 'Enter' && onRoleSelect('dosen')}
        onMouseEnter={() => setHoveredRole('dosen')}
        onMouseLeave={() => setHoveredRole(null)}
      >
        {' '}
        <Image
          src={
            selectedRole === 'dosen' || hoveredRole === 'dosen'
              ? '/dosen.svg'
              : '/dosen-inactive.svg'
          }
          width={240}
          height={240}
          alt='dosen'
          className='mb-[-20px] w-auto h-auto'
          priority
        />
        <h1
          className='font-bold text-center text-amber-950 text-5xl
		tracking-tighter leading-none uppercase'
        >
          Dosen
        </h1>
      </button>
      <button
        type='button'
        className={`flex flex-col items-center justify-center rounded-4xl w-[20rem] h-[20rem] p-2 cursor-pointer transition-all duration-200 ${
          selectedRole === 'mahasiswa'
            ? 'bg-green-200 ring-4 ring-green-300 scale-105'
            : 'bg-accent hover:bg-green-200'
        }`}
        onClick={() => onRoleSelect('mahasiswa')}
        onKeyDown={e => e.key === 'Enter' && onRoleSelect('mahasiswa')}
        onMouseEnter={() => setHoveredRole('mahasiswa')}
        onMouseLeave={() => setHoveredRole(null)}
      >
        {' '}
        <Image
          src={
            selectedRole === 'mahasiswa' || hoveredRole === 'mahasiswa'
              ? '/mahasiswa.svg'
              : '/mahasiswa-inactive.svg'
          }
          width={240}
          height={240}
          alt='mahasiswa'
          className='mb-[-20px]'
        />
        <h1 className='font-bold text-center text-green-950 text-5xl tracking-tighter leading-none uppercase'>
          Mahasiswa
        </h1>
      </button>
    </div>
  );
}
