import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getMessages } from 'next-intl/server';
import Logo from '@/components/logo';
import DataDiriFormClient from '@/components/onboarding/data-diri/data-diri-form-client';
import { Button } from '@/components/ui/button';
import { redirect } from '@/i18n/routing';
import { getDataDiri } from '@/lib/actions/data-diri';
import { isInstitutionalEmail } from '@/lib/email';
import { getUserPersonalitySessionStatus } from '@/lib/personality-session';
import { protectOnboardingPage } from '@/lib/server-auth';

interface DataDiriPageProps {
  params: Promise<{
    locale: string;
    role: 'dosen' | 'mahasiswa';
  }>;
}

export default async function DataDiriPage({
  params,
  searchParams,
}: DataDiriPageProps & { searchParams: Promise<{ edit?: string }> }) {
  const { locale, role } = await params;
  const { edit } = await searchParams;
  const messages = (await getMessages()) as {
    onboarding: {
      dataDiri: {
        title: string;
        namaLengkap: string;
        namaLengkapPlaceholder: string;
        nim: string;
        nimPlaceholder: string;
        npm: string;
        npmPlaceholder: string;
        jenisKelamin: string;
        lakiLaki: string;
        perempuan: string;
        continue: string;
        saving: string;
        validation: {
          namaLengkapMin: string;
          namaLengkapMax: string;
          namaLengkapPattern: string;
          nimMin: string;
          nimMax: string;
          nimPattern: string;
          npmMin: string;
          npmMax: string;
          npmPattern: string;
          jenisKelaminRequired: string;
        };
      };
    };
  };

  // Validate role parameter
  if (!['dosen', 'mahasiswa'].includes(role)) {
    redirect({ href: '/onboarding/role', locale });
  }

  // Protect the onboarding page
  const user = await protectOnboardingPage();

  // Check if auto-role is disabled (show back button) or enabled (hide back button)
  const devDisableAutoRole = process.env.DEV_DISABLE_AUTO_ROLE === 'true';

  // Convert URL slug to database role for comparison
  const expectedDbRole = role === 'dosen' ? 'TEACHER' : 'STUDENT';
  if (user.role && user.role !== expectedDbRole) {
    const userRoleSlug = user.role === 'TEACHER' ? 'dosen' : 'mahasiswa';
    redirect({ href: `/onboarding/data-diri/${userRoleSlug}`, locale });
  }

  // For dosen, ensure institutional email domain
  if (role === 'dosen') {
    if (!isInstitutionalEmail(user.email)) {
      redirect({ href: '/onboarding/role?err=dosen_email', locale });
    }
  }

  if (role === 'mahasiswa' && user.nim && edit !== 'true') {
    const sessionStatus = await getUserPersonalitySessionStatus(
      user.id,
      locale
    );

    if (!sessionStatus || sessionStatus.status === 'completed_valid') {
      redirect({ href: '/dashboard?firstVisit=true', locale });
    }

    redirect({ href: '/onboarding/kepribadian', locale });
  }

  let initialData: {
    namaLengkap: string;
    nim: string;
    jenisKelamin: string;
    role: string;
  };
  try {
    initialData = await getDataDiri();
  } catch {
    // If we can't fetch data, start with empty form
    initialData = {
      namaLengkap: '',
      nim: '',
      jenisKelamin: '',
      role: '',
    };
  }

  return (
    <main className='bg-white min-h-screen p-12'>
      <Logo color='black' className='justify-center' />

      <div className='flex items-center justify-center space-x-2 pt-20'>
        <h1 className='font-bold text-black text-6xl tracking-tighter'>
          {messages.onboarding.dataDiri.title}
        </h1>
        <Image
          src='/emoji/pencil.svg'
          width={80}
          height={80}
          alt='question icon'
        />
      </div>
      <div className='flex flex-col items-center justify-center py-14 px-8'>
        {devDisableAutoRole && (
          <div className='mb-4'>
            <Link href={user.role ? '/onboarding/role' : '/onboarding/resume'}>
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
          </div>
        )}
        <DataDiriFormClient
          role={role}
          initialData={initialData}
          dict={messages}
        />
      </div>
    </main>
  );
}
