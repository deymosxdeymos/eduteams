'use client';

import { ArrowRight } from 'lucide-react';
import { useState, useTransition } from 'react';
import RoleSelect from '@/components/onboarding/role/role-select';
import { Button } from '@/components/ui/button';
import { submitRole } from '@/lib/actions/role';

interface RoleFormClientProps {
  initialRole?: 'dosen' | 'mahasiswa';
}

export default function RoleFormClient({ initialRole }: RoleFormClientProps) {
  const [selectedRole, setSelectedRole] = useState<
    'dosen' | 'mahasiswa' | undefined
  >(initialRole);
  const [isPending, startTransition] = useTransition();

  const handleRoleSelect = (role: 'dosen' | 'mahasiswa') => {
    setSelectedRole(role);
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
      <div className='flex items-center justify-center space-y-2 py-20'>
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
