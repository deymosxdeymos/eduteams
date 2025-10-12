import Image from 'next/image';
import { useTranslations } from 'next-intl';

export function EmptyAssignmentState() {
  const t = useTranslations('dashboard.emptyAssignments');

  return (
    <div className='flex flex-col items-center justify-center gap-y-4 mx-auto h-full'>
      <Image
        src='/belum-kelas.svg'
        width={180}
        height={180}
        alt='belum tugas'
      />
      <div className='text-center'>
        <h1 className='text-3xl font-semibold text-gray-800 tracking-tight pb-2'>
          {t('noAssignments')}
        </h1>
        <p className='text-gray-600 text-sm font-normal'>
          {t('createToStart')}
        </p>
      </div>
    </div>
  );
}
