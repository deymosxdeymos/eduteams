'use client';

import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function DemoLoginButton({ className }: { className?: string }) {
  const t = useTranslations('auth');
  const [isPending, startTransition] = useTransition();

  function handleDemoLogin() {
    startTransition(async () => {
      const response = await fetch('/api/demo/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();

      if (data.success) {
        window.location.href = data.data.redirectTo;
      }
    });
  }

  return (
    <Button
      type='button'
      variant='outline'
      size='lg'
      className={className}
      onClick={handleDemoLogin}
      disabled={isPending}
    >
      {isPending ? <LoadingSpinner size='sm' /> : null}
      {isPending ? t('signingIn') : t('tryDemo')}
    </Button>
  );
}
