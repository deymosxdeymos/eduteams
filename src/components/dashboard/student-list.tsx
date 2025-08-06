'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import useSWR from 'swr';

interface Student {
  id: string;
  name: string;
  nim: string;
  email: string;
}

interface StudentListProps {
  classId: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export function StudentList({ classId }: StudentListProps) {
  const { data: studentsData, error } = useSWR(
    `/api/courses/${classId}/students`,
    fetcher
  );
  const [searchValue, setSearchValue] = useState('');

  const students: Student[] = studentsData?.data || [];

  const filteredStudents = students.filter(
    student =>
      student.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      student.nim.toLowerCase().includes(searchValue.toLowerCase())
  );

  if (error) {
    console.error('Failed to load students:', error);
  }

  return (
    <div className='bg-white rounded-3xl rounded-l-none h-full flex flex-col overflow-hidden'>
      <div className='p-6 pb-4'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-800'>
            Daftar Mahasiswa
          </h3>
          <span className='text-sm text-sky-900 font-medium'>
            {students.length} Mahasiswa
          </span>
        </div>

        <div className='relative'>
          <input
            type='text'
            placeholder='Mencari sesuatu?'
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            className='w-full px-4 py-3 pr-10 border border-gray-200 rounded-full outline-none focus:border-neutral-500 text-gray-700 placeholder-gray-400'
          />
          <Search className='absolute right-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400' />
        </div>
      </div>

      <div className='flex-1 px-6 pb-6 overflow-y-auto'>
        {students.length === 0 ? (
          <div className='flex flex-col h-full text-center'>
            <p className='text-gray-500 font-medium'>Belum Ada Mahasiswa</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full text-center'>
            <div className='text-gray-400 mb-2'>
              <Search className='w-8 h-8 mx-auto mb-3' />
            </div>
            <p className='text-gray-500 font-medium'>Tidak ditemukan</p>
            <p className='text-gray-400 text-sm'>Coba kata kunci lain</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {filteredStudents.map(student => (
              <div
                key={student.id}
                className='flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors'
              >
                <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                  <span className='text-blue-600 font-semibold text-sm'>
                    {student.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='font-medium text-gray-900 truncate'>
                    {student.name}
                  </p>
                  <p className='text-sm text-gray-500 truncate'>
                    {student.nim}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
