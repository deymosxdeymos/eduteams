'use client';

import { ArrowRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import RoleSelect from '@/components/onboarding/role/role-select';
import { Button } from '@/components/ui/button';
import { submitRole } from '@/lib/actions/role';
import { authClient } from '@/lib/auth-client';

interface RoleFormClientProps {
  initialRole?: 'dosen' | 'mahasiswa';
}

export default function RoleFormClient({ initialRole }: RoleFormClientProps) {
  const [selectedRole, setSelectedRole] = useState<
    'dosen' | 'mahasiswa' | undefined
  >(initialRole);
  const [isPending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const showDosenEmailErr = searchParams.get('err') === 'dosen_email';

  const handleRoleSelect = (role: 'dosen' | 'mahasiswa') => {
    setSelectedRole(role);
  };

  const switchAccount = async () => {
    try {
      await authClient.signOut();
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/onboarding/resume',
      });
    } catch {
      // noop
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (!selectedRole) return;

    startTransition(async () => {
      try {
        await submitRole(formData);
      } catch (error) {
        console.error('Error submitting role:', error);
      }
    });
  };

  return (
    <form action={handleSubmit}>
      <div className='flex flex-col items-center justify-center space-y-6 py-20'>
        {showDosenEmailErr && (
          <div className='w-[700px] rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-6 py-4 text-center'>
            <p className='text-lg font-medium'>
              Role Dosen membutuhkan email @if.itera.ac.id. Silakan masuk dengan
              email institusi.
            </p>
            <div className='mt-4'>
              <Button type='button' variant='outline' onClick={switchAccount}>
                Ganti akun
              </Button>
            </div>
          </div>
        )}
        <RoleSelect
          onRoleSelect={handleRoleSelect}
          selectedRole={selectedRole}
        />
      </div>
      <div className='flex items-center justify-center gap-x-2'>
        <input type='hidden' name='role' value={selectedRole || ''} />
        <Button
          type='submit'
          variant='onboarding'
          size='long'
          className='w-[700px]'
          disabled={!selectedRole || isPending}
        >
          {isPending ? 'Loading...' : 'Lanjut'}
          <ArrowRight
            strokeWidth={3}
            className='font-bold text-neutral-400 text-lg'
          />
        </Button>
      </div>
    </form>
  );
}
