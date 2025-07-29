'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { StatisticsCards } from './statistics-cards';
import { SearchInput } from './search-input';
import { EmptyClassState } from './empty-class-state';
import { ClassGrid } from './class-grid';
import type { Course } from '@/lib/types';
import type { Class } from '@/types/dashboard';

interface ContentProps {
  dosenId?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function Content({}: ContentProps) {
  const { data, error, mutate } = useSWR('/api/courses', fetcher);
  const [searchValue, setSearchValue] = useState('');

  const courses: Course[] = data?.data || [];
  
  // Convert Course data to Class format expected by ClassGrid
  const classes: Class[] = courses.map(course => ({
    id: course.id,
    title: course.namaMataKuliah,
    academicYear: `T.A ${course.tahunAwalPeriode}/${course.tahunAkhirPeriode}`,
    studentCount: 0, // TODO: Add student count from course enrollment
    classCode: course.kelas,
  }));

  // Filter classes based on search
  const filteredClasses = searchValue
    ? classes.filter(classItem =>
        classItem.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        classItem.classCode.toLowerCase().includes(searchValue.toLowerCase())
      )
    : classes;

  const handleClassCreated = () => {
    // Refresh data after new class is created
    mutate();
  };

  if (error) {
    console.error('Failed to load courses:', error);
  }

  const hasClasses = classes.length > 0;
  const showNoResults = searchValue.length > 0 && filteredClasses.length === 0;

  return (
    <div className='h-full flex flex-col gap-4'>
      <StatisticsCards />
      <div className='bg-white rounded-3xl flex flex-col flex-1 min-h-0 overflow-hidden'>
        <div className='p-6 pb-0'>
          <SearchInput
            onClassCreated={handleClassCreated}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
          />
        </div>
        <div className='flex-1 px-6 min-h-0 overflow-hidden'>
          {hasClasses ? (
            <ClassGrid classes={filteredClasses} showNoResults={showNoResults} />
          ) : (
            <EmptyClassState onClassCreated={handleClassCreated} />
          )}
        </div>
      </div>
    </div>
  );
}
