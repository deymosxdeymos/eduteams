'use client';

import { useState } from 'react';
import { SearchInput } from './search-input';
import { ClassGrid } from './class-grid';
import { useSearch } from '@/lib/hooks/use-search';
import type { Class } from '@/types/dashboard';

interface CoursesSearchWrapperProps {
  courses: Class[];
}

export function CoursesSearchWrapper({ courses }: CoursesSearchWrapperProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCourses = useSearch({
    data: courses,
    searchTerm,
    searchFields: ['title', 'classCode', 'academicYear'],
    debounceDelay: 300,
  });

  return (
    <>
      <div className='p-6 pb-0'>
        <SearchInput 
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>
      <div className='flex-1 px-6 min-h-0 overflow-hidden'>
        <ClassGrid 
          classes={filteredCourses} 
          showNoResults={searchTerm.trim() !== '' && filteredCourses.length === 0}
        />
      </div>
    </>
  );
}
