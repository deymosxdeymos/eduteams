import { ClassCard } from './class-card';

interface Class {
  id: string;
  title: string;
  academicYear: string;
  studentCount: number;
  classCode: string;
}

interface ClassGridProps {
  classes: Class[];
}

export function ClassGrid({ classes = [] }: ClassGridProps) {
  const mockClasses: Class[] = [
    {
      id: '1',
      title: 'Pemrograman Web',
      academicYear: 'T.A 2025/2026',
      studentCount: 32,
      classCode: 'RA',
    },
  ];

  const displayClasses = classes.length > 0 ? classes : mockClasses;
  const totalSlots = 12;
  const emptySlots = Math.max(0, totalSlots - displayClasses.length);

  return (
    <div className='h-full flex flex-col pt-4 pb-6'>
      <div
        className='grid grid-cols-4 gap-6 overflow-y-auto flex-1'
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
        }}
      >
        {displayClasses.map(classItem => (
          <ClassCard
            key={classItem.id}
            title={classItem.title}
            academicYear={classItem.academicYear}
            studentCount={classItem.studentCount}
            classCode={classItem.classCode}
          />
        ))}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <ClassCard key={`empty-${index}`} isEmpty />
        ))}
      </div>
    </div>
  );
}
