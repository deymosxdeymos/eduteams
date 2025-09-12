import Image from 'next/image';
import { redirect } from 'next/navigation';
import Logo from '@/components/logo';
import RoleFormClient from '@/components/onboarding/role/role-form-client';
import { getDictionary } from '@/i18n/get-dictionary';
import { getLocale } from '@/i18n/server';
import { getCurrentUserRole } from '@/lib/actions/role';
import { isInstitutionalEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export default async function RolePage() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const currentUserData = await getCurrentUserRole();

  // If user already has a role and has progressed past role selection, redirect to next step
  if (
    currentUserData?.role &&
    currentUserData.onboardingStep &&
    currentUserData.onboardingStep !== 'role'
  ) {
    redirect(`/onboarding/data-diri/${currentUserData.role}`);
  }

  // If user selected dosen and is still on role step, auto-advance if email is institutional
  if (
    currentUserData?.role === 'dosen' &&
    currentUserData.onboardingStep === 'role' &&
    isInstitutionalEmail(currentUserData.email)
  ) {
    redirect('/onboarding/data-diri/dosen');
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
          {dict.onboarding.role.title}
        </h1>
      </div>

      <RoleFormClient
        initialRole={currentUserData?.role as 'dosen' | 'mahasiswa' | undefined}
        hasInstitutionalEmail={isInstitutionalEmail(currentUserData?.email)}
        dict={dict}
      />
    </main>
  );
}
