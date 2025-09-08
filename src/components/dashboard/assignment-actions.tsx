'use client';

import { ArrowLeft, ChartLineIcon, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { InputRounded } from '@/components/ui/input-rounded';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AssignmentActionsProps {
  assignmentId: string;
  classId: string;
  canManage: boolean;
  isStudent?: boolean;
  hasTeams?: boolean;
  topicCount?: number;
  enrollmentCount?: number;
}

export function AssignmentActions({
  assignmentId,
  classId,
  canManage,
  isStudent = false,
  hasTeams = false,
  topicCount,
  enrollmentCount,
}: AssignmentActionsProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [method, setMethod] = useState<
    'JUMLAH_KELOMPOK' | 'JUMLAH_MHS_PER_KELOMPOK' | ''
  >('');
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetting, setResetting] = useState(false);

  const canSubmit = Boolean(
    method && value && Number(value) > 0 && !submitting
  );

  const handleCreate = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/form-teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, value: Number(value) }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(
          data?.error || 'Gagal membentuk kelompok. Coba lagi sebentar lagi.'
        );
        return;
      }
      setSuccess('Berhasil membentuk kelompok!');
      // Close and refresh after brief delay
      setTimeout(() => {
        setModalOpen(false);
        setMethod('');
        setValue('');
        router.refresh();
      }, 900);
    } catch {
      setError('Terjadi kesalahan jaringan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (resetting) return;
    const ok = window.confirm(
      'Reset pembagian kelompok untuk tugas ini?\nIni tidak menghapus data preferensi. Anda dapat membentuk ulang setelah reset.'
    );
    if (!ok) return;
    setResetting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/reset-teams`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error || 'Gagal mereset pembagian kelompok');
        return;
      }
      setSuccess('Berhasil mereset. Anda dapat membentuk ulang.');
      setTimeout(() => router.refresh(), 600);
    } catch {
      setError('Terjadi kesalahan jaringan saat reset.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className='flex items-center gap-4 flex-shrink-0'>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => window.history.back()}
        className='rounded-full'
      >
        <ArrowLeft strokeWidth={2} className='w-6 h-6 text-gray-600' />
      </Button>

      {canManage && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button variant='onboarding' className='rounded-full p-6 w-[11rem]'>
              <Plus strokeWidth={3} className='w-4 h-4 text-white' />
              <span className='font-semibold text-sm'>Buat Kelompok</span>
            </Button>
          </DialogTrigger>
          <DialogContent className='border max-w-md md:max-w-xl rounded-3xl p-0 gap-0'>
            <DialogHeader className='p-6 pb-2'>
              <DialogTitle className='text-xl font-semibold text-left'>
                Buat Kelompok
              </DialogTitle>
              <p className='text-gray-600 text-sm font-normal text-left mt-2'>
                Pilih cara pembagian, sistem akan menyusun kelompok secara
                otomatis berdasarkan data mahasiswa.
              </p>
            </DialogHeader>
            <div className='p-6 pt-0 space-y-5'>
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-900'>
                  Metode Pembagian Kelompok
                </label>
                <Select
                  value={method}
                  onValueChange={v => {
                    setMethod(v as typeof method);
                    setError('');
                  }}
                >
                  <SelectTrigger className='!h-12 !min-h-[3rem] w-full rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-base focus:border-neutral-400 focus:ring-2 focus:ring-neutral-400/20'>
                    <SelectValue placeholder='Pilih metode' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='JUMLAH_KELOMPOK'>
                      Jumlah Kelompok
                    </SelectItem>
                    <SelectItem value='JUMLAH_MHS_PER_KELOMPOK'>
                      Jumlah Mahasiswa per Kelompok
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {method && (
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-900'>
                    {method === 'JUMLAH_KELOMPOK'
                      ? 'Jumlah Kelompok'
                      : 'Jumlah Mahasiswa per Kelompok'}
                  </label>
                  <InputRounded
                    type='number'
                    min={method === 'JUMLAH_MHS_PER_KELOMPOK' ? 2 : 1}
                    placeholder={
                      method === 'JUMLAH_KELOMPOK' ? 'mis. 5' : 'mis. 4'
                    }
                    value={value}
                    onChange={e =>
                      setValue(e.target.value.replace(/[^0-9]/g, ''))
                    }
                    className='w-full'
                  />
                  {topicCount != null && enrollmentCount != null && value && (
                    <p className='text-xs text-neutral-500'>
                      {(() => {
                        const val = Number(value);
                        const groups =
                          method === 'JUMLAH_KELOMPOK'
                            ? val
                            : val > 0
                              ? Math.max(
                                  1,
                                  Math.ceil(
                                    (enrollmentCount ?? 0) / Math.max(1, val)
                                  )
                                )
                              : 0;
                        if (groups && groups !== topicCount) {
                          return `Catatan: Jumlah topik (${topicCount}) tidak sama dengan jumlah kelompok (${groups}). Preferensi topik akan dipetakan secara best‑effort.`;
                        }
                        return null;
                      })()}
                    </p>
                  )}
                </div>
              )}

              {error && (
                <p className='text-sm text-red-600' role='alert'>
                  {error}
                </p>
              )}
              {success && <p className='text-sm text-green-600'>{success}</p>}

              <div className='pt-1'>
                <Button
                  className='w-full rounded-full py-6 font-semibold'
                  variant='onboarding'
                  disabled={!canSubmit}
                  onClick={handleCreate}
                >
                  {submitting ? 'Membuat...' : 'Buat Kelompok'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {canManage && hasTeams && (
        <Button
          variant='outline'
          className='rounded-full border border-red-600 text-red-600 p-6 w-[11rem]'
          disabled={resetting}
          onClick={handleReset}
        >
          {resetting ? 'Mereset...' : 'Reset Kelompok'}
        </Button>
      )}

      {!isStudent && (
        <Button
          variant='outline'
          className='rounded-full border border-black p-6 w-[15rem]'
          onClick={() =>
            router.push(
              `/dashboard/class/${classId}/assignments/${assignmentId}/answers`
            )
          }
        >
          <ChartLineIcon className='w-4 h-4 text-black' />
          <span className='text-black font-semibold text-sm'>
            Lihat Jawaban Mahasiswa
          </span>
        </Button>
      )}

      {isStudent && (
        <Button
          variant='outline'
          className='rounded-full border border-black p-6 w-[14rem]'
          onClick={() =>
            router.push(
              `/dashboard/class/${classId}/assignments/${assignmentId}/quiz`
            )
          }
        >
          <ChartLineIcon className='w-4 h-4 text-black' />
          <span className='text-black font-semibold text-sm'>
            Lihat Jawaban Saya
          </span>
        </Button>
      )}
    </div>
  );
}
