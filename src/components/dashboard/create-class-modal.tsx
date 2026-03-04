'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { DialogDescription } from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState, useTransition } from 'react';
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
  DialogContent,
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
import type {
  ApiResponse,
  ClassCatalog,
  Course,
  CourseCatalog,
} from '@/lib/types';
import { getCurrentAcademicYear } from '@/lib/utils/period';
import {
  type CourseCreateUserInput,
  courseCreateInputSchema,
} from '@/lib/validation/course';

const courseCatalogFetcher = async (url: string): Promise<CourseCatalog[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch course catalog');
  }
  const payload = (await response.json()) as ApiResponse<CourseCatalog[]>;
  return payload.data ?? [];
};

const classCatalogFetcher = async (url: string): Promise<ClassCatalog[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch class catalog');
  }
  const payload = (await response.json()) as ApiResponse<ClassCatalog[]>;
  return payload.data ?? [];
};

interface CreateClassModalProps {
  onClassCreated?: (course: Course) => void;
}

export default function CreateClassModal({
  onClassCreated,
}: CreateClassModalProps) {
  const t = useTranslations('dashboard.modals.createClass');
  const [open, setOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [coursePopoverOpen, setCoursePopoverOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCatalogCourse, setSelectedCatalogCourse] =
    useState<CourseCatalog | null>(null);
  const [isCreateCourseDialogOpen, setIsCreateCourseDialogOpen] =
    useState(false);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [createCatalogError, setCreateCatalogError] = useState<string | null>(
    null
  );
  const [isCreatingCatalogEntry, setIsCreatingCatalogEntry] = useState(false);
  const [classPopoverOpen, setClassPopoverOpen] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const [selectedCatalogClass, setSelectedCatalogClass] =
    useState<ClassCatalog | null>(null);

  const academicYear = getCurrentAcademicYear();

  const form = useForm<CourseCreateUserInput>({
    resolver: zodResolver(courseCreateInputSchema),
    defaultValues: {
      namaMataKuliah: '',
      kelas: '',
      periode: undefined,
    },
  });

  const shouldFetchCatalog = open;
  const {
    data: catalogData,
    error: catalogError,
    isLoading: isCatalogLoading,
    mutate: mutateCatalog,
  } = useSWR<CourseCatalog[]>(
    shouldFetchCatalog ? '/api/course-catalog' : null,
    courseCatalogFetcher
  );

  const {
    data: classCatalogData,
    error: classCatalogError,
    isLoading: isClassCatalogLoading,
    mutate: mutateClassCatalog,
  } = useSWR<ClassCatalog[]>(
    shouldFetchCatalog ? '/api/class-catalog' : null,
    classCatalogFetcher
  );

  const courseOptions = useMemo(() => catalogData ?? [], [catalogData]);
  const classOptions = useMemo(
    () => classCatalogData ?? [],
    [classCatalogData]
  );

  const filteredCourses = useMemo(() => {
    const query = courseSearch.trim().toLowerCase();
    if (!query) {
      return courseOptions;
    }

    return courseOptions.filter(course => {
      const codeMatch = course.code.toLowerCase().includes(query);
      const nameMatch = course.name.toLowerCase().includes(query);
      return codeMatch || nameMatch;
    });
  }, [courseOptions, courseSearch]);

  const filteredClasses = useMemo(() => {
    const query = classSearch.trim().toLowerCase();
    if (!query) {
      return classOptions;
    }

    return classOptions.filter(classItem => {
      return classItem.code.toLowerCase().includes(query);
    });
  }, [classOptions, classSearch]);

  const trimmedSearchQuery = courseSearch.trim();
  const trimmedClassSearchQuery = classSearch.trim();
  const showCreateShortcut =
    trimmedSearchQuery.length > 0 && filteredCourses.length === 0;
  const showCreateClassShortcut =
    trimmedClassSearchQuery.length > 0 && filteredClasses.length === 0;

  const handleCourseSelect = (course: CourseCatalog) => {
    setSelectedCatalogCourse(course);
    form.setValue('namaMataKuliah', course.name, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setCoursePopoverOpen(false);
    setCourseSearch('');
  };

  const handleResetCourseSelection = () => {
    setSelectedCatalogCourse(null);
    setCourseSearch('');
    setCoursePopoverOpen(false);
    form.setValue('namaMataKuliah', '', { shouldValidate: false });
    form.clearErrors('namaMataKuliah');
  };

  const handleCoursePopoverChange = (nextOpen: boolean) => {
    setCoursePopoverOpen(nextOpen);
    if (!nextOpen) {
      setCourseSearch('');
    }
  };

  const openCreateCourseDialog = (prefillName?: string) => {
    setNewCourseCode('');
    setNewCourseName(prefillName ?? '');
    setCreateCatalogError(null);
    setIsCreateCourseDialogOpen(true);
  };

  const openCreateDialogFromSearch = (prefill?: string) => {
    if (!showCreateShortcut && !prefill) return;
    const value = (prefill ?? trimmedSearchQuery).trim();
    if (!value) return;
    handleCoursePopoverChange(false);
    openCreateCourseDialog(value);
  };

  const handleCourseSearchChange = (value: string) => {
    setCourseSearch(value);
  };

  const handleCourseInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    handleSearchKeyDown(event);
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key !== 'Enter') {
      return;
    }
    if (!trimmedSearchQuery) {
      return;
    }
    if (!showCreateShortcut) {
      return;
    }
    event.preventDefault();
    openCreateDialogFromSearch(trimmedSearchQuery);
  };

  const handleCreateCourseDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setIsCreateCourseDialogOpen(false);
      setCreateCatalogError(null);
      setNewCourseCode('');
      setNewCourseName('');
      return;
    }
    setIsCreateCourseDialogOpen(true);
  };

  const handleClassSelect = (classItem: ClassCatalog) => {
    setSelectedCatalogClass(classItem);
    form.setValue('kelas', classItem.code, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setClassPopoverOpen(false);
    setClassSearch('');
  };

  const handleResetClassSelection = () => {
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
    if (!showCreateClassShortcut && !prefill) return;
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
          : t('classCatalog.dialog.genericError')
      );
    }
  };

  const handleClassSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key !== 'Enter') {
      return;
    }
    if (!trimmedClassSearchQuery) {
      return;
    }
    if (showCreateClassShortcut) {
      event.preventDefault();
      handleCreateClassFromSearch(trimmedClassSearchQuery);
    }
  };

  const handleCreateCatalogSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (isCreatingCatalogEntry) return;

    const code = newCourseCode.trim().toUpperCase();
    const name = newCourseName.trim();

    if (!code || !name) {
      setCreateCatalogError(t('catalog.dialog.required'));
      return;
    }

    setIsCreatingCatalogEntry(true);
    setCreateCatalogError(null);

    try {
      const response = await fetch('/api/course-catalog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, name }),
      });

      const payload = (await response.json()) as ApiResponse<CourseCatalog>;

      if (!response.ok) {
        throw new Error(payload.error || t('catalog.dialog.genericError'));
      }

      const createdCourse = payload.data;

      if (createdCourse) {
        await mutateCatalog(current => {
          const next = current ? [...current] : [];
          next.push(createdCourse);
          return next.toSorted((a, b) => a.code.localeCompare(b.code));
        }, false);

        setSelectedCatalogCourse(createdCourse);
        form.setValue('namaMataKuliah', createdCourse.name, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }

      setIsCreateCourseDialogOpen(false);
      setCoursePopoverOpen(false);
      setCourseSearch('');
      setNewCourseCode('');
      setNewCourseName('');
    } catch (err) {
      setCreateCatalogError(
        err instanceof Error ? err.message : t('catalog.dialog.genericError')
      );
    } finally {
      setIsCreatingCatalogEntry(false);
    }
  };

  const onSubmit = (values: CourseCreateUserInput) => {
    startTransition(async () => {
      try {
        setError(null);
        setSuccess(false);

        const response = await fetch('/api/courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create class');
        }

        const result = await response.json();
        setSuccess(true);

        if (onClassCreated) {
          onClassCreated(result.data);
        }

        setTimeout(() => {
          form.reset();
          handleResetCourseSelection();
          handleResetClassSelection();
          setOpen(false);
          setSuccess(false);
          setIsCreateCourseDialogOpen(false);
          setNewCourseCode('');
          setNewCourseName('');
          setCreateCatalogError(null);
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isPending) {
      setOpen(newOpen);
      if (!newOpen) {
        form.reset();
        setError(null);
        setSuccess(false);
        handleResetCourseSelection();
        handleResetClassSelection();
        setIsCreateCourseDialogOpen(false);
        setNewCourseCode('');
        setNewCourseName('');
        setCreateCatalogError(null);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant='onboarding' className='rounded-full w-48 py-7'>
            <Plus strokeWidth={3} className='text-white' />
            <p className='text-white font-semibold text-base leading-tight'>
              {t('button')}
            </p>
          </Button>
        </DialogTrigger>
        <DialogContent className='rounded-2xl sm:max-w-xl'>
          <DialogHeader>
            <DialogTitle className='text-xl font-medium'>
              {t('title')}
            </DialogTitle>
            <DialogDescription className='text-sm font-normal'>
              {t('description')}
            </DialogDescription>
          </DialogHeader>

          <motion.div
            layout={shouldReduceMotion ? undefined : true}
            transition={
              shouldReduceMotion
                ? undefined
                : { layout: { duration: 0.28, ease: [0.23, 1, 0.32, 1] } }
            }
            className='relative'
          >
            <AnimatePresence initial={false} mode='wait'>
              {success ? (
                <motion.div
                  key='success'
                  initial={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 12, scale: 0.96 }
                  }
                  animate={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : { opacity: 1, y: 0, scale: 1 }
                  }
                  exit={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -8, scale: 0.97 }
                  }
                  transition={{
                    duration: shouldReduceMotion ? 0.2 : 0.32,
                    ease: shouldReduceMotion ? 'easeOut' : [0.23, 1, 0.32, 1],
                  }}
                  className='flex min-h-76 flex-col items-center justify-center space-y-4 py-8 text-center'
                  role='status'
                  aria-live='polite'
                  layout={shouldReduceMotion ? undefined : true}
                >
                  <motion.div
                    aria-hidden='true'
                    className='flex h-12 w-12 items-center justify-center rounded-full bg-green-100 shadow-[0_12px_32px_-20px_rgba(34,197,94,0.65)]'
                    initial={
                      shouldReduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.8 }
                    }
                    animate={
                      shouldReduceMotion
                        ? { opacity: 1 }
                        : { opacity: 1, scale: 1 }
                    }
                    transition={{
                      duration: shouldReduceMotion ? 0.16 : 0.28,
                      ease: shouldReduceMotion ? 'easeOut' : [0.23, 1, 0.32, 1],
                      delay: shouldReduceMotion ? 0 : 0.05,
                    }}
                  >
                    <motion.svg
                      className='h-6 w-6 text-green-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      role='img'
                      aria-label='Success checkmark'
                      initial={
                        shouldReduceMotion
                          ? { opacity: 1 }
                          : { opacity: 0, rotate: -8 }
                      }
                      animate={{ opacity: 1, rotate: 0 }}
                      transition={{
                        duration: shouldReduceMotion ? 0 : 0.3,
                        ease: shouldReduceMotion
                          ? 'linear'
                          : [0.23, 1, 0.32, 1],
                      }}
                    >
                      <motion.path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M5 13l4 4L19 7'
                        initial={{ pathLength: shouldReduceMotion ? 1 : 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{
                          duration: shouldReduceMotion ? 0 : 0.4,
                          ease: shouldReduceMotion
                            ? 'linear'
                            : [0.23, 1, 0.32, 1],
                          delay: shouldReduceMotion ? 0 : 0.08,
                        }}
                      />
                    </motion.svg>
                  </motion.div>
                  <motion.p
                    className='font-medium text-green-600'
                    initial={
                      shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }
                    }
                    animate={
                      shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
                    }
                    transition={{
                      duration: shouldReduceMotion ? 0.2 : 0.28,
                      ease: shouldReduceMotion ? 'easeOut' : [0.23, 1, 0.32, 1],
                      delay: shouldReduceMotion ? 0 : 0.12,
                    }}
                  >
                    {t('success')}
                  </motion.p>
                </motion.div>
              ) : (
                <motion.div
                  key='form'
                  initial={
                    shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
                  }
                  animate={
                    shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
                  }
                  exit={
                    shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }
                  }
                  transition={{
                    duration: shouldReduceMotion ? 0.2 : 0.28,
                    ease: shouldReduceMotion ? 'easeOut' : [0.23, 1, 0.32, 1],
                  }}
                  className='min-h-76'
                  layout={shouldReduceMotion ? undefined : true}
                >
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className='space-y-4'
                    >
                      <FormField
                        control={form.control}
                        name='namaMataKuliah'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('fields.courseName')}</FormLabel>
                            <FormControl>
                              <div>
                                <input type='hidden' {...field} />
                                <Popover
                                  open={coursePopoverOpen}
                                  onOpenChange={handleCoursePopoverChange}
                                >
                                  <PopoverTrigger asChild>
                                    <button
                                      type='button'
                                      className='flex h-12 w-full min-w-0 items-center justify-between rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-left text-base shadow-sm transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-400/20 data-[invalid=true]:border-red-500 data-[invalid=true]:ring-2 data-[invalid=true]:ring-red-500/20'
                                      aria-haspopup='listbox'
                                      aria-expanded={coursePopoverOpen}
                                      data-invalid={
                                        !!form.formState.errors.namaMataKuliah
                                      }
                                      disabled={isPending}
                                    >
                                      {selectedCatalogCourse ? (
                                        <span className='text-sm'>
                                          <span className='font-semibold'>
                                            {selectedCatalogCourse.code}
                                          </span>
                                          {' - '}
                                          <span className='text-muted-foreground'>
                                            {selectedCatalogCourse.name}
                                          </span>
                                        </span>
                                      ) : (
                                        <span className='text-muted-foreground'>
                                          {t('fields.courseNamePlaceholder')}
                                        </span>
                                      )}
                                      <ChevronsUpDown className='ml-auto h-4 w-4 shrink-0 text-muted-foreground' />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    align='start'
                                    className='w-(--radix-popover-trigger-width) p-0'
                                    onWheel={e => e.stopPropagation()}
                                    onTouchMove={e => e.stopPropagation()}
                                  >
                                    <Command className='max-h-[300px]'>
                                      <CommandInput
                                        placeholder={t(
                                          'catalog.searchPlaceholder'
                                        )}
                                        value={courseSearch}
                                        onValueChange={handleCourseSearchChange}
                                        onKeyDown={handleCourseInputKeyDown}
                                      />
                                      <CommandList className='max-h-[calc(300px-3rem)] overflow-y-auto'>
                                        {isCatalogLoading &&
                                        courseOptions.length === 0 ? (
                                          <div className='flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground'>
                                            <LoadingSpinner size='sm' />
                                            <p>{t('catalog.loading')}</p>
                                          </div>
                                        ) : catalogError ? (
                                          <>
                                            <div className='flex flex-col items-center gap-3 py-4 text-center text-sm'>
                                              <p className='text-muted-foreground'>
                                                {t('catalog.error')}
                                              </p>
                                              <Button
                                                type='button'
                                                size='sm'
                                                variant='outline'
                                                onClick={() => mutateCatalog()}
                                              >
                                                {t('catalog.retry')}
                                              </Button>
                                            </div>
                                            {trimmedSearchQuery.length > 0 && (
                                              <>
                                                <div className='px-4 pb-2 text-center text-sm text-muted-foreground'>
                                                  {t('catalog.noResults', {
                                                    query: trimmedSearchQuery,
                                                  })}
                                                </div>
                                                <CommandItem
                                                  value={`create-${trimmedSearchQuery}`}
                                                  onSelect={() =>
                                                    openCreateDialogFromSearch(
                                                      trimmedSearchQuery
                                                    )
                                                  }
                                                  className='mx-auto mb-3 flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-blue-background py-2 text-sm font-medium text-white hover:bg-[#00006C]'
                                                >
                                                  <Plus className='h-4 w-4' />
                                                  {t(
                                                    'catalog.createNewOption',
                                                    {
                                                      value: trimmedSearchQuery,
                                                    }
                                                  )}
                                                </CommandItem>
                                              </>
                                            )}
                                          </>
                                        ) : filteredCourses.length > 0 ? (
                                          <CommandGroup className='p-1'>
                                            {filteredCourses.map(course => (
                                              <CommandItem
                                                key={course.id}
                                                value={`${course.code} ${course.name}`}
                                                onSelect={() =>
                                                  handleCourseSelect(course)
                                                }
                                                className='flex items-center justify-between'
                                              >
                                                <span className='text-sm'>
                                                  <span className='font-semibold'>
                                                    {course.code}
                                                  </span>
                                                  {' - '}
                                                  <span className='text-muted-foreground'>
                                                    {course.name}
                                                  </span>
                                                </span>
                                                <Check
                                                  className={`mr-2 h-4 w-4 ${
                                                    selectedCatalogCourse?.id ===
                                                    course.id
                                                      ? 'opacity-100'
                                                      : 'opacity-0'
                                                  }`}
                                                />
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        ) : trimmedSearchQuery.length > 0 ? (
                                          <>
                                            <div className='p-4 text-center text-sm text-muted-foreground'>
                                              {t('catalog.noResults', {
                                                query: trimmedSearchQuery,
                                              })}
                                            </div>
                                            <CommandItem
                                              value={`create-${trimmedSearchQuery}`}
                                              onSelect={() =>
                                                openCreateDialogFromSearch(
                                                  trimmedSearchQuery
                                                )
                                              }
                                              className='mx-auto mb-3 flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-blue-background py-2 text-sm font-medium text-white hover:bg-[#00006C]'
                                            >
                                              <Plus className='h-4 w-4' />
                                              {t('catalog.createNewOption', {
                                                value: trimmedSearchQuery,
                                              })}
                                            </CommandItem>
                                          </>
                                        ) : (
                                          <div className='py-4 text-center text-sm text-muted-foreground'>
                                            {t('catalog.startTyping')}
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
                        name='kelas'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('fields.class')}</FormLabel>
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
                                      ) : (
                                        <span className='text-muted-foreground'>
                                          {t('fields.classPlaceholder')}
                                        </span>
                                      )}
                                      <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    align='start'
                                    className='w-(--radix-popover-trigger-width) p-0'
                                    onWheel={e => e.stopPropagation()}
                                    onTouchMove={e => e.stopPropagation()}
                                  >
                                    <Command className='max-h-[300px]'>
                                      <CommandInput
                                        placeholder={t(
                                          'classCatalog.searchPlaceholder'
                                        )}
                                        value={classSearch}
                                        onValueChange={setClassSearch}
                                        onKeyDown={handleClassSearchKeyDown}
                                      />
                                      <CommandList className='max-h-[calc(300px-3rem)] overflow-y-auto'>
                                        {isClassCatalogLoading ? (
                                          <div className='flex items-center justify-center py-6'>
                                            <LoadingSpinner className='h-6 w-6' />
                                            <span className='ml-2 text-sm text-muted-foreground'>
                                              {t('classCatalog.loading')}
                                            </span>
                                          </div>
                                        ) : classCatalogError ? (
                                          <>
                                            <div className='p-4 text-center text-sm text-red-600'>
                                              {t('classCatalog.error')}
                                              <button
                                                type='button'
                                                onClick={() =>
                                                  mutateClassCatalog()
                                                }
                                                className='ml-2 text-blue-600 underline'
                                              >
                                                {t('classCatalog.retry')}
                                              </button>
                                            </div>
                                            {trimmedClassSearchQuery.length >
                                              0 && (
                                              <>
                                                <div className='px-4 pb-2 text-center text-sm text-muted-foreground'>
                                                  {t('classCatalog.noResults', {
                                                    query:
                                                      trimmedClassSearchQuery,
                                                  })}
                                                </div>
                                                <CommandItem
                                                  value={`create-${trimmedClassSearchQuery}`}
                                                  onSelect={() =>
                                                    handleCreateClassFromSearch(
                                                      trimmedClassSearchQuery
                                                    )
                                                  }
                                                  className='mx-auto mb-3 flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-blue-background py-2 text-sm font-medium text-white hover:bg-[#00006C]'
                                                >
                                                  <Plus className='h-4 w-4' />
                                                  {t(
                                                    'classCatalog.createNewOption',
                                                    {
                                                      value:
                                                        trimmedClassSearchQuery,
                                                    }
                                                  )}
                                                </CommandItem>
                                              </>
                                            )}
                                          </>
                                        ) : filteredClasses.length > 0 ? (
                                          <CommandGroup className='p-1'>
                                            {filteredClasses.map(classItem => (
                                              <CommandItem
                                                key={classItem.id}
                                                value={classItem.code}
                                                onSelect={() =>
                                                  handleClassSelect(classItem)
                                                }
                                                className='flex items-center justify-between'
                                              >
                                                <span className='text-sm font-semibold'>
                                                  {classItem.code}
                                                </span>
                                                <Check
                                                  className={`mr-2 h-4 w-4 ${
                                                    selectedCatalogClass?.id ===
                                                    classItem.id
                                                      ? 'opacity-100'
                                                      : 'opacity-0'
                                                  }`}
                                                />
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        ) : trimmedClassSearchQuery.length >
                                          0 ? (
                                          <>
                                            <div className='p-4 text-center text-sm text-muted-foreground'>
                                              {t('classCatalog.noResults', {
                                                query: trimmedClassSearchQuery,
                                              })}
                                            </div>
                                            <CommandItem
                                              value={`create-${trimmedClassSearchQuery}`}
                                              onSelect={() =>
                                                handleCreateClassFromSearch(
                                                  trimmedClassSearchQuery
                                                )
                                              }
                                              className='mx-auto mb-3 flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-blue-background py-2 text-sm font-medium text-white hover:bg-[#00006C]'
                                            >
                                              <Plus className='h-4 w-4' />
                                              {t(
                                                'classCatalog.createNewOption',
                                                {
                                                  value:
                                                    trimmedClassSearchQuery,
                                                }
                                              )}
                                            </CommandItem>
                                          </>
                                        ) : (
                                          <div className='py-4 text-center text-sm text-muted-foreground'>
                                            {t('classCatalog.startTyping')}
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
                            <FormLabel>{t('fields.period')}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={isPending}
                            >
                              <FormControl>
                                <SelectTrigger className='h-12! min-h-12! file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-base shadow-sm transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/20 aria-invalid:border-red-500 aria-invalid:ring-red-500/20'>
                                  <SelectValue
                                    placeholder={t('fields.periodPlaceholder')}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value='ganjil'>
                                  {academicYear.label} {t('options.odd')}
                                </SelectItem>
                                <SelectItem value='genap'>
                                  {academicYear.label} {t('options.even')}
                                </SelectItem>
                                <SelectItem value='pendek'>
                                  {academicYear.label} {t('options.short')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                            <p className='text-xs text-muted-foreground'>
                              {t('periodAutoDetected')}
                            </p>
                          </FormItem>
                        )}
                      />

                      {error && (
                        <div className='rounded-md border border-red-200 bg-red-50 p-3'>
                          <p className='text-sm text-red-600'>{error}</p>
                        </div>
                      )}

                      <div className='flex justify-end space-x-3 pt-4 text-md'>
                        <Button
                          variant='onboarding'
                          className='flex flex-1 rounded-full py-6 font-semibold text-sm!'
                          type='submit'
                          disabled={isPending}
                        >
                          {isPending ? (
                            <LoadingSpinner
                              size='sm'
                              color='white'
                              className='mr-1'
                            />
                          ) : (
                            <Plus strokeWidth={3} className='mr-1 h-4 w-4' />
                          )}
                          {isPending ? t('creating') : t('create')}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isCreateCourseDialogOpen}
        onOpenChange={handleCreateCourseDialogChange}
      >
        <DialogContent className='rounded-2xl sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-xl font-medium'>
              {t('catalog.dialog.title')}
            </DialogTitle>
            <DialogDescription className='text-sm'>
              {t('catalog.dialog.description')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCatalogSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <label
                htmlFor='course-code-input'
                className='text-sm font-medium text-neutral-900'
              >
                {t('catalog.dialog.codeLabel')}
              </label>
              <Input
                id='course-code-input'
                value={newCourseCode}
                onChange={event =>
                  setNewCourseCode(event.target.value.toUpperCase())
                }
                placeholder={t('catalog.dialog.codePlaceholder')}
                autoComplete='off'
                spellCheck={false}
                disabled={isCreatingCatalogEntry}
                className='h-11 rounded-xl'
              />
              <p className='text-xs text-muted-foreground'>
                {t('catalog.dialog.codeHint')}
              </p>
            </div>
            <div className='space-y-2'>
              <label
                htmlFor='course-name-input'
                className='text-sm font-medium text-neutral-900'
              >
                {t('catalog.dialog.nameLabel')}
              </label>
              <Input
                id='course-name-input'
                value={newCourseName}
                onChange={event => setNewCourseName(event.target.value)}
                placeholder={t('catalog.dialog.namePlaceholder')}
                autoComplete='off'
                disabled={isCreatingCatalogEntry}
                className='h-11 rounded-xl'
              />
            </div>
            {createCatalogError && (
              <p className='text-sm text-red-600'>{createCatalogError}</p>
            )}
            <div className='flex justify-end gap-3 pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleCreateCourseDialogChange(false)}
                disabled={isCreatingCatalogEntry}
              >
                {t('catalog.dialog.cancel')}
              </Button>
              <Button
                variant='onboarding'
                type='submit'
                disabled={isCreatingCatalogEntry}
              >
                {isCreatingCatalogEntry ? (
                  <LoadingSpinner size='sm' color='white' className='mr-2' />
                ) : (
                  <Plus strokeWidth={3} className='mr-1 h-4 w-4' />
                )}
                {isCreatingCatalogEntry
                  ? t('catalog.dialog.saving')
                  : t('catalog.dialog.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
