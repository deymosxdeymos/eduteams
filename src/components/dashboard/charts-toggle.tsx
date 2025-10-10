'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface ChartsToggleProps {
  progressPercent: number; // 0..100
  children: React.ReactNode;
}

export function ChartsToggle({ progressPercent, children }: ChartsToggleProps) {
  const [visible, setVisible] = useState(true);
  const onKey = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setVisible(v => !v);
    }
  }, []);
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <div
          role='button'
          tabIndex={0}
          onClick={() => setVisible(v => !v)}
          onKeyDown={onKey}
          className='inline-flex items-center gap-2 text-black select-none cursor-pointer'
          aria-expanded={visible}
        >
          <span className='font-medium'>Lihat Analisis Jawaban Mahasiswa</span>
          {visible ? (
            <ChevronDown className='w-4 h-4' />
          ) : (
            <ChevronRight className='w-4 h-4' />
          )}
        </div>
        <Badge className='rounded-full bg-emerald-50 text-emerald-700 border-emerald-200'>
          {Math.round(progressPercent)}% mahasiswa telah menyelesaikan kuis
        </Badge>
      </div>
      {visible && children}
    </div>
  );
}
