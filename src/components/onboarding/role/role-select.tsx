'use client';

import { AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useId } from 'react';

interface RoleSelectProps {
  onRoleSelect: (role: 'dosen' | 'mahasiswa') => void;
  selectedRole?: 'dosen' | 'mahasiswa';
  showDosenInvalid?: boolean;
}

export default function RoleSelect({
  onRoleSelect,
  selectedRole,
  showDosenInvalid,
}: RoleSelectProps) {
  const id = useId();

  return (
    <div className='flex gap-x-16 items-start justify-center'>
      <div className='flex flex-col items-center relative'>
        <button
          type='button'
          aria-describedby={
            showDosenInvalid ? `${id}-dosen-email-requirement` : undefined
          }
          className={`flex flex-col items-center justify-center rounded-4xl w-[20rem] h-[20rem] p-2 cursor-pointer transition-all duration-200 ${
            selectedRole === 'dosen'
              ? 'bg-amber-200 ring-4 ring-amber-300 scale-105'
              : 'bg-accent hover:bg-accent/70 hover:ring-2 hover:ring-amber-200 hover:scale-102'
          }`}
          onClick={() => onRoleSelect('dosen')}
          onKeyDown={e => e.key === 'Enter' && onRoleSelect('dosen')}
        >
          {' '}
          <Image
            src={
              selectedRole === 'dosen' ? '/dosen.svg' : '/dosen-inactive.svg'
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
        {showDosenInvalid && (
          <div
            role='status'
            aria-live='polite'
            id={`${id}-dosen-email-requirement`}
            className='absolute top-full mt-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 text-amber-800 px-3 py-1 text-xs shadow-sm'
          >
            <AlertCircle className='h-3.5 w-3.5' />
            <span className='whitespace-nowrap'>Email institusi diperlukan</span>
          </div>
        )}
      </div>
      <button
        type='button'
        className={`flex flex-col items-center justify-center rounded-4xl w-[20rem] h-[20rem] p-2 cursor-pointer transition-all duration-300 ${
          selectedRole === 'mahasiswa'
            ? 'bg-green-200 ring-4 ring-green-300 scale-105'
            : 'bg-accent hover:bg-accent/70 hover:ring-2 hover:ring-green-200 hover:scale-102'
        }`}
        onClick={() => onRoleSelect('mahasiswa')}
        onKeyDown={e => e.key === 'Enter' && onRoleSelect('mahasiswa')}
      >
        {' '}
        <Image
          src={
            selectedRole === 'mahasiswa'
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
