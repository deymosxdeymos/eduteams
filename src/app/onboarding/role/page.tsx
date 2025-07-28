import Logo from '@/components/logo';
import Image from 'next/image';
import RoleFormClient from '@/components/onboarding/role/role-form-client';
import { getCurrentUserRole } from '@/lib/actions/role';
import { redirect } from 'next/navigation';

export default async function RolePage() {
  const currentUserData = await getCurrentUserRole();

  // If user already has a role and has completed this step, redirect to next step
  if (currentUserData?.role && currentUserData.onboardingStep !== 'role') {
    redirect(`/onboarding/data-diri/${currentUserData.role}`);
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
          Pilih role kamu!
        </h1>
      </div>

      <RoleFormClient
        initialRole={currentUserData?.role as 'dosen' | 'mahasiswa' | undefined}
      />
    </main>
  );
}
