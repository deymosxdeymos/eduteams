import { Mail, Phone } from 'lucide-react';
import Image from 'next/image';
import { LoginButton } from '@/components/auth/login-button';
import { UserDisplay } from '@/components/auth/user-info';
import Logo from '@/components/logo';
import { SocialRow } from '@/components/ui/social-row';
import { TextRotate } from '@/components/ui/text-rotate';

export default function Home() {
  return (
    <main>
      <UserDisplay />
      <section className='bg-blue-background min-h-screen flex flex-col pt-14'>
        {/* header */}
        <Logo className='justify-center' />

        {/* hero content */}
        <div className='flex flex-col items-center justify-center gap-6 sm:gap-8 lg:gap-10 px-4 pt-16 sm:pt-24 lg:pt-16 lg:pb-20'>
          <div className='text-center'>
            <h1 className='text-white text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-4'>
              Dimana{' '}
              <TextRotate
                texts={['Keadilan', 'Kesetaraan', 'Kesempatan']}
                className='text-amber-300'
                splitBy='characters'
                staggerDuration={0.03}
                rotationInterval={2500}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              />
            </h1>
            <h1 className='text-white text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight'>
              Menciptakan Keunggulan
            </h1>
          </div>

          <p className='text-center text-white text-base sm:text-xl lg:text-2xl mt-6 sm:mt-10 max-w-4xl'>
            Setiap hasil yang hebat dimulai dengan tim yang hebat. Selamat
            <br className='hidden sm:block' /> datang di EquiTeam, mari kita
            mulai sesuatu yang luar biasa.
          </p>

          {/* login button speech bubble */}
          <div className='mt-4'>
            <LoginButton />
          </div>
          {/* mascot */}
          <div className='flex items-center justify-center z-10 mt-4'>
            <Image
              src='/landing/Illustration.svg'
              width={700}
              height={700}
              alt='mascot'
              className='w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[700px] h-auto'
              priority
            />
          </div>
        </div>
      </section>

      {/* hills */}
      <section className='relative bg-white mt-10'>
        <Image
          src='/landing/Subtract.svg'
          width={1920}
          height={400}
          alt='hills'
          className='absolute left-0 right-0 -top-24 sm:-top-36 md:-top-42 lg:-top-44 z-0 w-full h-auto'
          priority
        />

        {/* text statement */}
        <div className=' flex flex-col items-center justify-center px-2 sm:px-4'>
          <Image
            src='/landing/ENFJ.svg'
            width={200}
            height={200}
            alt='ENFJ'
            className='flex mr-auto ml-40 -mt-34 z-10'
          />
          <div className='p-4 sm:p-8 lg:p-10 mb-22 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8'>
            <div className='flex items-center justify-center h-full'>
              <h1 className='text-lg sm:text-3xl lg:text-7xl font-extrabold text-blue-background leading-snug mb-2 sm:mb-4'>
                EquiTeam <br /> itu apa sih?
              </h1>
            </div>
            <div className='flex items-center justify-center text-black text-xl font normal h-full'>
              <p>
                EquiTeam bukan sekadar alat pembagi kelompok biasa. Kami adalah
                sebuah platform pintar yang dirancang untuk mengakhiri drama
                &quot;salah tim&quot;. <br />
                <br />
                Dengan bantuan kecerdasan buatan, kami memastikan setiap
                kelompok memiliki kombinasi anggota yang pas, baik dari segi
                keahlian maupun cara kerja, sehingga semua orang bisa nyaman
                berkontribusi dan meraih hasil terbaik bersama.
              </p>
            </div>
          </div>
          <Image
            src='/landing/ENTJ.svg'
            width={200}
            height={200}
            alt='ENTJ'
            className='absolute right-0 -bottom-16'
          />{' '}
        </div>
      </section>

      {/* grey area underneath */}
      <section className='bg-accent min-h-[200px] flex flex-col items-center justify-center p-10'>
        <h1 className='text-black text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4'>
          Relate dengan permasalahan ini?
        </h1>
        <p className='text-gray-900 text-base sm:text-xl lg:text-2xl text-center px-4'>
          Permasalahan-permasalahan ini pasti sering banget terjadi di
          perkuliahan kalian
        </p>
        {/* 3 problem cards row */}
        <div className='w-full max-w-5xl mx-auto mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch'>
          {/* Card 1 */}
          <div className='bg-gradient-to-b from-white to-lime-100 rounded-xl shadow-md p-6 pb-0 flex flex-col text-start overflow-hidden h-full justify-between'>
            <h1 className='text-emerald-900 font-bold text-5xl mb-1'>
              Partisipasi tim tidak merata
            </h1>
            <Image
              src='/landing/INFJ.svg'
              width={200}
              height={200}
              alt='INFJ'
              className='ml-auto -mr-6'
            />
          </div>
          {/* Card 2 */}
          <div className='bg-gradient-to-b from-white to-yellow-100 rounded-xl shadow-md p-6 pb-0 flex flex-col text-start overflow-hidden h-full justify-between'>
            <h1 className='text-orange-900 font-bold text-5xl mb-1'>
              Terdapat kelompok terbuang
            </h1>
            <Image
              src='/landing/ESTP.svg'
              width={200}
              height={200}
              alt='ESTP'
              className='ml-auto -mr-6'
            />
          </div>
          {/* Card 3 */}
          <div className='bg-gradient-to-b from-white to-indigo-200 rounded-xl shadow-md p-6 pb-0 flex flex-col text-start overflow-hidden h-full justify-between'>
            <h1 className='text-violet-900 font-bold text-5xl mb-1'>
              Keahlian <br /> di tim tidak seimbang
            </h1>
            <Image
              src='/landing/INTJ.svg'
              width={200}
              height={200}
              alt='INTJ'
              className='ml-auto -mr-6'
            />
          </div>
        </div>
        <div className='text-center italic justify-start text-gray-900 text-3xl font-medium mt-22'>
          Dengan adanya EquiTeam,
          <br />
          hal-hal tersebut akan teratasi dengan lebih mudah
        </div>
      </section>

      <section className='bg-white min-h-[200px] flex flex-col items-center justify-center px-10 py-18'>
        <h1 className='text-blue-background text-5xl font-extrabold mt-2'>
          Solusi EquiTeam
        </h1>
        <p className='text-gray-900 text-base sm:text-xl lg:text-2xl text-center mt-4'>
          Sistem cerdas yang membagi kelompok berdasarkan 4 aspek fundamental
          untuk <br /> menciptakan tim yang seimbang dan produktif
        </p>

        {/* First row: 2 cards */}
        <div className='w-full max-w-6xl mx-auto mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='bg-white rounded-3xl shadow-md p-6'>
            <h2 className='text-black font-bold text-2xl mb-4'>
              Bagaimana EquiTeam bekerja?
            </h2>
            <div className='flex items-start gap-4 mb-4'>
              <div className='w-8 h-8 bg-blue-background rounded-full flex items-center justify-center'>
                <span className='text-white text-sm font-bold'>1</span>
              </div>
              <div className='flex-1'>
                <h3 className='text-gray-900 text-base font-semibold mb-1'>
                  Input Data Mahasiswa
                </h3>
                <p className='text-gray-900 text-sm'>
                  Sistem mengumpulkan data personality, skills, preferences, dan
                  gender
                </p>
              </div>
            </div>
            <div className='flex items-start gap-4 mb-4'>
              <div className='w-8 h-8 bg-blue-background rounded-full flex items-center justify-center'>
                <span className='text-white text-sm font-bold'>2</span>
              </div>
              <div className='flex-1'>
                <h3 className='text-gray-900 text-base font-semibold mb-1'>
                  Analisis AI
                </h3>
                <p className='text-gray-900 text-sm'>
                  AI menganalisis kompatibilitas dan keseimbangan untuk
                  pembentukan tim optimal
                </p>
              </div>
            </div>
            <div className='flex items-start gap-4'>
              <div className='w-8 h-8 bg-blue-background rounded-full flex items-center justify-center'>
                <span className='text-white text-sm font-bold'>3</span>
              </div>
              <div className='flex-1'>
                <h3 className='text-gray-900 text-base font-semibold mb-1'>
                  Pembentukan Tim
                </h3>
                <p className='text-gray-900 text-sm'>
                  Sistem membentuk kelompok yang seimbang berdasarkan hasil
                  analisis
                </p>
              </div>
            </div>
          </div>

          <div className='bg-indigo-800 rounded-3xl shadow-md p-6 border text-center'>
            <h2 className='text-white font-bold text-2xl leading-10'>
              4 Aspek Utama
            </h2>
            <p className='text-white text-lg font-light leading-7'>
              Yang dianalisis untuk pembagian kelompok optimal
            </p>

            <div className='grid grid-cols-2 gap-4 mt-6'>
              <div className='bg-white/10 rounded-xl p-4 text-center'>
                <h3 className='text-emerald-400 font-bold text-2xl mb-2'>
                  Personality
                </h3>
                <p className='text-white text-sm font-light'>Based on MBTI</p>
              </div>
              <div className='bg-white/10 rounded-xl p-4 text-center'>
                <h3 className='text-amber-400 font-bold text-2xl mb-2'>
                  Skills
                </h3>
                <p className='text-white text-sm font-light'>
                  Technical & soft skills
                </p>
              </div>
              <div className='bg-white/10 rounded-xl p-4 text-center'>
                <h3 className='text-sky-400 font-bold text-2xl mb-2'>Gender</h3>
                <p className='text-white text-sm font-light'>
                  Balanced <br /> Representation
                </p>
              </div>
              <div className='bg-white/10 rounded-xl p-4 text-center'>
                <h3 className='text-indigo-400 font-bold text-2xl mb-2'>
                  Preferences
                </h3>
                <p className='text-white text-sm font-light'>
                  Preferences for <br /> task topics
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Second row: 4 cards */}
        <div className='w-full max-w-6xl mx-auto mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
          <div className='flex flex-col items-center'>
            <div className='bg-emerald-100 rounded-xl p-6 flex items-center justify-center mb-4 h-62'>
              <Image
                src='/landing/personality.svg'
                width={200}
                height={200}
                alt='Personality'
                className='p-6'
              />
            </div>
            <h1 className='text-emerald-700 font-bold text-2xl mb-2 text-center whitespace-nowrap'>
              Personality Matching
            </h1>
            <p className='text-gray-900 text-sm text-center font-normal'>
              Kombinasi introvert-extrovert, thinking-feeling untuk dinamika
              yang seimbang
            </p>
          </div>
          <div className='flex flex-col items-center'>
            <div className='bg-amber-100 rounded-xl p-6 flex items-center justify-center mb-4 h-62'>
              <Image
                src='/landing/skill.svg'
                width={200}
                height={200}
                alt='Skills'
                className='p-6'
              />
            </div>
            <h1 className='text-amber-700 font-bold text-2xl mb-2 text-center'>
              Skill Balancing
            </h1>
            <p className='text-gray-900 text-sm text-center font-normal'>
              Distribusi kemampuan yang merata agar setiap tim memiliki kekuatan
              yang setara
            </p>
          </div>
          <div className='flex flex-col items-center'>
            <div className='bg-sky-200 rounded-xl p-6 flex items-center justify-center mb-4 h-62'>
              <Image
                src='/landing/gender.svg'
                width={200}
                height={200}
                alt='Gender'
                className='p-6'
              />
            </div>
            <h1 className='text-sky-700 font-bold text-2xl mb-2 text-center'>
              Gender Balance
            </h1>
            <p className='text-gray-900 text-sm text-center font-normal'>
              Representasi yang adil untuk perspektif yang beragam dan inklusif
            </p>
          </div>
          <div className='flex flex-col items-center'>
            <div className='bg-indigo-100 rounded-xl p-6 flex items-center justify-center mb-4 h-62'>
              <Image
                src='/landing/preference-task.svg'
                width={200}
                height={200}
                alt='Preferences'
                className='p-6'
              />
            </div>
            <h1 className='text-indigo-700 font-bold text-2xl mb-2 text-center'>
              Task Preference
            </h1>
            <p className='text-gray-900 text-sm text-center font-normal'>
              Menyesuaikan ketertarikan mahasiswa terhadap topik tugas yang
              tersedia
            </p>
          </div>
        </div>
      </section>
      <section className='bg-blue-background min-h-[200px] flex flex-col items-center justify-center px-10 py-18'>
        <h1 className='text-white text-5xl font-bold mt-2'>
          Manfaat untuk Semua
        </h1>
        <p className='text-white font-normal text-base sm:text-lg lg:text-xl text-center mt-4'>
          EquiTeam memberikan value yang signifikan untuk berbagai stakeholder
        </p>
        <div className='flex justify-center items-center gap-4 mt-18'>
          {/* card 1 */}
          <div className='bg-white/10 rounded-3xl flex flex-col justify-start items-start shadow-md p-6'>
            <div className='bg-emerald-100 rounded-xl flex items-center justify-center mb-4 w-fit'>
              <Image
                src='/mahasiswa.svg'
                width={120}
                height={120}
                alt='Student'
                className='p-4'
              />
            </div>
            <h1 className='text-emerald-400 text-2xl font-bold'>
              Untuk Mahasiswa
            </h1>
            <ul className='text-emerald-400 text-base font-light mt-3 space-y-2 list-disc list-inside max-w-xs pr-8 mr-10'>
              <li>
                <span className='text-white'>
                  Pengalaman belajar yang lebih menyenangkan
                </span>
              </li>
              <li>
                <span className='text-white'>
                  Kesempatan mengembangkan soft skills
                </span>
              </li>
              <li>
                <span className='text-white'>
                  Networking dengan teman yang lebih komplementer
                </span>
              </li>
              <li>
                <span className='text-white'>
                  Hasil project yang lebih berkualitas
                </span>
              </li>
            </ul>
          </div>
          {/* card 2 */}
          <div className='bg-white/10 rounded-3xl flex flex-col justify-start items-start shadow-md p-6'>
            <div className='bg-amber-100 rounded-xl flex items-center justify-center mb-4 w-fit'>
              <Image
                src='/dosen.svg'
                width={120}
                height={120}
                alt='Student'
                className='p-4'
              />
            </div>
            <h1 className='text-amber-400 text-2xl font-bold'>Untuk Dosen</h1>
            <ul className='text-amber-400 text-base font-light mt-3 space-y-2 list-disc list-inside max-w-xs pr-8 mr-10'>
              <li>
                <span className='text-white'>
                  Menghemat waktu pembagian kelompok
                </span>
              </li>
              <li>
                <span className='text-white'>
                  Mengurangi komplain dari mahasiswa
                </span>
              </li>
              <li>
                <span className='text-white'>
                  Hasil pembelajaran yang lebih optimal
                </span>
              </li>
              <li>
                <span className='text-white'>Data analisis untuk evaluasi</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
      <section className='bg-white min-h-[200px] flex flex-col items-center justify-center px-10 py-18'>
        <div className='flex flex-col items-center justify-center gap-18 max-w-6xl text-center'>
          <h1 className='text-zinc-800 text-4xl font-semibold mt-2'>
            Fokus pada Keadilan dan Keseimbangan
          </h1>
          <h1 className='text-zinc-800 text-7xl font-extrabold italic mt-2 tracking-tight leading-snug'>
            <span className='text-blue-background'>EquiTeam</span> membuka
            gerbang kesempatan yang{' '}
            <span className='text-blue-background'>adil</span> 👍, kami
            melepaskan potensi penuh setiap mahasiswa untuk meraih{' '}
            <span className='text-blue-background'>kesuksesan</span> ⭐
          </h1>
          <p className='font-light tracking-tight text-zinc-800 text-3xl'>
            Keadilan bukan lagi impian
          </p>
        </div>
      </section>
      <footer className='bg-blue-background min-h-[1000px] flex flex-col items-start gap-32 p-48 pb-2 relative'>
        <h1 className='text-white text-9xl font-normal z-10'>
          LET&apos;S KEEP IN TOUCH
        </h1>{' '}
        <div className='flex items-start justify-start gap-48 text-start z-10'>
          <h2 className='text-white text-3xl font-semibold mt-2 max-w-lg'>
            Platform pintar yang mengakhiri drama “salah tim” di kampus. <br />
            Bagi kelompok dengan adil, <br /> cepat, dan tanpa ribet.
          </h2>
          <div className='flex flex-col items-start justify-center gap-12 max-w-4xl text-start'>
            <h2 className='text-white text-xl font-bold mt-2'>Alamat</h2>
            <p className='text-white text-lg font-normal mt-2'>
              Ruang D215, Gedung D, <br /> Kampus Itera
            </p>
          </div>
          <div className='flex flex-col items-start justify-start gap-12 max-w-4xl text-start'>
            <h2 className='text-white text-xl font-bold mt-2'>Kontak</h2>
            <div className='flex flex-col items-start justify-start gap-6 mt-2'>
              <div className='flex items-center gap-2'>
                <Phone className='w-6 h-6 text-white' />
                <p className='text-white text-lg font-normal underline mt-2'>
                  (0721) 8030188
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <Mail className='w-6 h-6 text-white' />
                <p className='text-white text-lg font-normal underline'>
                  informatika@itera.ac.id
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className='flex items-center justify-between text-start gap-6 mt-20 max-w-6xl z-10 w-full'>
          <Logo size='text-4xl' className='min-w-2xl' />
          <div className='flex flex-row items-center'>
            <p className='text-white text-lg font-normal min-w-sm mt-2'>
              Copyright © 2025 EquiTeam <br /> Semua hak dilindungi.
            </p>
            {/* SocialRow: social icons row */}
            <SocialRow />
          </div>
        </div>
        <Image
          src='/landing/footer.svg'
          alt='footer'
          width={900}
          height={900}
          className='absolute right-0 bottom-0 z-0'
        />
      </footer>
    </main>
  );
}
