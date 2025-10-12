'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { DialogDescription } from '@radix-ui/react-dialog';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Course } from '@/lib/types';
import { getCurrentAcademicYear } from '@/lib/utils/period';
import {
  type CourseCreateUserInput,
  courseCreateInputSchema,
} from '@/lib/validation/course';

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

  const academicYear = getCurrentAcademicYear();

  const form = useForm<CourseCreateUserInput>({
    resolver: zodResolver(courseCreateInputSchema),
    defaultValues: {
      namaMataKuliah: '',
      kelas: undefined,
      periode: undefined,
    },
  });

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
          setOpen(false);
          setSuccess(false);
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
      }
    }
  };

  return (
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
                className='flex min-h-[19rem] flex-col items-center justify-center space-y-4 py-8 text-center'
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
                      ease: shouldReduceMotion ? 'linear' : [0.23, 1, 0.32, 1],
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
                className='min-h-[19rem]'
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
                            <Input
                              placeholder={t('fields.courseNamePlaceholder')}
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
                          <FormLabel>{t('fields.class')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isPending}
                          >
                            <FormControl>
                              <SelectTrigger className='!h-12 !min-h-[3rem] file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-base shadow-sm transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/20 aria-invalid:border-red-500 aria-invalid:ring-red-500/20'>
                                <SelectValue
                                  placeholder={t('fields.classPlaceholder')}
                                />
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
                          <FormLabel>{t('fields.period')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={isPending}
                          >
                            <FormControl>
                              <SelectTrigger className='!h-12 !min-h-[3rem] file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-base shadow-sm transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/20 aria-invalid:border-red-500 aria-invalid:ring-red-500/20'>
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
                        className='flex flex-1 rounded-full py-6 font-semibold !text-sm'
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
  );
}
