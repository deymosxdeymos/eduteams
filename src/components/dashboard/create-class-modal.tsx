'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { DialogDescription } from '@radix-ui/react-dialog';
import { Loader2, Plus } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getClientLocaleFromCookie, onLocaleChange } from '@/i18n/client';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
import type { Course } from '@/lib/types';
import {
  type CourseCreateInput,
  courseCreateSchema,
} from '@/lib/validation/course';

interface CreateClassModalProps {
  onClassCreated?: (course: Course) => void;
}

export default function CreateClassModal({
  onClassCreated,
}: CreateClassModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic message loading for i18n
  const [messages, setMessages] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const loadMessages = async (l: Locale) => {
      const dict = await getDictionary(l);
      setMessages(dict);
    };

    loadMessages(getClientLocaleFromCookie());

    const unsubscribe = onLocaleChange(newLocale => {
      loadMessages(newLocale);
    });

    return unsubscribe;
  }, []);

  const form = useForm<CourseCreateInput>({
    resolver: zodResolver(courseCreateSchema),
    defaultValues: {
      namaMataKuliah: '',
      kelas: undefined,
      tahunAwalPeriode: new Date().getFullYear(),
      tahunAkhirPeriode: new Date().getFullYear() + 1,
      periode: undefined,
    },
  });

  const onSubmit = (values: CourseCreateInput) => {
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

        // Call callback if provided
        if (onClassCreated) {
          onClassCreated(result.data);
        }

        // Reset form and close modal after short delay
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
            {messages?.dashboard?.modals?.createClass?.button ||
              'Buat Kelas Baru'}
          </p>
        </Button>
      </DialogTrigger>
      <DialogContent className='rounded-2xl sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle className='text-xl font-medium'>
            {messages?.dashboard?.modals?.createClass?.title ||
              'Buat Kelas Baru'}
          </DialogTitle>
          <DialogDescription className='text-sm font-normal'>
            {messages?.dashboard?.modals?.createClass?.description ||
              'Silahkan isi seluruh data di bawah untuk membuat kelas baru'}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className='flex flex-col items-center justify-center py-8 space-y-4'>
            <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
              <svg
                className='w-6 h-6 text-green-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                role='img'
                aria-label='Success checkmark'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
            <p className='text-green-600 font-medium'>
              {messages?.dashboard?.modals?.createClass?.success ||
                'Kelas berhasil dibuat!'}
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <FormField
                control={form.control}
                name='namaMataKuliah'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {messages?.dashboard?.modals?.createClass?.fields
                        ?.courseName || 'Nama Mata Kuliah'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          messages?.dashboard?.modals?.createClass?.fields
                            ?.courseNamePlaceholder ||
                          'Masukkan nama mata kuliah'
                        }
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
                    <FormLabel>
                      {messages?.dashboard?.modals?.createClass?.fields
                        ?.class || 'Kelas'}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger className='!h-12 !min-h-[3rem] file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-base shadow-sm transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/20 aria-invalid:border-red-500 aria-invalid:ring-red-500/20'>
                          <SelectValue
                            placeholder={
                              messages?.dashboard?.modals?.createClass?.fields
                                ?.classPlaceholder || 'Pilih kelas'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='tanpa-kelas'>
                          {messages?.dashboard?.modals?.createClass?.options
                            ?.noClass || 'Tanpa Kelas'}
                        </SelectItem>
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
                name='tahunAwalPeriode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {messages?.dashboard?.modals?.createClass?.fields
                        ?.startYear || 'Tahun Awal'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='text'
                        placeholder={
                          messages?.dashboard?.modals?.createClass?.fields
                            ?.startYearPlaceholder || 'Masukkan tahun awal'
                        }
                        value={field.value ?? ''}
                        onChange={e => {
                          const value = e.target.value.replace(/\D/g, '');
                          field.onChange(value ? Number(value) : '');
                        }}
                        disabled={isPending}
                        inputMode='numeric'
                        pattern='[0-9]*'
                        className='flex h-12 w-full min-w-0 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-base shadow-sm transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/20 aria-invalid:border-red-500 aria-invalid:ring-red-500/20'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='tahunAkhirPeriode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {messages?.dashboard?.modals?.createClass?.fields
                        ?.endYear || 'Tahun Akhir'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='text'
                        placeholder={
                          messages?.dashboard?.modals?.createClass?.fields
                            ?.endYearPlaceholder || 'Masukkan tahun akhir'
                        }
                        value={field.value ?? ''}
                        onChange={e => {
                          const value = e.target.value.replace(/\D/g, '');
                          field.onChange(value ? Number(value) : '');
                        }}
                        disabled={isPending}
                        inputMode='numeric'
                        pattern='[0-9]*'
                        className='flex h-12 w-full min-w-0 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-base shadow-sm transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/20 aria-invalid:border-red-500 aria-invalid:ring-red-500/20'
                      />
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
                    <FormLabel>
                      {messages?.dashboard?.modals?.createClass?.fields
                        ?.period || 'Periode'}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger className='!h-12 !min-h-[3rem] file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-base shadow-sm transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/20 aria-invalid:border-red-500 aria-invalid:ring-red-500/20'>
                          <SelectValue
                            placeholder={
                              messages?.dashboard?.modals?.createClass?.fields
                                ?.periodPlaceholder || 'Pilih periode'
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='ganjil'>
                          {messages?.dashboard?.modals?.createClass?.options
                            ?.odd || 'Ganjil'}
                        </SelectItem>
                        <SelectItem value='genap'>
                          {messages?.dashboard?.modals?.createClass?.options
                            ?.even || 'Genap'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className='bg-red-50 border border-red-200 rounded-md p-3'>
                  <p className='text-red-600 text-sm'>{error}</p>
                </div>
              )}

              <div className='flex justify-end space-x-3 text-md pt-4'>
                <Button
                  variant='onboarding'
                  className='flex flex-1 rounded-full font-semibold py-6 !text-sm'
                  type='submit'
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className='mr-1 h-4 w-4 animate-spin' />
                  ) : (
                    <Plus strokeWidth={3} className='mr-1 h-4 w-4' />
                  )}
                  {isPending
                    ? messages?.dashboard?.modals?.createClass?.creating ||
                      'Membuat...'
                    : messages?.dashboard?.modals?.createClass?.create ||
                      'Buat Kelas'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
