'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
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

interface StudentDashboardProps {
  classes: StudentClass[];
}

export function StudentDashboard({ classes }: StudentDashboardProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');

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
    router.refresh();
  };

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
              onClassLeft={handleClassJoined} // Reuse the same mutate function
            />
          ) : (
            <EmptyStudentClassState onClassJoined={handleClassJoined} />
          )}
        </div>
      </div>
    </div>
  );
}
