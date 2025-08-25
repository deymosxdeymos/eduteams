'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { UserRound } from 'lucide-react';
import Image from 'next/image';
import { useId, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { InputRounded } from '@/components/ui/input-rounded';
import { submitDataDiri } from '@/lib/actions/data-diri';

interface DataDiriFormClientProps {
  role: 'dosen' | 'mahasiswa';
  initialData?: {
    namaLengkap: string;
    nimNpm: string;
    jenisKelamin: string;
    role: string;
  };
}

const createFormSchema = (role: 'dosen' | 'mahasiswa') => {
  const baseSchema = {
    namaLengkap: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
    jenisKelamin: z.string().min(1, 'Pilih jenis kelamin'),
  };

  if (role === 'mahasiswa') {
    return z.object({
      ...baseSchema,
      nim: z
        .string()
        .min(8, 'NIM minimal 8 karakter')
        .max(15, 'NIM maksimal 15 karakter'),
    });
  } else {
    return z.object({
      ...baseSchema,
      npm: z
        .string()
        .min(8, 'NPM minimal 8 karakter')
        .max(15, 'NPM maksimal 15 karakter'),
    });
  }
};

export default function DataDiriFormClient({
  role,
  initialData,
}: DataDiriFormClientProps) {
  const formId = 'data-diri-form';
  const genderLabelId = useId();
  const [isPending, startTransition] = useTransition();
  const formSchema = createFormSchema(role);
  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      namaLengkap: initialData?.namaLengkap || '',
      jenisKelamin: initialData?.jenisKelamin || '',
      ...(role === 'mahasiswa'
        ? { nim: initialData?.nimNpm || '' }
        : { npm: initialData?.nimNpm || '' }),
    } as FormData,
  });

  function handleSubmit(values: FormData) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('namaLengkap', values.namaLengkap);
      formData.append('jenisKelamin', values.jenisKelamin);
      formData.append('role', role);

      if (role === 'mahasiswa') {
        formData.append('nim', (values as { nim: string }).nim);
      } else {
        formData.append('npm', (values as { npm: string }).npm);
      }

      try {
        await submitDataDiri(formData);
      } catch (error) {
        console.error('Error submitting data-diri:', error);
        // Handle error appropriately in production
      }
    });
  }

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(handleSubmit)}
        className='space-y-8 w-full max-w-2xl'
      >
        <FormField
          control={form.control}
          name='namaLengkap'
          render={({ field }) => {
            const fieldId = `namaLengkap-${Math.random().toString(36).substring(2, 11)}`;
            return (
              <FormItem>
                <FormLabel
                  htmlFor={fieldId}
                  className='text-black text-xl font-normal'
                >
                  Nama Lengkap
                </FormLabel>
                <FormControl>
                  <div className='relative'>
                    <UserRound className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black' />
                    <InputRounded
                      id={fieldId}
                      placeholder='Masukkan nama lengkap'
                      {...field}
                      className='pl-10'
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name={role === 'mahasiswa' ? 'nim' : 'npm'}
          render={({ field }) => {
            const fieldId = `${role === 'mahasiswa' ? 'nim' : 'npm'}-${Math.random().toString(36).substring(2, 11)}`;
            return (
              <FormItem>
                <FormLabel
                  htmlFor={fieldId}
                  className='text-black text-xl font-normal'
                >
                  {role === 'mahasiswa'
                    ? 'Nomor Induk Mahasiswa (NIM)'
                    : 'Nomor Pokok Pegawai (NPM)'}
                </FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Image
                      src='/icons/nim.svg'
                      alt={`${role === 'mahasiswa' ? 'NIM' : 'NPM'} icon`}
                      width={16}
                      height={16}
                      className='absolute left-3 top-1/2 -translate-y-1/2'
                    />
                    <InputRounded
                      id={fieldId}
                      placeholder={`Masukkan ${role === 'mahasiswa' ? 'NIM' : 'NPM'}`}
                      {...field}
                      className='pl-10'
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name='jenisKelamin'
          render={({ field }) => (
            <FormItem>
              <FormLabel
                id={genderLabelId}
                className='text-black text-xl font-normal'
              >
                Jenis Kelamin
              </FormLabel>
              <FormControl>
                <div
                  className='flex gap-x-4 items-start'
                  role='radiogroup'
                  aria-labelledby='gender-label'
                >
                  <button
                    type='button'
                    role='radio'
                    aria-checked={field.value === 'laki-laki'}
                    onClick={() => field.onChange('laki-laki')}
                    onKeyDown={e =>
                      e.key === 'Enter' && field.onChange('laki-laki')
                    }
                    className={`bg-blue-100 flex flex-col items-center justify-center rounded-xl w-[6rem] h-[6rem] p-1 cursor-pointer transition-all duration-200 ${
                      field.value === 'laki-laki'
                        ? 'ring-4 ring-blue-300 scale-105'
                        : 'hover:bg-blue-200'
                    }`}
                  >
                    <Image
                      src='/laki.svg'
                      width={80}
                      height={80}
                      alt='laki-laki'
                      className='mb-[-10px] w-auto h-auto'
                    />
                    <p className='font-bold text-center text-blue-950 text-md tracking-tighter leading-none uppercase'>
                      Laki-laki
                    </p>
                  </button>

                  <button
                    type='button'
                    role='radio'
                    aria-checked={field.value === 'perempuan'}
                    onClick={() => field.onChange('perempuan')}
                    onKeyDown={e =>
                      e.key === 'Enter' && field.onChange('perempuan')
                    }
                    className={`bg-pink-100 flex flex-col items-center justify-center rounded-xl w-[6rem] h-[6rem] p-1 cursor-pointer transition-all duration-200 ${
                      field.value === 'perempuan'
                        ? 'ring-4 ring-pink-300 scale-105'
                        : 'hover:bg-pink-200'
                    }`}
                  >
                    <Image
                      src='/perempuan.svg'
                      width={80}
                      height={80}
                      alt='perempuan'
                      className='mb-[-10px] w-auto h-auto'
                    />
                    <p className='font-bold text-center text-pink-950 text-md tracking-tighter leading-none uppercase'>
                      Perempuan
                    </p>
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <button
          type='submit'
          form='data-diri-form'
          disabled={isPending}
          className='hidden'
        >
          {isPending ? 'Saving...' : 'Lanjut'}
        </button>
      </form>
    </Form>
  );
}
