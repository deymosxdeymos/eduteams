import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function UserDisplay() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  return (
    <div className='fixed top-4 right-4 bg-green-600 p-4 rounded-lg shadow-lg max-w-sm'>
      <h3 className='font-bold text-lg mb-2'>Logged in as:</h3>
      <div className='space-y-2'>
        <p>
          <strong>Name:</strong> {session.user.name}
        </p>
        <p>
          <strong>Email:</strong> {session.user.email}
        </p>
      </div>
    </div>
  );
}
