'use client';

import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useMemo, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { InputRounded } from '@/components/ui/input-rounded';
import { getClientLocaleFromCookie, onLocaleChange } from '@/i18n/client';
import type { Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';
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
  // biome-ignore lint/suspicious/noExplicitAny: dynamic messages
  const [messages, setMessages] = useState<Record<string, any> | null>(null);

  // Auto-select current gender on mount/hydration based on user.gender
  useEffect(() => {
    setJenisKelamin(initialJenisKelamin);
  }, [initialJenisKelamin]);

  useEffect(() => {
    const load = async (l: Locale) => {
      const dict = await getDictionary(l);
      setMessages(dict);
    };
    load(getClientLocaleFromCookie());
    const unsub = onLocaleChange(l => load(l));
    return unsub;
  }, []);

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
          throw new Error(
            json?.error ||
              messages?.dashboard?.profile?.saveFailed ||
              'Gagal menyimpan perubahan'
          );
        }
        setMessage(
          messages?.dashboard?.profile?.saveSuccess ||
            'Perubahan berhasil disimpan'
        );
      } catch (e) {
        const err = e as Error;
        setError(
          err.message ||
            messages?.dashboard?.profile?.errorGeneric ||
            'Terjadi kesalahan'
        );
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
          aria-label={messages?.dashboard?.profile?.back || 'Kembali'}
          onClick={() => router.back()}
        >
          <ArrowLeft className='w-5 h-5' />
        </Button>
        <h1 className='text-xl font-medium text-gray-900'>
          {messages?.dashboard?.profile?.title || 'Profil'}
        </h1>
      </div>

      <div className='flex flex-col gap-6 p-2'>
        <p className='text-neutral-800 text-sm font-normal'>
          {messages?.dashboard?.profile?.instructions ||
            'Untuk mengubah data diri Anda, harap isi kolom-kolom berikut.'}
        </p>
        <div className='flex flex-col gap-2'>
          <label
            htmlFor={nameInputId}
            className='text-black text-xl font-normal'
          >
            {messages?.dashboard?.profile?.fullName || 'Nama Lengkap'}
          </label>
          <div className='relative max-w-xl'>
            <InputRounded
              id={nameInputId}
              placeholder={
                messages?.dashboard?.profile?.fullNamePlaceholder ||
                'Masukkan nama lengkap'
              }
              value={namaLengkap}
              onChange={e => setNamaLengkap(e.target.value)}
            />
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          <span id={genderLabelId} className='text-black text-xl font-normal'>
            {messages?.dashboard?.profile?.gender || 'Jenis Kelamin'}
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
                alt={messages?.dashboard?.profile?.male || 'Laki-laki'}
                className='mb-[-10px] w-auto h-auto'
              />
              <p className='font-bold text-center text-blue-950 text-md tracking-tighter leading-none uppercase'>
                {messages?.dashboard?.profile?.male || 'Laki-laki'}
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
                alt={messages?.dashboard?.profile?.female || 'Perempuan'}
                className='mb-[-10px] w-auto h-auto'
              />
              <p className='font-bold text-center text-pink-950 text-md tracking-tighter leading-none uppercase'>
                {messages?.dashboard?.profile?.female || 'Perempuan'}
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
          {isPending
            ? messages?.dashboard?.profile?.saving || 'Menyimpan...'
            : messages?.dashboard?.profile?.save || 'Simpan perubahan'}
        </Button>
        {message && <span className='text-green-600 text-sm'>{message}</span>}
        {error && <span className='text-red-600 text-sm'>{error}</span>}
      </div>
    </div>
  );
}
