'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  SortDesc,
  Trash2,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { parseAsBoolean, parseAsStringLiteral, useQueryState } from 'nuqs';
import {
  memo,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { useForm } from 'react-hook-form';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { Link } from '@/i18n/routing';
import { classCatalogFetcher } from '@/lib/client-api';
import { EMPTY_ARRAY } from '@/lib/constants';
import type { ClassCatalog } from '@/lib/types';
import { formatAcademicPeriodLabel, getCurrentAcademicPeriod } from '@/lib/utils/period';
import { cn } from '@/lib/utils';
import {
  type CourseCreateUserInput,
  courseCreateInputSchema,
} from '@/lib/validation/course';
import type { ManageCourseRow } from '@/types/manage';

type SortKey = 'recent' | 'name-asc' | 'year-desc';


const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: 'recent', label: 'Terbaru' },
  { value: 'year-desc', label: 'Tahun akademik' },
  { value: 'name-asc', label: 'Nama A-Z' },
];

const semesterOrder: Record<ManageCourseRow['semester'], number> = {
  ganjil: 1,
  genap: 2,
  pendek: 3,
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
  switch (key) {
    case 'name-asc':
      return rows.toSorted((a, b) => a.name.localeCompare(b.name, 'id'));
    case 'year-desc':
      return rows.toSorted((a, b) => {
        if (a.endYear !== b.endYear) {
          return b.endYear - a.endYear;
        }
        if (a.semester !== b.semester) {
          return semesterOrder[b.semester] - semesterOrder[a.semester];
        }
        return a.name.localeCompare(b.name, 'id');
      });
    default:
      return rows.toSorted(
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
          <TableRow
            key={course.id}
            className='bg-white hover:bg-accent/50 transition-colors'
          >
            <TableCell className='font-medium'>
              <Link
                href={`/dashboard/manage/assignments/${course.id}`}
                className='inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2'
              >
                {course.name}
              </Link>
            </TableCell>
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

function mapCourseToFormValues(course: ManageCourseRow): CourseCreateUserInput {
  return {
    namaMataKuliah: course.name,
    kelas: course.classCode as CourseCreateUserInput['kelas'],
    periode: course.semester as CourseCreateUserInput['periode'],
  };
}

function formatPeriodLabel(
  startYear: number,
  endYear: number,
  semester: ManageCourseRow['semester']
) {
  return formatAcademicPeriodLabel(startYear, endYear, semester).replace(' ', '/');
}

function resolveArchivedState(
  course: ManageCourseRow,
  isManuallyArchived: boolean
) {
  if (isManuallyArchived) {
    return true;
  }

  const currentPeriod = getCurrentAcademicPeriod();
  if (course.endYear < currentPeriod.tahunAkhirPeriode) {
    return true;
  }
  if (course.endYear > currentPeriod.tahunAkhirPeriode) {
    return false;
  }
  if (course.semester === currentPeriod.periode) {
    return false;
  }
  return currentPeriod.periode === 'genap' && course.semester === 'ganjil';
}

function EditCourseDialog({
  course,
  onCourseUpdated,
}: {
  course: ManageCourseRow;
  onCourseUpdated?: (
    courseId: string,
    values: Pick<ManageCourseRow, 'name' | 'classCode' | 'semester'>
  ) => void;
}) {
  const tEdit = useTranslations('dashboard.modals.editClass');
  const tFields = useTranslations('dashboard.modals.createClass.fields');
  const tOptions = useTranslations('dashboard.modals.createClass.options');
  const tCreate = useTranslations('dashboard.modals.createClass');
  const tClassCatalog = useTranslations(
    'dashboard.modals.createClass.classCatalog'
  );
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [classPopoverOpen, setClassPopoverOpen] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const [selectedCatalogClass, setSelectedCatalogClass] =
    useState<ClassCatalog | null>(null);

  const {
    data: classCatalogData,
    error: classCatalogError,
    isLoading: isClassCatalogLoading,
    mutate: mutateClassCatalog,
  } = useSWR<ClassCatalog[]>(
    open ? '/api/class-catalog' : null,
    classCatalogFetcher
  );

  const classOptions = classCatalogData ?? (EMPTY_ARRAY as unknown as ClassCatalog[]);

  const form = useForm<CourseCreateUserInput>({
    resolver: zodResolver(courseCreateInputSchema),
    defaultValues: mapCourseToFormValues(course),
  });

  const resetForm = useCallback(() => {
    form.reset(mapCourseToFormValues(course));
    setClassSearch('');
    setClassPopoverOpen(false);
    if (classOptions.length > 0) {
      const currentClassCode = course.classCode;
      const matchingClass = classOptions.find(c => c.code === currentClassCode);
      setSelectedCatalogClass(matchingClass || null);
    } else {
      setSelectedCatalogClass(null);
    }
  }, [course, form, classOptions]);

  const filteredClasses = useMemo(() => {
    const query = classSearch.trim().toLowerCase();
    if (!query) {
      return classOptions;
    }

    return classOptions.filter(classItem => {
      return classItem.code.toLowerCase().includes(query);
    });
  }, [classOptions, classSearch]);

  const handleClassSelect = (classItem: ClassCatalog) => {
    setSelectedCatalogClass(classItem);
    form.setValue('kelas', classItem.code, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setClassPopoverOpen(false);
    setClassSearch('');
  };

  const _handleResetClassSelection = () => {
    setSelectedCatalogClass(null);
    setClassSearch('');
    setClassPopoverOpen(false);
    form.setValue('kelas', '', { shouldValidate: false });
    form.clearErrors('kelas');
  };

  const handleClassPopoverChange = (nextOpen: boolean) => {
    setClassPopoverOpen(nextOpen);
    if (!nextOpen) {
      setClassSearch('');
    }
  };

  const handleCreateClassFromSearch = async (prefill?: string) => {
    const trimmedClassSearchQuery = classSearch.trim();
    const value = (prefill ?? trimmedClassSearchQuery).trim().toUpperCase();
    if (!value) return;

    handleClassPopoverChange(false);

    try {
      const response = await fetch('/api/class-catalog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: value }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create class');
      }

      const result = await response.json();
      const newClass = result.data as ClassCatalog;

      await mutateClassCatalog();
      handleClassSelect(newClass);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tClassCatalog('dialog.genericError')
      );
    }
  };

  const handleClassSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key !== 'Enter') {
      return;
    }
    const typedValue = event.currentTarget.value.trim();
    if (!typedValue) {
      return;
    }
    const _trimmedClassSearchQuery = typedValue.trim();
    const hasMatches = classOptions.some(classItem => {
      return classItem.code.toLowerCase().includes(typedValue.toLowerCase());
    });
    if (!hasMatches && !classCatalogError) {
      event.preventDefault();
      handleCreateClassFromSearch(typedValue);
    }
  };

  useEffect(() => {
    if (!open || classOptions.length === 0) {
      return;
    }
    if (form.getFieldState('kelas').isDirty) {
      return;
    }

    const currentClassCode = form.getValues('kelas') || course.classCode;
    if (!currentClassCode) {
      setSelectedCatalogClass(null);
      return;
    }

    const matchingClass = classOptions.find(c => c.code === currentClassCode);
    setSelectedCatalogClass(matchingClass || null);
  }, [open, classOptions, course.classCode, form]);

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

        let result: {
          error?: string;
          data?: Partial<{
            namaMataKuliah: string;
            kelas: CourseCreateUserInput['kelas'];
            periode: CourseCreateUserInput['periode'];
          }>;
        } | null = null;
        try {
          result = await response.json();
        } catch (_error) {
          // Ignore JSON parsing errors (empty responses)
        }

        if (!response.ok) {
          const message =
            (result?.error as string | undefined) || tEdit('genericError');
          throw new Error(message);
        }

        const updated = result?.data as Partial<{
          namaMataKuliah: string;
          kelas: CourseCreateUserInput['kelas'];
          periode: CourseCreateUserInput['periode'];
        }>;

        if (updated) {
          const nextValues = {
            namaMataKuliah: updated.namaMataKuliah ?? values.namaMataKuliah,
            kelas: updated.kelas ?? values.kelas,
            periode: updated.periode ?? values.periode,
          };
          form.reset({
            namaMataKuliah: nextValues.namaMataKuliah,
            kelas: nextValues.kelas,
            periode: nextValues.periode,
          });
          onCourseUpdated?.(course.id, {
            name: nextValues.namaMataKuliah,
            classCode: nextValues.kelas,
            semester: nextValues.periode,
          });
        } else {
          form.reset(values);
          onCourseUpdated?.(course.id, {
            name: values.namaMataKuliah,
            classCode: values.kelas,
            semester: values.periode,
          });
        }

        setSuccess(true);

        setTimeout(() => {
          setSuccess(false);
          setOpen(false);
        }, 1200);
      } catch (err) {
        setError(err instanceof Error ? err.message : tEdit('genericError'));
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
                    <FormControl>
                      <div>
                        <input type='hidden' {...field} />
                        <Popover
                          open={classPopoverOpen}
                          onOpenChange={handleClassPopoverChange}
                        >
                          <PopoverTrigger asChild>
                            <button
                              type='button'
                              className='flex h-12 w-full min-w-0 items-center justify-between rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-left text-base shadow-sm transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-400/20 data-[invalid=true]:border-red-500 data-[invalid=true]:ring-2 data-[invalid=true]:ring-red-500/20'
                              aria-haspopup='listbox'
                              aria-expanded={classPopoverOpen}
                              data-invalid={!!form.formState.errors.kelas}
                              disabled={isPending}
                            >
                              {selectedCatalogClass ? (
                                <span className='text-sm font-semibold'>
                                  {selectedCatalogClass.code}
                                </span>
                              ) : field.value ? (
                                <span className='text-sm font-semibold'>
                                  {field.value}
                                </span>
                              ) : (
                                <span className='text-muted-foreground'>
                                  {tFields('classPlaceholder')}
                                </span>
                              )}
                              <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            align='start'
                            className='w-[var(--radix-popover-trigger-width)] p-0'
                            onWheel={e => e.stopPropagation()}
                            onTouchMove={e => e.stopPropagation()}
                          >
                            <Command className='max-h-[300px]'>
                              <CommandInput
                                placeholder={tClassCatalog('searchPlaceholder')}
                                value={classSearch}
                                onValueChange={setClassSearch}
                                onKeyDown={handleClassSearchKeyDown}
                              />
                              <CommandList className='max-h-[calc(300px-3rem)] overflow-y-auto'>
                                {isClassCatalogLoading ? (
                                  <div className='flex items-center justify-center py-6'>
                                    <LoadingSpinner className='h-6 w-6' />
                                    <span className='ml-2 text-sm text-muted-foreground'>
                                      {tClassCatalog('loading')}
                                    </span>
                                  </div>
                                ) : classCatalogError ? (
                                  <div className='p-4 text-center text-sm text-red-600'>
                                    {tClassCatalog('error')}
                                    <button
                                      type='button'
                                      onClick={() => mutateClassCatalog()}
                                      className='ml-2 text-blue-600 underline'
                                    >
                                      {tClassCatalog('retry')}
                                    </button>
                                  </div>
                                ) : filteredClasses.length > 0 ? (
                                  <CommandGroup className='p-1'>
                                    {filteredClasses.map(classItem => (
                                      <CommandItem
                                        key={classItem.id}
                                        value={classItem.code}
                                        onSelect={() =>
                                          handleClassSelect(classItem)
                                        }
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            selectedCatalogClass?.id ===
                                            classItem.id
                                              ? 'opacity-100'
                                              : 'opacity-0'
                                          }`}
                                        />
                                        <span className='text-sm font-semibold'>
                                          {classItem.code}
                                        </span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                ) : classSearch.trim().length > 0 ? (
                                  <>
                                    <div className='p-4 text-center text-sm text-muted-foreground'>
                                      {tClassCatalog('noResults', {
                                        query: classSearch.trim(),
                                      })}
                                    </div>
                                    <CommandItem
                                      value={`create-${classSearch.trim()}`}
                                      onSelect={() =>
                                        handleCreateClassFromSearch(
                                          classSearch.trim()
                                        )
                                      }
                                      className='mx-auto mb-3 flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-blue-background py-2 text-sm font-medium text-white hover:bg-[#00006C]'
                                    >
                                      <Plus className='h-4 w-4' />
                                      {tClassCatalog('createNewOption', {
                                        value: classSearch.trim(),
                                      })}
                                    </CommandItem>
                                  </>
                                ) : (
                                  <div className='py-4 text-center text-sm text-muted-foreground'>
                                    {tClassCatalog('startTyping')}
                                  </div>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </FormControl>
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
                          <SelectValue
                            placeholder={tFields('periodPlaceholder')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='ganjil'>
                          {academicYearLabel} {tOptions('odd')}
                        </SelectItem>
                        <SelectItem value='genap'>
                          {academicYearLabel} {tOptions('even')}
                        </SelectItem>
                        <SelectItem value='pendek'>
                          {academicYearLabel} {tOptions('short')}
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
                  <div className='relative mr-2 size-4'>
                    <Pencil
                      className={cn('h-4 w-4', isPending && 'opacity-0')}
                      strokeWidth={3}
                    />
                    {isPending && (
                      <LoadingSpinner
                        size='sm'
                        color='white'
                        className='absolute inset-0 size-4'
                      />
                    )}
                  </div>
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

function DeleteCourseDialog({
  course,
  onCourseDeleted,
}: {
  course: ManageCourseRow;
  onCourseDeleted?: (courseId: string) => void;
}) {
  const tDelete = useTranslations('dashboard.modals.deleteClass');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = (newOpen: boolean) => {
    if (isPending) {
      return;
    }

    setOpen(newOpen);
    if (!newOpen) {
      setError(null);
      setSuccess(false);
    }
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        setError(null);
        setSuccess(false);

        const response = await fetch(`/api/courses/${course.id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        let result: { error?: string; success?: boolean } | null = null;
        try {
          result = await response.json();
        } catch (_error) {
          // Ignore JSON parsing errors
        }

        if (!response.ok) {
          const message =
            (result?.error as string | undefined) || tDelete('genericError');
          throw new Error(message);
        }

        setSuccess(true);
        onCourseDeleted?.(course.id);

        setTimeout(() => {
          setSuccess(false);
          setOpen(false);
        }, 1200);
      } catch (err) {
        setError(err instanceof Error ? err.message : tDelete('genericError'));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          aria-label={tDelete('triggerLabel')}
          disabled={isPending}
          className='text-destructive hover:text-destructive'
        >
          <Trash2 className='size-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='rounded-2xl sm:max-w-[400px]'>
        <DialogHeader>
          <DialogTitle className='font-medium'>{tDelete('title')}</DialogTitle>
          <DialogDescription>{tDelete('description')}</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className='flex min-h-40 flex-col items-center justify-center space-y-4 py-8 text-center'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-green-100 shadow-[0_12px_32px_-20px_rgba(34,197,94,0.65)]'>
              <Check className='h-6 w-6 text-green-600' />
            </div>
            <p className='font-medium text-green-600'>{tDelete('success')}</p>
          </div>
        ) : (
          <>
            {error && (
              <div className='rounded-md border border-red-200 bg-red-50 p-3'>
                <p className='text-sm text-red-600'>{error}</p>
              </div>
            )}

            <DialogFooter className='flex-col-reverse sm:flex-col-reverse gap-2'>
              <DialogClose asChild>
                <Button variant='ghost' className='rounded-full'>
                  {tDelete('cancel')}
                </Button>
              </DialogClose>
              <Button
                variant='destructive'
                className='h-12 text-sm rounded-full'
                onClick={handleDelete}
                disabled={isPending}
                aria-busy={isPending}
              >
                {isPending && <LoadingSpinner size='sm' color='white' />}
                {isPending ? tDelete('deleting') : tDelete('delete')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const ManageCoursesView = memo(function ManageCoursesView({
  courses,
  searchPlaceholder,
  archivedLabel,
  emptyActiveMessage,
  emptyArchivedMessage,
  renderActions,
  onArchiveToggle,
}: ManageCoursesViewProps) {
  const [optimisticCourseUpdates, setOptimisticCourseUpdates] = useState<
    Record<string, Partial<ManageCourseRow>>
  >({});
  const [optimisticDeletedCourseIds, setOptimisticDeletedCourseIds] = useState<
    Set<string>
  >(new Set());
  const [searchTerm, setSearchTerm] = useQueryState('search', {
    defaultValue: '',
    shallow: true,
  });
  const [sortKey, setSortKey] = useQueryState('sort', {
    ...parseAsStringLiteral(['recent', 'name-asc', 'year-desc'] as const),
    defaultValue: 'recent' as SortKey,
    shallow: true,
  });
  const [showArchived, setShowArchived] = useQueryState('archived', {
    ...parseAsBoolean,
    defaultValue: false,
    shallow: true,
  });
  const [pendingCourseId, setPendingCourseId] = useState<string | null>(null);

  const courseRows = useMemo(
    () =>
      courses
        .filter(course => !optimisticDeletedCourseIds.has(course.id))
        .map(course => {
          const optimisticUpdate = optimisticCourseUpdates[course.id];
          if (!optimisticUpdate) {
            return course;
          }

          return {
            ...course,
            ...optimisticUpdate,
          };
        }),
    [courses, optimisticDeletedCourseIds, optimisticCourseUpdates]
  );

  const handleCourseUpdated = useCallback(
    (
      courseId: string,
      values: Pick<ManageCourseRow, 'name' | 'classCode' | 'semester'>
    ) => {
      const course = courseRows.find(row => row.id === courseId);
      if (!course) {
        return;
      }

      const nextCourse = {
        ...course,
        name: values.name,
        classCode: values.classCode,
        semester: values.semester,
        periodLabel: formatPeriodLabel(
          course.startYear,
          course.endYear,
          values.semester
        ),
        updatedAt: new Date().toISOString(),
      };

      setOptimisticCourseUpdates(current => ({
        ...current,
        [courseId]: {
          ...(current[courseId] ?? {}),
          name: nextCourse.name,
          classCode: nextCourse.classCode,
          semester: nextCourse.semester,
          periodLabel: nextCourse.periodLabel,
          updatedAt: nextCourse.updatedAt,
          isArchived: resolveArchivedState(
            nextCourse,
            nextCourse.isManuallyArchived
          ),
        },
      }));
    },
    [courseRows]
  );

  const handleCourseDeleted = useCallback((courseId: string) => {
    setOptimisticDeletedCourseIds(current => new Set(current).add(courseId));
    setOptimisticCourseUpdates(current => {
      if (!current[courseId]) {
        return current;
      }

      const next = { ...current };
      delete next[courseId];
      return next;
    });
  }, []);

  const handleArchiveToggle = useCallback(
    (course: ManageCourseRow) => {
      if (!onArchiveToggle) {
        return;
      }

      const nextIsManuallyArchived = !course.isManuallyArchived;
      const previousOverlay = optimisticCourseUpdates[course.id];
      const nextCourse = {
        ...course,
        isManuallyArchived: nextIsManuallyArchived,
        updatedAt: new Date().toISOString(),
      };
      setPendingCourseId(course.id);
      setOptimisticCourseUpdates(current => ({
        ...current,
        [course.id]: {
          ...(current[course.id] ?? {}),
          isManuallyArchived: nextIsManuallyArchived,
          isArchived: resolveArchivedState(nextCourse, nextIsManuallyArchived),
          updatedAt: nextCourse.updatedAt,
        },
      }));
      void (async () => {
        try {
          await onArchiveToggle(course);
        } catch (error) {
          console.error('Failed to toggle archive status', error);
          setOptimisticCourseUpdates(current => {
            const next = { ...current };

            if (previousOverlay) {
              next[course.id] = previousOverlay;
            } else {
              delete next[course.id];
            }

            return next;
          });
        } finally {
          setPendingCourseId(current =>
            current === course.id ? null : current
          );
        }
      })();
    },
    [onArchiveToggle, optimisticCourseUpdates]
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
          <Button asChild variant='ghost' size='icon' aria-label='Lihat kelas'>
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
                  {isPending && <LoadingSpinner size='sm' color='white' />}
                  {course.isManuallyArchived ? 'Munculkan' : 'Sembunyikan'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <EditCourseDialog
            course={course}
            onCourseUpdated={handleCourseUpdated}
          />
          <DeleteCourseDialog
            course={course}
            onCourseDeleted={handleCourseDeleted}
          />
        </div>
      );
    },
    [handleArchiveToggle, handleCourseDeleted, handleCourseUpdated, pendingCourseId]
  );

  const renderRowActions = renderActions ?? defaultActions;

  const filteredCourses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const matching = term
      ? courseRows.filter(course => {
          const tokens = `${course.name} ${course.classCode}`.toLowerCase();
          return tokens.includes(term);
        })
      : courseRows;
    return sortCourses(matching, sortKey);
  }, [courseRows, searchTerm, sortKey]);

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
});
