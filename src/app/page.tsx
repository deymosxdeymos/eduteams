import Image from 'next/image';

export default function Home() {
  return (
    <main>
      <section className='bg-blue-600 min-h-screen flex flex-col'>
        {/* header */}
        <header className='flex flex-row justify-center items-center pt-10 w-full gap-2'>
          <Image src='/logo.png' width={50} height={50} alt='logo' />
          <p className='text-white text-3xl font-bold'>
            Equi<span className='text-white font-light'>Team</span>
          </p>
        </header>

        {/* hero content */}
        <div className='flex flex-col items-center justify-center gap-8 px-4 pt-20'>
          <div className='text-center'>
            <h1 className='text-white text-7xl font-bold tracking-tight mb-4'>
              Dimana <span className='text-green-500'>Keadilan</span>
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
            <div className='relative text-center text-3xl font-semibold w-56 rounded-full bg-white p-4 text-blue-800'>
              Masuk
              <div className='absolute z-10 right-0'>
                <div className='rounded-sm before:rounded-full before:absolute before:-bottom-9.5 before:-left-17 before:h-14 before:w-7 before:rotate-42 before:transform before:border-r-2 before:border-t-2 before:border-white before:bg-white'></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* hills */}
      <section className='relative bg-blue-600 -mt-40'>
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
              <h1 className='text-5xl font-bold text-blue-600 mb-4'>
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
      <div className='absolute left-1/2 transform -translate-x-1/2 z-30 top-[calc(100vh-335px)]'>
        <Image src='/mascot.svg' width={190} height={190} alt='mascot' />
      </div>
    </main>
  );
}
