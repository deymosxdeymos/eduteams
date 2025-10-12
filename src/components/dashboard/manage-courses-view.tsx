'use client';

import {
  ChevronDown,
  ChevronRight,
  EyeOff,
  Pencil,
  Search,
  Share2,
  SortDesc,
  Trash2,
} from 'lucide-react';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { ManageCourseRow } from '@/types/manage';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Separator } from '../ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

type SortKey = 'recent' | 'name-asc' | 'year-desc';

const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: 'recent', label: 'Terbaru' },
  { value: 'year-desc', label: 'Tahun akademik' },
  { value: 'name-asc', label: 'Nama A-Z' },
];

const semesterOrder: Record<ManageCourseRow['semester'], number> = {
  genap: 2,
  ganjil: 1,
};

interface ManageCoursesViewProps {
  courses: ManageCourseRow[];
  searchPlaceholder: string;
  archivedLabel: string;
  emptyActiveMessage: string;
  emptyArchivedMessage: string;
  renderActions?: (course: ManageCourseRow) => ReactNode;
}

function sortCourses(rows: ManageCourseRow[], key: SortKey) {
  const list = [...rows];
  switch (key) {
    case 'name-asc':
      return list.sort((a, b) => a.name.localeCompare(b.name, 'id'));
    case 'year-desc':
      return list.sort((a, b) => {
        if (a.endYear !== b.endYear) {
          return b.endYear - a.endYear;
        }
        if (a.semester !== b.semester) {
          return semesterOrder[b.semester] - semesterOrder[a.semester];
        }
        return a.name.localeCompare(b.name, 'id');
      });
    default:
      return list.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }
}

function ManageTable({
  rows,
  emptyMessage,
  renderActions,
}: {
  rows: ManageCourseRow[];
  emptyMessage: string;
  renderActions: (course: ManageCourseRow) => ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className='flex h-40 items-center justify-center rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/30'>
        <p className='text-muted-foreground text-sm'>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <Table className='min-w-[720px]'>
      <TableHeader className='[&_tr]:border-b-0'>
        <TableRow className='bg-muted overflow-hidden rounded-md'>
          <TableHead className='rounded-md'>Nama Kelas</TableHead>
          <TableHead>Periode</TableHead>
          <TableHead>Total Tugas</TableHead>
          <TableHead>Total Mahasiswa</TableHead>
          <TableHead className='text-right rounded-md'>
            Manage Control
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(course => (
          <TableRow key={course.id} className='bg-white'>
            <TableCell className='font-medium'>{course.name}</TableCell>
            <TableCell className='text-muted-foreground'>
              {course.periodLabel}
            </TableCell>
            <TableCell>{`${course.assignmentsCount} Tugas`}</TableCell>
            <TableCell>{`${course.studentsCount} Mahasiswa`}</TableCell>
            <TableCell className='text-right'>
              {renderActions(course)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ManageCoursesView({
  courses,
  searchPlaceholder,
  archivedLabel,
  emptyActiveMessage,
  emptyArchivedMessage,
  renderActions,
}: ManageCoursesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [showArchived, setShowArchived] = useState(false);

  const defaultActions = useCallback(
    (_course: ManageCourseRow) => (
      <div className='flex items-center justify-end gap-2'>
        <Button variant='ghost' size='icon' aria-label='Bagikan kelas'>
          <Share2 className='size-4' />
        </Button>
        <Button variant='ghost' size='icon' aria-label='Sembunyikan kelas'>
          <EyeOff className='size-4' />
        </Button>
        <Button variant='ghost' size='icon' aria-label='Edit kelas'>
          <Pencil className='size-4' />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          aria-label='Hapus kelas'
          className='text-destructive hover:text-destructive'
        >
          <Trash2 className='size-4' />
        </Button>
      </div>
    ),
    []
  );

  const renderRowActions = renderActions ?? defaultActions;

  const filteredCourses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const matching = term
      ? courses.filter(course => {
          const tokens = `${course.name} ${course.classCode}`.toLowerCase();
          return tokens.includes(term);
        })
      : courses;
    return sortCourses(matching, sortKey);
  }, [courses, searchTerm, sortKey]);

  const activeCourses = filteredCourses.filter(course => !course.isArchived);
  const archivedCourses = filteredCourses.filter(course => course.isArchived);

  return (
    <section className='flex h-full flex-col gap-6 rounded-3xl bg-white p-6'>
      <div className='flex flex-wrap items-center gap-4'>
        <Select
          value={sortKey}
          onValueChange={value => setSortKey(value as SortKey)}
        >
          <SelectTrigger className='min-w-[180px] rounded-full bg-accent/30 gap-2'>
            <SortDesc className='size-4 text-muted-foreground' />
            <SelectValue placeholder='Urutkan' />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className='relative flex-1'>
          <Input
            type='search'
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder={searchPlaceholder}
            className='h-11 rounded-full pl-4 pr-11'
          />
          <Search className='absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
        </div>
      </div>

      <div className='min-h-0 flex-1 overflow-auto'>
        <ManageTable
          rows={activeCourses}
          emptyMessage={emptyActiveMessage}
          renderActions={renderRowActions}
        />
      </div>

      <Separator className='my-6 data-[orientation=horizontal]:h-1 rounded-full bg-neutral-200' />

      <div>
        <button
          type='button'
          onClick={() => setShowArchived(value => !value)}
          className={cn(
            'flex w-full max-w-fit cursor-pointer items-center gap-2 px-0 py-0 text-left text-sm font-semibold transition-colors',
            showArchived
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-expanded={showArchived}
        >
          <span>{archivedLabel}</span>
          {showArchived ? (
            <ChevronDown className='size-4 text-current' />
          ) : (
            <ChevronRight className='size-4 text-current' />
          )}
        </button>
        {showArchived && (
          <div className='mt-4'>
            <ManageTable
              rows={archivedCourses}
              emptyMessage={emptyArchivedMessage}
              renderActions={renderRowActions}
            />
          </div>
        )}
      </div>
    </section>
  );
}
