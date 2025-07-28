'use client';

import { useState } from 'react';
import { StatisticsCards } from './statistics-cards';
import { SearchInput } from './search-input';
import { EmptyClassState } from './empty-class-state';
import { ClassGrid } from './class-grid';

interface Class {
  id: string;
  title: string;
  academicYear: string;
  studentCount: number;
  classCode: string;
}

interface ContentProps {
  hasClasses?: boolean;
  dosenId?: string;
}

export default function Content({ hasClasses = true }: ContentProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const handleAddClass = (newClass: Omit<Class, 'id'>) => {
    const classWithId = {
      ...newClass,
      id: Date.now().toString(),
    };
    setClasses(prev => [...prev, classWithId]);
  };

  const createMockClasses = () => {
    const mockClasses = {
      title: 'Rust Programming',
      academicYear: 'T.A 2025/2026',
      studentCount: 26,
      classCode: 'RB',
    };
    handleAddClass(mockClasses);
  };

  return (
    <div className='h-full flex flex-col gap-4'>
      <StatisticsCards />
      <div className='bg-white rounded-3xl flex flex-col flex-1 min-h-0 overflow-hidden'>
        <div className='p-6 pb-0'>
          <SearchInput onClassCreated={createMockClasses} />
        </div>
        <div className='flex-1 px-6 min-h-0 overflow-hidden'>
          {hasClasses ? <ClassGrid classes={classes} /> : <EmptyClassState />}
        </div>
      </div>
    </div>
  );
}
