import { Suspense } from 'react';
import { getCoursesByLecturer, transformCourseToClassCard } from '@/lib/data/courses';
import { CoursesSearchWrapper } from './courses-search-wrapper';
import { EmptyClassState } from './empty-class-state';
import { SearchInput } from './search-input';

interface CoursesProviderProps {
  dosenId: string;
  onClassCreated?: () => void;
}

async function CoursesData({ dosenId, onClassCreated }: CoursesProviderProps) {
  const courses = await getCoursesByLecturer(dosenId);
  const classCards = courses.map(transformCourseToClassCard);

  if (classCards.length === 0) {
    return (
      <>
        <div className='p-6 pb-0'>
          <SearchInput 
            searchValue=''
            onSearchChange={() => {}}
          />
        </div>
        <div className='flex-1 px-6 min-h-0 overflow-hidden'>
          <EmptyClassState onClassCreated={onClassCreated} />
        </div>
      </>
    );
  }

  return <CoursesSearchWrapper courses={classCards} />;
}

function CoursesLoading() {
  return (
    <>
      <div className='p-6 pb-0'>
        <div className="h-12 bg-gray-100 animate-pulse rounded-xl" />
      </div>
      <div className='flex-1 px-6 min-h-0 overflow-hidden'>
        <div className="h-full flex flex-col pt-4 pb-6">
          <div className="grid grid-cols-4 gap-6 overflow-y-auto flex-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-48 bg-gray-100 animate-pulse rounded-3xl"
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function CoursesProvider({ dosenId, onClassCreated }: CoursesProviderProps) {
  return (
    <Suspense fallback={<CoursesLoading />}>
      <CoursesData dosenId={dosenId} onClassCreated={onClassCreated} />
    </Suspense>
  );
}
