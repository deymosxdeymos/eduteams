import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export default async function AuthExamplePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return (
      <main className='p-6'>
        <h1 className='text-xl font-semibold'>Not authenticated</h1>
        <p className='text-sm text-muted-foreground'>Sign in to continue.</p>
      </main>
    );
  }

  return (
    <main className='p-6'>
      <h1 className='text-xl font-semibold'>
        Welcome, {session.user.name ?? 'User'}
      </h1>
      <p className='text-sm text-muted-foreground'>Session is active.</p>
    </main>
  );
}
