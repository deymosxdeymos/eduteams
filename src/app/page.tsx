import Logo from '@/components/logo';
import Image from 'next/image';
import { LoginButton } from '@/components/auth/login-button';
import { UserDisplay } from '@/components/auth/user-info';

export default function Home() {
  return (
    <main>
      <UserDisplay />
      <section className='bg-blue-background min-h-screen flex flex-col'>
        {/* header */}
        <Logo />

        {/* hero content */}
        <div className='flex flex-col items-center justify-center gap-8 px-4 pt-20'>
          <div className='text-center'>
            <h1 className='text-white text-7xl font-bold tracking-tight mb-4'>
              Dimana <span className='text-lime-200'>Keadilan</span>
            </h1>
            <h1 className='text-white text-7xl font-bold tracking-tight'>
              Menciptakan Keunggulan
            </h1>
          </div>

          <p className='text-center text-white text-2xl mt-10 max-w-4xl'>
            Setiap hasil yang hebat dimulai dengan tim yang hebat. Selamat
            <br /> datang di EquiTeam, mari kita mulai sesuatu yang luar biasa.
          </p>

          {/* login button speech bubble */}
          <div className='mt-4'>
            <LoginButton />
          </div>
        </div>
      </section>

      {/* hills */}
      <section className='relative bg-blue-background -mt-30'>
        <svg
          width='100%'
          height='500'
          viewBox='0 0 1440 500'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
          className='w-full'
          preserveAspectRatio='none'
        >
          <path
            d='M685 0C961.643 0 1220.17 28.1832 1440 77.0742V500H0V62.4658C203.94 22.6132 437.201 0 685 0Z'
            fill='#DBFA78'
          />
        </svg>

        {/* boxed statement */}
        <div className='absolute inset-0 flex flex-col items-center justify-center px-4'>
          <div className='bg-white p-10 rounded-xl w-[900px] text-start shadow-lg grid grid-cols-4 relative'>
            <div className='col-span-3'>
              <h1 className='text-5xl font-bold text-blue-background mb-4'>
                Apa itu EquiTeam
              </h1>
              <p className='text-black font-light text-lg leading-tight'>
                EquiTeam adalah platform inovatif yang menggunakan algoritma
                cerdas untuk membentuk kelompok belajar atau kerja yang adil dan
                seimbang berdasarkan berbagai aspek
              </p>
            </div>
            <div className='col-span-1'>{/* Smaller empty space */}</div>
            <div className='absolute -top-14 right-1'>
              <Image
                src='/question.svg'
                width={120}
                height={120}
                alt='question icon'
              />
            </div>
          </div>
        </div>
      </section>

      {/* mascot */}
      <div className='absolute left-1/2 transform -translate-x-1/2 z-30 top-[calc(100vh-290px)]'>
        <Image src='/mascot.svg' width={190} height={190} alt='mascot' />
      </div>
    </main>
  );
}
