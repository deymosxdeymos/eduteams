'use client';

import { Search, Plus } from 'lucide-react';
import { Button } from '../ui/button';

interface SearchInputProps {
  onCreateClass?: () => void;
}

export function SearchInput({ onCreateClass }: SearchInputProps) {
  return (
    <div className='flex justify-between items-center'>
      <Button
        variant='onboarding'
        size='lg'
        className='py-6 rounded-full gap-x-2'
        onClick={onCreateClass}
      >
        <Plus strokeWidth={4} className='w-5 h-5' />
        <p className='text-sm font-semibold'>Buat Kelas Baru</p>
      </Button>
      <div className='flex items-center gap-3 px-6 py-3 border rounded-4xl w-86'>
        <input
          type='text'
          placeholder='Mencari sesuatu?'
          className='flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400'
        />
        <Search className='w-5 h-5 text-gray-400' />
      </div>
    </div>
  );
}
