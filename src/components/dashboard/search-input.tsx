'use client';

import { Search } from 'lucide-react';
import CreateClassModal from './create-class-modal';
import type { Course } from '@/lib/types';

interface SearchInputProps {
  onClassCreated?: (course: Course) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ 
  onClassCreated, 
  searchValue = '', 
  onSearchChange = () => {},
  placeholder = 'Cari mata kuliah, kelas, atau periode...'
}: SearchInputProps) {
  return (
    <div className='flex justify-between items-center'>
      <CreateClassModal onClassCreated={onClassCreated} />
      <div className='flex items-center gap-3 px-6 py-3 border rounded-4xl w-86'>
        <input
          type='text'
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className='flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400'
        />
        <Search className='w-5 h-5 text-gray-400' />
      </div>
    </div>
  );
}
