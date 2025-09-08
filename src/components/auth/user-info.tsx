import { cookies, headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { LogoutButton } from './logout-button';

interface AuthApiRequestContext {
  headers: Awaited<ReturnType<typeof headers>>;
  cookies: Awaited<ReturnType<typeof cookies>>;
}

export async function UserDisplay() {
  const session = await auth.api.getSession({
    headers: await headers(),
    cookies: await cookies(),
  } as AuthApiRequestContext);

  return (
    <div className='fixed top-4 right-4 bg-white border-2 border-gray-300 p-4 rounded-lg shadow-lg max-w-sm'>
      {session ? (
        <div>
          <h3 className='font-bold text-lg mb-2 text-green-600'>
            ✓ Logged in as:
          </h3>
          <div className='space-y-2'>
            <p>
              <strong>Name:</strong> {session.user.name}
            </p>
            <p>
              <strong>Email:</strong> {session.user.email}
            </p>
            <p>
              <strong>Role:</strong> {session.user.role || 'Not set'}
            </p>
            <p>
              <strong>Onboarded:</strong>{' '}
              {session.user.isOnboarded ? 'Yes' : 'No'}
            </p>
          </div>
          <LogoutButton />
        </div>
      ) : (
        <div>
          <h3 className='font-bold text-lg mb-2 text-red-600'>
            ✗ Not logged in
          </h3>
          <p className='text-gray-600'>Please login to continue</p>
        </div>
      )}
    </div>
  );
}
