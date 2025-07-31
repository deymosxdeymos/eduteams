'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { EmptyStudentClassState } from './empty-student-class-state';
import { SearchInput } from './search-input';
import { StudentClassGrid } from './student-class-grid';

interface StudentClass {
  id: string;
  namaMataKuliah: string;
  kelas: string;
  tahunAwalPeriode: number;
  tahunAkhirPeriode: number;
  studentCount: number;
  dosen?: {
    name: string;
  };
}

const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) {
      throw new Error('Failed to fetch');
    }
    return res.json();
  });

export function StudentDashboard() {
  const { data, error, mutate } = useSWR('/api/student/classes', fetcher);
  const [searchValue, setSearchValue] = useState('');

  const classes: StudentClass[] = data?.data || [];

  const filteredClasses = searchValue
    ? classes.filter(
        classItem =>
          classItem.namaMataKuliah
            .toLowerCase()
            .includes(searchValue.toLowerCase()) ||
          classItem.kelas.toLowerCase().includes(searchValue.toLowerCase())
      )
    : classes;

  const handleClassJoined = () => {
    mutate();
  };

  if (error) {
    console.error('Failed to load student classes:', error);
  }

  const hasClasses = classes.length > 0;
  const showNoResults = searchValue.length > 0 && filteredClasses.length === 0;

  return (
    <div className='h-full flex flex-col gap-4'>
      <div className='bg-white rounded-3xl flex flex-col flex-1 min-h-0 overflow-hidden'>
        {hasClasses && (
          <div className='p-6 pb-0'>
            <SearchInput
              onClassCreated={handleClassJoined}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              isStudent={true}
            />
          </div>
        )}
        <div className='flex-1 px-6 min-h-0 overflow-hidden'>
          {hasClasses ? (
            <StudentClassGrid
              classes={filteredClasses}
              showNoResults={showNoResults}
            />
          ) : (
            <EmptyStudentClassState onClassJoined={handleClassJoined} />
          )}
        </div>
      </div>
    </div>
  );
}
