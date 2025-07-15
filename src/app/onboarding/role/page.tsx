'use client';

import Logo from '@/components/logo';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import RoleSelect from '@/components/onboarding/role/role-select';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<
    'dosen' | 'mahasiswa' | undefined
  >();
  const router = useRouter();

  const handleRoleSelect = (role: 'dosen' | 'mahasiswa') => {
    setSelectedRole(role);
  };

  const handleNext = () => {
    if (selectedRole) {
      router.push(`/onboarding/data-diri/${selectedRole}`);
    }
  };

  return (
    <main className='bg-white min-h-screen'>
      <Logo color='black' />

      <div className='flex items-center justify-center space-x-2 pt-20'>
        <Image
          src='/emoji/grimming-face.svg'
          width={80}
          height={80}
          alt='question icon'
        />
        <h1 className='font-bold text-black text-6xl tracking-tighter'>
          Pilih role kamu!
        </h1>
      </div>
      <div className='flex items-center justify-center space-y-2 py-20'>
        <RoleSelect
          onRoleSelect={handleRoleSelect}
          selectedRole={selectedRole}
        />
      </div>
      <div className='flex items-center justify-center gap-x-2'>
        <Button
          variant='onboarding'
          size='long'
          className='w-[700px]'
          onClick={handleNext}
          disabled={!selectedRole}
        >
          Lanjut
          <ArrowRight
            strokeWidth={3}
            className='font-bold text-white text-lg'
          />
        </Button>
      </div>
    </main>
  );
}
