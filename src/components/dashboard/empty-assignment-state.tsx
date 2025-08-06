import Image from 'next/image';

export function EmptyAssignmentState() {
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
          Anda belum membuat tugas
        </h1>
        <p className='text-gray-600 text-sm font-normal'>
          Buat tugas untuk memulai pembagian kelompok
        </p>
      </div>
    </div>
  );
}
