import { redirect } from 'next/navigation';
import Logo from '@/components/logo';
import TokenVerificationClient from '@/components/onboarding/token/token-verification-client';
import { getCurrentUser } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function TokenVerificationPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/signin');
  }

  // Check user role and onboarding progress
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      role: true,
      onboardingStep: true,
    },
  });

  // Only allow dosen to access this page
  if (currentUser?.role !== 'dosen') {
    redirect('/onboarding/role');
  }

  // If user already completed token verification, redirect to data-diri
  if (currentUser.onboardingStep && currentUser.onboardingStep !== 'role') {
    redirect(`/onboarding/data-diri/${currentUser.role}`);
  }

  return (
    <main className='bg-white min-h-screen p-12'>
      <Logo color='black' className='justify-center' />

      <div className='flex items-center justify-center space-x-2 pt-20'>
        <h1 className='font-bold text-black text-6xl tracking-tighter'>
          Masukkan Token
        </h1>
      </div>

      <TokenVerificationClient />
    </main>
  );
}
