'use client';

import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { InputRounded } from '@/components/ui/input-rounded';
import type { ExtendedUser } from '@/lib/types';

interface DosenProfileContentProps {
  user: ExtendedUser;
}

export function DosenProfileContent({ user }: DosenProfileContentProps) {
  const router = useRouter();
  const [namaLengkap, setNamaLengkap] = useState<string>(user.name ?? '');
  const initialJenisKelamin = useMemo(() => {
    if (user.gender === 'MALE') return 'laki-laki';
    if (user.gender === 'FEMALE') return 'perempuan';
    return '';
  }, [user.gender]);
  const [jenisKelamin, setJenisKelamin] = useState<string>(initialJenisKelamin);
  const [isPending, startTransition] = useTransition();
  const nameInputId = useId();
  const genderLabelId = useId();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMale = jenisKelamin === 'laki-laki';
  const isFemale = jenisKelamin === 'perempuan';

  // Auto-select current gender on mount/hydration based on user.gender
  useEffect(() => {
    setJenisKelamin(initialJenisKelamin);
  }, [initialJenisKelamin]);

  const onSave = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/user/data-diri', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            namaLengkap,
            jenisKelamin,
            role: 'dosen',
            npm: user.nimNpm || '',
          }),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.success) {
          throw new Error(json?.error || 'Gagal menyimpan perubahan');
        }

        setMessage('Perubahan berhasil disimpan');
      } catch (e) {
        const err = e as Error;
        setError(err.message || 'Terjadi kesalahan');
      }
    });
  };

  return (
    <div className='bg-white rounded-3xl h-full flex flex-col overflow-hidden p-4 gap-4'>
      <div className='flex items-center gap-3'>
        <Button
          variant='ghost'
          size='icon'
          className='rounded-full'
          aria-label='Kembali'
          onClick={() => router.back()}
        >
          <ArrowLeft className='w-5 h-5' />
        </Button>
        <h1 className='text-xl font-medium text-gray-900'>Profil</h1>
      </div>

      <div className='flex flex-col gap-6 p-2'>
        <p className='text-neutral-800 text-sm font-normal'>
          Untuk mengubah data diri Anda, harap isi kolom-kolom berikut.
        </p>
        <div className='flex flex-col gap-2'>
          <label
            htmlFor={nameInputId}
            className='text-black text-xl font-normal'
          >
            Nama Lengkap
          </label>
          <div className='relative max-w-xl'>
            <InputRounded
              id={nameInputId}
              placeholder='Masukkan nama lengkap'
              value={namaLengkap}
              onChange={e => setNamaLengkap(e.target.value)}
            />
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          <span id={genderLabelId} className='text-black text-xl font-normal'>
            Jenis Kelamin
          </span>
          <div
            className='flex gap-x-4 items-start'
            role='radiogroup'
            aria-labelledby={genderLabelId}
          >
            <button
              type='button'
              role='radio'
              aria-checked={isMale}
              onClick={() => setJenisKelamin('laki-laki')}
              onKeyDown={e => e.key === 'Enter' && setJenisKelamin('laki-laki')}
              className={`bg-blue-100 flex flex-col items-center justify-center rounded-xl w-[6rem] h-[6rem] p-1 cursor-pointer transition-all duration-200 border ${
                isMale
                  ? 'ring-4 ring-blue-300 scale-105 border-2 border-blue-400'
                  : isFemale
                    ? 'grayscale opacity-50 border-neutral-200'
                    : 'hover:bg-blue-200 border-transparent'
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
              aria-checked={isFemale}
              onClick={() => setJenisKelamin('perempuan')}
              onKeyDown={e => e.key === 'Enter' && setJenisKelamin('perempuan')}
              className={`bg-pink-100 flex flex-col items-center justify-center rounded-xl w-[6rem] h-[6rem] p-1 cursor-pointer transition-all duration-200 border ${
                isFemale
                  ? 'ring-4 ring-pink-300 scale-105 border-2 border-pink-400'
                  : isMale
                    ? 'grayscale opacity-50 border-neutral-200'
                    : 'hover:bg-pink-200 border-transparent'
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
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <Button
          variant='onboarding'
          onClick={onSave}
          className='rounded-full w-[36rem] h-[3rem]'
          disabled={isPending || !namaLengkap || !jenisKelamin}
        >
          {isPending ? 'Menyimpan...' : 'Simpan perubahan'}
        </Button>
        {message && <span className='text-green-600 text-sm'>{message}</span>}
        {error && <span className='text-red-600 text-sm'>{error}</span>}
      </div>
    </div>
  );
}
