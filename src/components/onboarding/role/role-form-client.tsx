'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useState, useTransition } from 'react';
import RoleSelect from '@/components/onboarding/role/role-select';
import { Button } from '@/components/ui/button';
import { submitRole } from '@/lib/actions/role';

interface RoleFormClientProps {
  initialRole?: 'dosen' | 'mahasiswa';
  hasInstitutionalEmail?: boolean;
  dict: {
    onboarding: {
      role: {
        dosen: string;
        mahasiswa: string;
        institutionalEmailRequired: string;
        loading: string;
        continue: string;
      };
    };
  };
}

export default function RoleFormClient({
  initialRole,
  hasInstitutionalEmail = false,
  dict,
}: RoleFormClientProps) {
  const [selectedRole, setSelectedRole] = useState<
    'dosen' | 'mahasiswa' | undefined
  >(initialRole);
  const [isPending, startTransition] = useTransition();
  const [shakeKey, setShakeKey] = useState(0);

  const isDosenInvalid = selectedRole === 'dosen' && !hasInstitutionalEmail;
  const isBlocked = !selectedRole || isPending || isDosenInvalid;

  const handleRoleSelect = (role: 'dosen' | 'mahasiswa') => {
    setSelectedRole(role);
  };

  const handleSubmit = async (formData: FormData) => {
    if (!selectedRole || isDosenInvalid) return;

    startTransition(async () => {
      try {
        await submitRole(formData);
      } catch (error) {
        console.error('Error submitting role:', error);
      }
    });
  };

  const handleBlockedClick = (e: React.MouseEvent) => {
    if (isDosenInvalid || !selectedRole) {
      e.preventDefault();
      e.stopPropagation();
      setShakeKey(prev => prev + 1);
    }
  };

  return (
    <form action={handleSubmit}>
      <div className='flex flex-col items-center justify-center space-y-6 py-20'>
        <RoleSelect
          onRoleSelect={handleRoleSelect}
          selectedRole={selectedRole}
          showDosenInvalid={isDosenInvalid}
          dict={dict}
        />
      </div>
      <div className='flex items-center justify-center gap-x-2'>
        <input type='hidden' name='role' value={selectedRole || ''} readOnly />
        <motion.div
          key={shakeKey}
          animate={
            shakeKey > 0
              ? {
                  x: [-4, 4, -3, 3, -2, 2, 0],
                  transition: { duration: 0.18, ease: 'easeInOut' },
                }
              : {}
          }
          className='w-[700px]'
        >
          <Button
            type='submit'
            variant='onboarding'
            size='long'
            disabled={isBlocked}
            aria-disabled={isBlocked}
            onClick={handleBlockedClick}
            className={`w-full ${
              isBlocked ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isPending
              ? dict.onboarding.role.loading
              : dict.onboarding.role.continue}
            <ArrowRight
              strokeWidth={3}
              className='font-bold text-neutral-400 text-lg'
            />
          </Button>
        </motion.div>
      </div>
    </form>
  );
}
