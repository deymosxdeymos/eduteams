'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { InputRounded } from '@/components/ui/input-rounded';
import { UserRound } from 'lucide-react';

interface DataDiriFormProps {
  role: 'dosen' | 'mahasiswa';
  onSubmitAction: (data: {
    namaLengkap: string;
    nim?: string;
    npm?: string;
    jenisKelamin: string;
  }) => Promise<void>;
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

export default function DataDiriForm({
  role,
  onSubmitAction,
}: DataDiriFormProps) {
  const formSchema = createFormSchema(role);
  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues:
      role === 'mahasiswa'
        ? { namaLengkap: '', nim: '', jenisKelamin: '' }
        : { namaLengkap: '', npm: '', jenisKelamin: '' },
  });

  function handleSubmit(values: FormData) {
    onSubmitAction(values);
  }

  return (
    <Form {...form}>
      <form
        id='data-diri-form'
        onSubmit={form.handleSubmit(handleSubmit)}
        className='space-y-8 w-full max-w-2xl'
      >
        <FormField
          control={form.control}
          name='namaLengkap'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-black text-xl font-normal'>
                Nama Lengkap
              </FormLabel>
              <FormControl>
                <div className='relative'>
                  <UserRound className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black' />
                  <InputRounded
                    placeholder='Masukkan nama lengkap'
                    {...field}
                    className='pl-10'
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={role === 'mahasiswa' ? 'nim' : 'npm'}
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-black text-xl font-normal'>
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
                    placeholder={`Masukkan ${role === 'mahasiswa' ? 'NIM' : 'NPM'}`}
                    {...field}
                    className='pl-10'
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='jenisKelamin'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-black text-xl font-normal'>
                Jenis Kelamin
              </FormLabel>
              <FormControl>
                <div className='flex gap-x-4 items-start'>
                  <button
                    type='button'
                    onClick={() => field.onChange('laki-laki')}
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
                      className='mb-[-10px]'
                    />
                    <p className='font-bold text-center text-blue-950 text-md tracking-tighter leading-none uppercase'>
                      Laki-laki
                    </p>
                  </button>

                  <button
                    type='button'
                    onClick={() => field.onChange('perempuan')}
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
                      className='mb-[-10px]'
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
      </form>
    </Form>
  );
}
