'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export function TeamFormationLoading() {
  const t = useTranslations('dashboard.teams');
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % 4);
    }, 250); // 250ms per icon = 1 second full cycle

    return () => clearInterval(interval);
  }, []);

  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] gap-6'>
      <div
        className='flex items-center gap-3'
        role='status'
        aria-live='polite'
        aria-label={t('formingTeams')}
      >
        {[0, 1, 2, 3].map(index => (
          <div
            key={index}
            className='w-12 h-12 relative transition-opacity duration-[250ms] motion-reduce:transition-none'
            style={{
              opacity: activeIndex === index ? 1 : 0.3,
              transitionTimingFunction: 'cubic-bezier(.215, .61, .355, 1)',
            }}
          >
            <Image
              src={
                activeIndex === index
                  ? `/loading/loading-color-${index + 1}.svg`
                  : `/loading/loading-${index + 1}.svg`
              }
              alt=''
              width={48}
              height={48}
              className='w-full h-full motion-reduce:hidden'
              priority
            />
            {/* Fallback for reduced motion: show static colored icon */}
            <Image
              src={`/loading/loading-color-${index + 1}.svg`}
              alt=''
              width={48}
              height={48}
              className='w-full h-full hidden motion-reduce:block'
              priority
            />
          </div>
        ))}
      </div>
      <p className='text-lg font-medium text-gray-700'>{t('formingTeams')}</p>
    </div>
  );
}
