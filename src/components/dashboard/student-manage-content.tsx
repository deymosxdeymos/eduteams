import type { ExtendedUser } from '@/lib/types';

interface StudentManageContentProps {
  user: ExtendedUser;
}

export function StudentManageContent({ user }: StudentManageContentProps) {
  return (
    <section className='flex h-full flex-col items-center justify-center rounded-3xl bg-white px-6 py-12 text-center'>
      <h1 className='text-2xl font-semibold text-neutral-900'>
        Kelola Kelas Mahasiswa
      </h1>
      <p className='mt-3 max-w-md text-sm text-muted-foreground'>
        Halo {user.name ?? 'Mahasiswa'}, area ini sedang dalam pengembangan.
        Kamu tetap bisa melihat kelas dan tugasmu dari halaman dashboard utama.
      </p>
    </section>
  );
}
