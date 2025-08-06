export function StatisticsCards() {
  return (
    <div className='flex gap-4'>
      <div className='px-10 py-6 flex-1 bg-blue-100 rounded-3xl'>
        <h1 className='text-6xl font-bold text-sky-700'>0</h1>
        <p className='text-sky-900 text-base font-medium pt-4'>
          Total tugas telah dibuat
        </p>
      </div>
      <div className='px-10 py-6 flex-1 bg-emerald-100 rounded-3xl'>
        <h1 className='text-6xl font-bold text-emerald-700'>0</h1>
        <p className='text-emerald-900 text-base font-medium pt-4'>
          Total kelompok berhasil dibentuk
        </p>
      </div>
      <div className='px-10 py-6 flex-1 bg-amber-100 rounded-3xl'>
        <h1 className='text-6xl font-bold text-amber-700'>0</h1>
        <p className='text-amber-900 text-base font-medium pt-4'>
          Rata-rata skor kualitas kelompok
        </p>
      </div>
    </div>
  );
}
