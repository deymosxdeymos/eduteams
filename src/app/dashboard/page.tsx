import { protectDashboard } from '@/lib/server-auth';
import Logo from '@/components/logo';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

export default async function Dashboard() {
  const user = await protectDashboard();

  // Check if this is the user's first time visiting dashboard after onboarding
  // We'll use a simple approach: check if they just completed onboarding
  const isFirstTime = user.isOnboarded === true;

  return (
    <DashboardClient isFirstTime={isFirstTime}>
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
    </DashboardClient>
  );
}
