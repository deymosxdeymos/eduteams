import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { handleAuthRedirect } from '@/lib/server-auth';
import { JoinClassClient } from './join-class-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Join Class - EduTeams',
    description: 'Join a class using invitation link',
  };
}

type JoinClassPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function JoinClassPage({ params }: JoinClassPageProps) {
  const user = await handleAuthRedirect();
  const { token } = await params;

  // If no user, redirect to login with return URL
  if (!user) {
    redirect(`/?returnUrl=${encodeURIComponent(`/join-class/${token}`)}`);
  }

  return <JoinClassClient user={user} token={token} />;
}
