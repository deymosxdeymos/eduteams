import { protectDashboard } from '@/lib/server-auth';
import Logo from '@/components/logo';

export default async function Dashboard() {
  const user = await protectDashboard();

  return (
    <main className='bg-white min-h-screen'>
      <Logo color='black' />

      <div className='flex flex-col items-center justify-center pt-20'>
        <h1 className='font-bold text-black text-6xl tracking-tighter mb-8'>
          Dashboard
        </h1>

        <div className='bg-gray-100 p-8 rounded-lg shadow-lg max-w-md w-full'>
          <h2 className='text-2xl font-semibold mb-4'>Welcome!</h2>
          <div className='space-y-2'>
            <p>
              <strong>Name:</strong> {user.name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Role:</strong> {user.role}
            </p>
            <p>
              <strong>NIM/NPM:</strong> {user.nimNpm}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
