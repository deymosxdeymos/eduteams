import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Logo from '@/components/logo';
import RoleFormClient from '@/components/onboarding/role/role-form-client';
import { isInstitutionalEmail } from '@/lib/email';
import { getUserPersonalitySessionStatus } from '@/lib/personality-session';
import { protectOnboardingPage } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export default async function RolePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('onboarding.role');
  const user = await protectOnboardingPage();

  if (user.role === 'dosen' && isInstitutionalEmail(user.email)) {
    if (!user.nimNpm) {
      redirect('/onboarding/data-diri/dosen');
    }
    redirect('/dashboard?firstVisit=true');
  }

  if (user.role === 'mahasiswa') {
    if (!user.nimNpm) {
      redirect('/onboarding/data-diri/mahasiswa');
    }

    const sessionStatus = await getUserPersonalitySessionStatus(
      user.id,
      locale
    );

    if (!sessionStatus) {
      redirect('/onboarding/kepribadian');
    }

    if (sessionStatus.status === 'completed_valid') {
      redirect('/dashboard?firstVisit=true');
    }

    redirect('/onboarding/kepribadian');
  }

  return (
    <main className='bg-white min-h-screen p-12'>
      <Logo color='black' className='justify-center' />

      <div className='flex items-center justify-center space-x-2 pt-20'>
        <Image
          src='/emoji/grimming-face.svg'
          width={80}
          height={80}
          alt='question icon'
        />
        <h1 className='font-bold text-black text-6xl tracking-tighter'>
          {t('title')}
        </h1>
      </div>

      <RoleFormClient
        initialRole={user.role as 'dosen' | 'mahasiswa' | undefined}
        hasInstitutionalEmail={isInstitutionalEmail(user.email)}
      />
    </main>
  );
}
