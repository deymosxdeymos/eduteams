import Image from 'next/image';

export default function RoleSelect() {
  return (
    <div className='flex gap-x-16 items-center justify-center'>
      <div className='bg-amber-100 flex flex-col items-center justify-center rounded-4xl w-[20rem] h-[20rem] p-2'>
        <Image
          src='/dosen.svg'
          width={240}
          height={240}
          alt='dosen'
          className='mb-[-30px]'
        />
        <h1
          className='font-bold text-center text-amber-950 text-5xl 
		tracking-tighter leading-none uppercase'
        >
          Dosen
        </h1>
      </div>
      <div className='bg-green-100 flex flex-col items-center justify-center rounded-4xl w-[20rem] h-[20rem] p-2'>
        <Image
          src='/mahasiswa.svg'
          width={240}
          height={240}
          alt='mahasiswa'
          className='mb-[-30px]'
        />
        <h1 className='font-bold text-center text-green-950 text-5xl tracking-tighter leading-none uppercase'>
          Mahasiswa
        </h1>
      </div>
    </div>
  );
}
