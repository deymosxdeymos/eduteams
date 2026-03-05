import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { DemoRoleSwitcher } from '@/components/demo/role-switcher';
import { getCurrentUser } from '@/lib/api-utils';
import { isActiveDemoAccountEmail } from '@/lib/demo/auth';
import { isDemoModeEnabled } from '@/lib/demo/config';
import { SWRProvider } from '@/lib/swr-provider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const demoMode = isDemoModeEnabled();
  const user = demoMode ? await getCurrentUser() : null;
  const demoRole =
    user?.role && isActiveDemoAccountEmail(user.email) ? user.role : null;

  return (
    <SWRProvider>
      <NuqsAdapter>
        {children}
        {demoRole === 'TEACHER' && <DemoRoleSwitcher currentRole='TEACHER' />}
        {demoRole === 'STUDENT' && <DemoRoleSwitcher currentRole='STUDENT' />}
      </NuqsAdapter>
    </SWRProvider>
  );
}
