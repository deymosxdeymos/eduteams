import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Logo from '@/components/logo';
import DataDiriFormClient from '@/components/onboarding/data-diri/data-diri-form-client';
import { Button } from '@/components/ui/button';
import { getDataDiri } from '@/lib/actions/data-diri';

import prisma from '@/lib/prisma';
import { protectOnboardingPage } from '@/lib/server-auth';

interface DataDiriPageProps {
  params: Promise<{
    role: 'dosen' | 'mahasiswa';
  }>;
}

export default async function DataDiriPage({ params }: DataDiriPageProps) {
  const { role } = await params;

  // Validate role parameter
  if (!['dosen', 'mahasiswa'].includes(role)) {
    redirect('/onboarding/role');
  }

  // Protect the onboarding page
  const user = await protectOnboardingPage();

  // For dosen, check if they have verified their token
  if (role === 'dosen') {
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        onboardingStep: true,
      },
    });

    // If dosen hasn't verified token yet, redirect to token verification
    if (!currentUser?.onboardingStep || currentUser.onboardingStep === 'role') {
      redirect('/onboarding/token-verifikasi');
    }
  }

  let initialData: {
    namaLengkap: string;
    nimNpm: string;
    jenisKelamin: string;
    role: string;
  };
  try {
    initialData = await getDataDiri();
  } catch {
    // If we can't fetch data, start with empty form
    initialData = {
      namaLengkap: '',
      nimNpm: '',
      jenisKelamin: '',
      role: '',
    };
  }

  return (
    <main className='bg-white min-h-screen p-12'>
      <Logo color='black' className='justify-center' />

      <div className='flex items-center justify-center space-x-2 pt-20'>
        <h1 className='font-bold text-black text-6xl tracking-tighter'>
          Isi data diri
        </h1>
        <Image
          src='/emoji/pencil.svg'
          width={80}
          height={80}
          alt='question icon'
        />
      </div>
      <div className='flex items-start justify-center py-14 px-8'>
        <DataDiriFormClient role={role} initialData={initialData} />
      </div>
      <div className='flex items-center justify-center gap-x-6'>
        <Link
          href={
            role === 'dosen'
              ? '/onboarding/token-verifikasi'
              : '/onboarding/role'
          }
        >
          <Button
            variant='ghost'
            size='icon'
            className='rounded-full w-14 h-14 border border-black'
          >
            <ArrowLeft
              strokeWidth={3}
              className='font-bold text-black text-lg'
            />
          </Button>
        </Link>
        <Button
          variant='onboarding'
          size='long'
          form='data-diri-form'
          type='submit'
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
