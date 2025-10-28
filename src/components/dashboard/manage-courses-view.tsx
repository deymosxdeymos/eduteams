'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChevronDown,
  ChevronRight,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Search,
  SortDesc,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  type ReactNode,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  courseCreateInputSchema,
  type CourseCreateUserInput,
} from '@/lib/validation/course';
import { useForm } from 'react-hook-form';
import type { ManageCourseRow } from '@/types/manage';

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
  onArchiveToggle?: (course: ManageCourseRow) => Promise<void> | void;
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

function mapCourseToFormValues(
  course: ManageCourseRow
): CourseCreateUserInput {
  return {
    namaMataKuliah: course.name,
    kelas: course.classCode as CourseCreateUserInput['kelas'],
    periode: course.semester as CourseCreateUserInput['periode'],
  };
}

function EditCourseDialog({ course }: { course: ManageCourseRow }) {
  const router = useRouter();
  const tEdit = useTranslations('dashboard.modals.editClass');
  const tFields = useTranslations('dashboard.modals.createClass.fields');
  const tOptions = useTranslations('dashboard.modals.createClass.options');
  const tCreate = useTranslations('dashboard.modals.createClass');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CourseCreateUserInput>({
    resolver: zodResolver(courseCreateInputSchema),
    defaultValues: mapCourseToFormValues(course),
  });

  const resetForm = useCallback(() => {
    form.reset(mapCourseToFormValues(course));
  }, [course, form]);

  const handleOpenChange = (newOpen: boolean) => {
    if (isPending) {
      return;
    }

    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
      setError(null);
      setSuccess(false);
    }
  };

  const onSubmit = (values: CourseCreateUserInput) => {
    startTransition(async () => {
      try {
        setError(null);
        setSuccess(false);

        const response = await fetch(`/api/courses/${course.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        let result: any = null;
        try {
          result = await response.json();
        } catch (_error) {
          // Ignore JSON parsing errors (empty responses)
        }

        if (!response.ok) {
          const message =
            (result?.error as string | undefined) ||
            tEdit('genericError');
          throw new Error(message);
        }

        const updated = result?.data as Partial<{
          namaMataKuliah: string;
          kelas: CourseCreateUserInput['kelas'];
          periode: CourseCreateUserInput['periode'];
        }>;

        if (updated) {
          form.reset({
            namaMataKuliah:
              updated.namaMataKuliah ?? values.namaMataKuliah,
            kelas: updated.kelas ?? values.kelas,
            periode: updated.periode ?? values.periode,
          });
        } else {
          form.reset(values);
        }

        setSuccess(true);
        router.refresh();

        setTimeout(() => {
          setSuccess(false);
          setOpen(false);
        }, 1200);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : tEdit('genericError')
        );
      }
    });
  };

  const academicYearLabel = `${course.startYear}/${course.endYear}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          aria-label={tEdit('triggerLabel')}
          disabled={isPending}
        >
          <Pencil className='size-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='rounded-2xl sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle className='text-xl font-medium'>
            {tEdit('title')}
          </DialogTitle>
          <DialogDescription className='text-sm font-normal'>
            {tEdit('description')}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className='flex min-h-[19rem] flex-col items-center justify-center space-y-4 py-8 text-center'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-green-100 shadow-[0_12px_32px_-20px_rgba(34,197,94,0.65)]'>
              <Check className='h-6 w-6 text-green-600' />
            </div>
            <p className='font-medium text-green-600'>{tEdit('success')}</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='namaMataKuliah'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tFields('courseName')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={tFields('courseNamePlaceholder')}
                        {...field}
                        disabled={isPending}
                        className='file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-12 w-full min-w-0 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-base shadow-sm transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/20 aria-invalid:border-red-500 aria-invalid:ring-red-500/20'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='kelas'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tFields('class')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger className='!h-12 !min-h-[3rem] file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-base shadow-sm transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/20 aria-invalid:border-red-500 aria-invalid:ring-red-500/20'>
                          <SelectValue placeholder={tFields('classPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='RA'>RA</SelectItem>
                        <SelectItem value='RB'>RB</SelectItem>
                        <SelectItem value='RC'>RC</SelectItem>
                        <SelectItem value='RD'>RD</SelectItem>
                        <SelectItem value='RE'>RE</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='periode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tFields('period')}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger className='!h-12 !min-h-[3rem] file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-base shadow-sm transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/20 aria-invalid:border-red-500 aria-invalid:ring-red-500/20'>
                          <SelectValue placeholder={tFields('periodPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='ganjil'>
                          {academicYearLabel} {tOptions('odd')}
                        </SelectItem>
                        <SelectItem value='genap'>
                          {academicYearLabel} {tOptions('even')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    <p className='text-xs text-muted-foreground'>
                      {tCreate('periodAutoDetected')}
                    </p>
                  </FormItem>
                )}
              />

              {error && (
                <div className='rounded-md border border-red-200 bg-red-50 p-3'>
                  <p className='text-sm text-red-600'>{error}</p>
                </div>
              )}

              <div className='pt-4 text-md'>
                <Button
                  variant='onboarding'
                  className='w-full h-12 rounded-full py-3 text-sm font-semibold'
                  type='submit'
                  disabled={isPending}
                >
                  {isPending ? (
                    <LoadingSpinner
                      size='sm'
                      color='white'
                      className='mr-2'
                    />
                  ) : (
                    <Pencil className='mr-2 h-4 w-4' strokeWidth={3} />
                  )}
                  {isPending ? tEdit('saving') : tEdit('button')}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ManageCoursesView({
  courses,
  searchPlaceholder,
  archivedLabel,
  emptyActiveMessage,
  emptyArchivedMessage,
  renderActions,
  onArchiveToggle,
}: ManageCoursesViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [showArchived, setShowArchived] = useState(false);
  const [pendingCourseId, setPendingCourseId] = useState<string | null>(null);
  const handleArchiveToggle = useCallback(
    (course: ManageCourseRow) => {
      if (!onArchiveToggle) {
        return;
      }

      setPendingCourseId(course.id);
      void (async () => {
        try {
          await onArchiveToggle(course);
          router.refresh();
        } catch (error) {
          console.error('Failed to toggle archive status', error);
        } finally {
          setPendingCourseId(current =>
            current === course.id ? null : current
          );
        }
      })();
    },
    [onArchiveToggle, router]
  );

  const defaultActions = useCallback(
    (course: ManageCourseRow) => {
      const archiveLabel = course.isManuallyArchived
        ? 'Tampilkan kelas'
        : 'Sembunyikan kelas';
      const ArchiveIcon = course.isManuallyArchived ? Eye : EyeOff;
      const isPending = pendingCourseId === course.id;

      return (
        <div className='flex items-center justify-end gap-2'>
          <Button
            asChild
            variant='ghost'
            size='icon'
            aria-label='Bagikan kelas'
          >
            <Link href={`/dashboard/class/${course.id}`}>
              <ExternalLink className='size-4' />
            </Link>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                aria-label={archiveLabel}
                disabled={isPending}
                aria-busy={isPending}
              >
                <ArchiveIcon className='size-4' />
              </Button>
            </DialogTrigger>
            <DialogContent className='rounded-2xl sm:max-w-[425px]'>
              <DialogHeader>
                <DialogTitle className='font-medium'>
                  {course.isManuallyArchived
                    ? 'Munculkan Tugas?'
                    : 'Sembunyikan Kelas?'}
                </DialogTitle>
                <DialogDescription>
                  {course.isManuallyArchived
                    ? 'Tampilkan tugas untuk kelas ini agar mahasiswa dapat melihatnya'
                    : 'Kelas yang disembunyikan tidak akan bisa diakses oleh mahasiswa'}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className='flex-col-reverse sm:flex-col-reverse'>
                <DialogClose asChild>
                  <Button variant='ghost' className='rounded-full'>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  variant='onboarding'
                  className='h-12 text-sm rounded-full'
                  aria-label={archiveLabel}
                  disabled={isPending}
                  aria-busy={isPending}
                  onClick={() => handleArchiveToggle(course)}
                >
                  {course.isManuallyArchived ? 'Munculkan' : 'Sembunyikan'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <EditCourseDialog course={course} />
          <Button
            variant='ghost'
            size='icon'
            aria-label='Hapus kelas'
            className='text-destructive hover:text-destructive'
          >
            <Trash2 className='size-4' />
          </Button>
        </div>
      );
    },
    [handleArchiveToggle, pendingCourseId]
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
