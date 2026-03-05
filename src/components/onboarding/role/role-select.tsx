'use client';

import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('onboarding.role');
  const id = useId();

  return (
    <div className='flex gap-x-16 items-start justify-center'>
      <div className='flex flex-col items-center relative'>
        <motion.button
          type='button'
          aria-describedby={
            showDosenInvalid ? `${id}-dosen-email-requirement` : undefined
          }
          className={`flex flex-col items-center justify-center rounded-4xl w-[20rem] h-[20rem] p-2 cursor-pointer ${
            selectedRole === 'dosen' ? 'ring-4 ring-amber-300' : ''
          }`}
          animate={{
            scale: selectedRole === 'dosen' ? 1.05 : 1,
            backgroundColor:
              selectedRole === 'dosen'
                ? 'rgb(253, 230, 138)'
                : 'rgb(244, 244, 245)',
          }}
          whileHover={
            selectedRole !== 'dosen'
              ? {
                  backgroundColor: 'rgb(228, 228, 231)',
                  scale: 1.02,
                  boxShadow:
                    '0 0 0 2px rgba(251, 191, 36, 0.2), 0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }
              : undefined
          }
          whileTap={{ scale: 0.98 }}
          transition={{
            type: 'spring',
            duration: 0.2,
            bounce: 0,
          }}
          onClick={() => onRoleSelect('dosen')}
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
            {t('dosen')}
          </h1>
        </motion.button>
        {showDosenInvalid && (
          <div
            role='status'
            aria-live='polite'
            id={`${id}-dosen-email-requirement`}
            className='absolute top-full mt-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-sm border border-amber-200 bg-amber-50 text-amber-800 px-3 py-1 text-xs shadow-sm'
          >
            <AlertCircle className='h-3.5 w-3.5' />
            <span className='whitespace-nowrap'>
              {t('institutionalEmailRequired')}
            </span>
          </div>
        )}
      </div>
      <motion.button
        type='button'
        className={`flex flex-col items-center justify-center rounded-4xl w-[20rem] h-[20rem] p-2 cursor-pointer ${
          selectedRole === 'mahasiswa' ? 'ring-4 ring-green-300' : ''
        }`}
        animate={{
          scale: selectedRole === 'mahasiswa' ? 1.05 : 1,
          backgroundColor:
            selectedRole === 'mahasiswa'
              ? 'rgb(187, 247, 208)'
              : 'rgb(244, 244, 245)',
        }}
        whileHover={
          selectedRole !== 'mahasiswa'
            ? {
                backgroundColor: 'rgb(228, 228, 231)',
                scale: 1.02,
                boxShadow:
                  '0 0 0 2px rgba(134, 239, 172, 0.2), 0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }
            : undefined
        }
        whileTap={{ scale: 0.98 }}
        transition={{
          type: 'spring',
          duration: 0.2,
          bounce: 0,
        }}
        onClick={() => onRoleSelect('mahasiswa')}
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
          {t('mahasiswa')}
        </h1>
      </motion.button>
    </div>
  );
}
