import { Mail, Phone } from 'lucide-react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { LoginButton } from '@/components/auth/login-button';
import { LanguageSwitcher } from '@/components/dashboard/language-switcher';
import Logo from '@/components/logo';
import { HighlightText } from '@/components/ui/highlight-text';
import { ScrollToTopButton } from '@/components/ui/scroll-to-top-button';
import { SkipLink } from '@/components/ui/skip-link';
import { SmoothScrollLink } from '@/components/ui/smooth-scroll-link';
import { SocialRow } from '@/components/ui/social-row';

export default async function Home() {
  const t = await getTranslations();
  const mainContentId = 'main-content';

  return (
    <>
      <div style={{ position: 'absolute', left: '-10000px' }} />
      <SkipLink href={`#${mainContentId}`}>Skip to content</SkipLink>
      <nav className='fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-20 py-4 bg-gradient-to-b from-blue-background via-blue-background/80 to-transparent'>
        <Logo
          href='/'
          imageClassName='h-8 w-auto md:h-12'
          size='text-xl sm:text-2xl md:text-3xl'
          className='justify-center animate-logo-welcome'
        />
        <div className='flex items-center font-medium text-base gap-x-6'>
          <div className='flex text-background items-center gap-x-4 animate-hero-delay-700'>
            <SmoothScrollLink href='#tentang'>Tentang</SmoothScrollLink>
            <SmoothScrollLink href='#masalah'>Masalah</SmoothScrollLink>
            <SmoothScrollLink href='#solusi'>Solusi</SmoothScrollLink>
            <SmoothScrollLink href='#manfaat'>Manfaat</SmoothScrollLink>
          </div>
          <LanguageSwitcher className='animate-hero-delay-800' />
        </div>
      </nav>
      <main id={mainContentId} className='overflow-x-hidden'>
        <section className='bg-blue-background min-h-screen flex flex-col px-6 pt-32 overflow-x-hidden relative'>
          <div className='flex flex-col items-center justify-center gap-6 sm:gap-8 lg:gap-10 px-4 pt-16 sm:pt-24 lg:pt-16 lg:pb-20'>
            <div className='text-center'>
              <h1 className='text-white text-5xl lg:text-7xl font-bold tracking-tight  animate-hero-delay-600'>
                {t('homepage.hero.titlePrefix')}
                <br className='sm:hidden' />
                <span className='hidden sm:inline'> </span>
                <span className='text-amber-300'>
                  {t('homepage.hero.titleCall')}
                </span>
              </h1>
              <p className='text-white text-5xl lg:text-7xl font-bold tracking-tight animate-hero-delay-600'>
                {t('homepage.hero.titleSuffix')}
              </p>
            </div>

            <p className='text-center text-white text-base sm:text-xl lg:text-2xl max-w-4xl animate-hero-delay-700'>
              {t('homepage.hero.description')}
            </p>

            <div className='mt-4'>
              <LoginButton className='animate-hero-delay-800' />
            </div>
            <div className='flex items-center justify-center z-20 relative mt-4 mb-6 lg:mb-0'>
              <Image
                src='/landing/Illustration.svg'
                width={1000}
                height={800}
                sizes='(max-width: 640px) 450px, (max-width: 768px) 500px, (max-width: 1024px) 700px, 1000px'
                alt='mascot'
                className='w-full h-auto max-w-[450px] sm:max-w-[700px] md:max-w-[500px] lg:max-w-[1000px] z-20 animate-mascot'
                style={{ height: 'auto' }}
                priority
              />
            </div>
          </div>
        </section>

        {/* biome-ignore lint/correctness/useUniqueElementIds: static ID for anchor navigation */}
        <section
          id='tentang'
          className='relative bg-white -mt-56 sm:mt-0 animate-hills'
        >
          <div className='absolute inset-x-0 -top-6 sm:-top-10 -translate-y-[10%] sm:-translate-y-[60%] pointer-events-none z-10 flex justify-center'>
            <Image
              src='/landing/Subtract.svg'
              width={1920}
              height={400}
              sizes='100vw'
              alt='hills'
              className='w-full h-auto max-w-[1920px] animate-hills'
              style={{ height: 'auto' }}
              priority
            />
          </div>
          <div className='relative flex flex-col items-center justify-center px-8 max-w-full overflow-visible animate-hills-content'>
            <div className='p-4 sm:p-8 lg:p-10 mb-22 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8'>
              <div className='flex items-start sm:items-center justify-start sm:justify-center h-full'>
                <h2 className='text-5xl sm:text-7xl font-bold sm:font-extrabold text-blue-background leading-snug sm:leading-snug mt-28 sm:mt-0 mb-2 sm:mb-4'>
                  {t('homepage.about.titlePrefix')}
                  <br className='sm:hidden' /> {t('homepage.about.titleSuffix')}
                </h2>
              </div>
              <div className='flex items-center justify-center text-black text-xl font normal h-full'>
                <p>{t('homepage.about.description')}</p>
              </div>
            </div>
            <Image
              src='/landing/ENTJ.svg'
              width={200}
              height={200}
              sizes='(max-width: 640px) 120px, (max-width: 1024px) 150px, 200px'
              alt='ENTJ'
              className='absolute right-0 -bottom-16 w-auto h-auto max-w-[120px] sm:max-w-[150px] lg:max-w-[200px] z-20'
            />
          </div>
        </section>

        {/* biome-ignore lint/correctness/useUniqueElementIds: static ID for anchor navigation */}
        <section
          id='masalah'
          className='bg-accent min-h-screen flex flex-col items-center justify-center px-12 py-14 lg:p-10 overflow-x-hidden z-0'
        >
          <h2 className='text-black text-4xl sm:text-5xl text-center font-semibold sm:font-bold tracking-tight mb-4'>
            {t('homepage.problems.title')}
          </h2>
          <p className='text-gray-900 text-base sm:text-xl lg:text-2xl text-center px-4'>
            {t('homepage.problems.description')}
          </p>
          <div className='w-full max-w-5xl mx-auto mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch'>
            <div className='bg-gradient-to-b from-white to-lime-100 rounded-xl shadow-md p-6 pr-0 pb-0 flex flex-col text-start overflow-hidden h-full justify-between'>
              <h3 className='text-emerald-900 font-bold text-5xl mb-1'>
                {t('homepage.problems.problem1')}
              </h3>
              <Image
                src='/landing/INFJ.svg'
                width={200}
                height={200}
                sizes='(max-width: 1024px) 150px, 200px'
                alt='INFJ'
                className='ml-auto w-auto h-auto max-w-[150px] lg:max-w-[200px]'
                style={{ height: 'auto' }}
              />
            </div>
            <div className='bg-gradient-to-b from-white to-yellow-100 rounded-xl shadow-md p-6 pr-0 pb-0 flex flex-col text-start overflow-hidden h-full justify-between'>
              <h3 className='text-orange-900 font-bold text-5xl mb-1'>
                {t('homepage.problems.problem2')}
              </h3>
              <Image
                src='/landing/ESTP.svg'
                width={200}
                height={200}
                sizes='(max-width: 1024px) 150px, 200px'
                alt='ESTP'
                className='ml-auto w-auto h-auto max-w-[150px] lg:max-w-[200px]'
              />
            </div>
            <div className='bg-gradient-to-b from-white to-indigo-200 rounded-xl shadow-md p-6 pr-0 pb-0 flex flex-col text-start overflow-hidden h-full justify-between'>
              <h3 className='text-violet-900 font-bold text-5xl mb-1'>
                {t('homepage.problems.problem3')}
              </h3>
              <Image
                src='/landing/INTJ.svg'
                width={200}
                height={200}
                sizes='(max-width: 1024px) 150px, 200px'
                alt='INTJ'
                className='ml-auto w-auto h-auto max-w-[150px] lg:max-w-[200px]'
              />
            </div>
          </div>
          <div className='text-center italic justify-start text-gray-900 text-3xl font-medium mt-22 whitespace-pre-line'>
            {t('homepage.problems.solution')}
          </div>
        </section>

        {/* biome-ignore lint/correctness/useUniqueElementIds: static ID for anchor navigation */}
        <section
          id='solusi'
          className='bg-white min-h-screen flex flex-col items-center justify-center px-8 lg:px-10 py-18 overflow-x-hidden'
        >
          <h2 className='text-blue-background text-5xl sm:text-5xl tracking-tighter sm:tracking-normal font-semibold sm:font-bold mt-2'>
            {t('homepage.solution.title')}
          </h2>
          <p className='text-gray-900 text-base sm:text-xl lg:text-2xl text-center mt-4'>
            {t('homepage.solution.description')}
          </p>

          <div className='w-full max-w-6xl mx-auto mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='bg-white rounded-3xl shadow-md p-6'>
              <h2 className='text-black font-bold text-2xl mb-4'>
                {t('homepage.solution.howItWorks.title')}
              </h2>
              <div className='flex items-start gap-4 mb-4'>
                <div className='w-8 h-8 bg-blue-background rounded-full flex items-center justify-center'>
                  <span className='text-white text-sm font-bold'>1</span>
                </div>
                <div className='flex-1'>
                  <h3 className='text-gray-900 text-base font-semibold mb-1'>
                    {t('homepage.solution.howItWorks.step1.title')}
                  </h3>
                  <p className='text-gray-900 text-sm'>
                    {t('homepage.solution.howItWorks.step1.description')}
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-4 mb-4'>
                <div className='w-8 h-8 bg-blue-background rounded-full flex items-center justify-center'>
                  <span className='text-white text-sm font-bold'>2</span>
                </div>
                <div className='flex-1'>
                  <h3 className='text-gray-900 text-base font-semibold mb-1'>
                    {t('homepage.solution.howItWorks.step2.title')}
                  </h3>
                  <p className='text-gray-900 text-sm'>
                    {t('homepage.solution.howItWorks.step2.description')}
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-4'>
                <div className='w-8 h-8 bg-blue-background rounded-full flex items-center justify-center'>
                  <span className='text-white text-sm font-bold'>3</span>
                </div>
                <div className='flex-1'>
                  <h3 className='text-gray-900 text-base font-semibold mb-1'>
                    {t('homepage.solution.howItWorks.step3.title')}
                  </h3>
                  <p className='text-gray-900 text-sm'>
                    {t('homepage.solution.howItWorks.step3.description')}
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-indigo-800 rounded-3xl shadow-md p-6 border text-center'>
              <h2 className='text-white font-bold text-2xl leading-10'>
                {t('homepage.solution.aspects.title')}
              </h2>
              <p className='text-white text-lg font-light leading-7'>
                {t('homepage.solution.aspects.description')}
              </p>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
                <div className='bg-white/10 rounded-xl p-4 text-center'>
                  <h3 className='text-emerald-400 font-bold text-2xl mb-2'>
                    {t('homepage.solution.aspects.personality.name')}
                  </h3>
                  <p className='text-white text-sm font-light'>
                    {t('homepage.solution.aspects.personality.description')}
                  </p>
                </div>
                <div className='bg-white/10 rounded-xl p-4 text-center'>
                  <h3 className='text-amber-400 font-bold text-2xl mb-2'>
                    {t('homepage.solution.aspects.skills.name')}
                  </h3>
                  <p className='text-white text-sm font-light'>
                    {t('homepage.solution.aspects.skills.description')}
                  </p>
                </div>
                <div className='bg-white/10 rounded-xl p-4 text-center'>
                  <h3 className='text-sky-400 font-bold text-2xl mb-2'>
                    {t('homepage.solution.aspects.gender.name')}
                  </h3>
                  <p className='text-white text-sm font-light'>
                    {t('homepage.solution.aspects.gender.description')}
                  </p>
                </div>
                <div className='bg-white/10 rounded-xl p-4 text-center'>
                  <h3 className='text-indigo-400 font-bold text-2xl mb-2'>
                    {t('homepage.solution.aspects.preferences.name')}
                  </h3>
                  <p className='text-white text-sm font-light'>
                    {t('homepage.solution.aspects.preferences.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='w-full max-w-6xl mx-auto mt-8 grid grid-cols-2 sm:grid-cols-4 gap-6'>
            <div className='flex flex-col items-center'>
              <div className='bg-emerald-100 rounded-xl p-6 flex items-center justify-center mb-4 aspect-square sm:h-62'>
                <Image
                  src='/landing/personality.svg'
                  width={200}
                  height={200}
                  alt='Personality'
                  className='p-6'
                />
              </div>
              <h3 className='text-emerald-1000 font-bold text-2xl mb-2 text-center'>
                {t('homepage.solution.features.personalityMatching.title')}
              </h3>
              <p className='text-gray-900 text-sm text-center font-normal'>
                {t(
                  'homepage.solution.features.personalityMatching.description'
                )}
              </p>
            </div>
            <div className='flex flex-col items-center'>
              <div className='bg-amber-100 rounded-xl p-6 flex items-center justify-center mb-4 aspect-square sm:h-62'>
                <Image
                  src='/landing/skill.svg'
                  width={200}
                  height={200}
                  alt='Skills'
                  className='p-6'
                />
              </div>
              <h3 className='text-amber-1000 font-bold text-2xl mb-2 text-center'>
                {t('homepage.solution.features.skillBalancing.title')}
              </h3>
              <p className='text-gray-900 text-sm text-center font-normal'>
                {t('homepage.solution.features.skillBalancing.description')}
              </p>
            </div>
            <div className='flex flex-col items-center'>
              <div className='bg-sky-200 rounded-xl p-6 flex items-center justify-center mb-4 aspect-square sm:h-62'>
                <Image
                  src='/landing/gender.svg'
                  width={200}
                  height={200}
                  alt='Gender'
                  className='p-6'
                />
              </div>
              <h3 className='text-sky-1000 font-bold text-2xl mb-2 text-center'>
                {t('homepage.solution.features.genderBalance.title')}
              </h3>
              <p className='text-gray-900 text-sm text-center font-normal'>
                {t('homepage.solution.features.genderBalance.description')}
              </p>
            </div>
            <div className='flex flex-col items-center'>
              <div className='bg-indigo-100 rounded-xl p-6 flex items-center justify-center mb-4 aspect-square sm:h-62'>
                <Image
                  src='/landing/preference-task.svg'
                  width={200}
                  height={200}
                  alt='Preferences'
                  className='p-6'
                />
              </div>
              <h3 className='text-indigo-1000 font-bold text-2xl mb-2 text-center'>
                {t('homepage.solution.features.taskPreference.title')}
              </h3>
              <p className='text-gray-900 text-sm text-center font-normal'>
                {t('homepage.solution.features.taskPreference.description')}
              </p>
            </div>
          </div>
        </section>
        {/* biome-ignore lint/correctness/useUniqueElementIds: static ID for anchor navigation */}
        <section
          id='manfaat'
          className='bg-blue-background min-h-screen flex flex-col items-center px-4 sm:px-6 py-18 overflow-x-hidden'
        >
          <h2 className='text-white text-center text-5xl font-bold mt-2'>
            {t('homepage.benefits.title')}
          </h2>
          <p className='text-white font-normal text-base sm:text-lg lg:text-xl text-center mt-8'>
            {t('homepage.benefits.description')}
          </p>
          <div className='flex flex-col lg:flex-row justify-center items-center gap-6 lg:gap-8 mt-18 max-w-6xl mx-auto px-4'>
            <div className='bg-white/10 rounded-3xl flex flex-col justify-start items-start shadow-md p-6 lg:p-8 flex-1 min-h-[500px] w-full'>
              <div className='bg-emerald-100 rounded-xl flex items-center justify-center mb-6 w-fit'>
                <Image
                  src='/mahasiswa.svg'
                  width={150}
                  height={150}
                  alt='Student'
                  className='p-6'
                />
              </div>
              <h3 className='text-emerald-400 text-3xl font-bold mb-4'>
                {t('homepage.benefits.forStudents.title')}
              </h3>
              <ul className='text-emerald-400 text-lg font-light mt-4 space-y-3 list-disc list-inside flex-1'>
                <li>
                  <span className='text-white text-lg'>
                    {t('homepage.benefits.forStudents.benefit1')}
                  </span>
                </li>
                <li>
                  <span className='text-white text-lg'>
                    {t('homepage.benefits.forStudents.benefit2')}
                  </span>
                </li>
                <li>
                  <span className='text-white text-lg'>
                    {t('homepage.benefits.forStudents.benefit3')}
                  </span>
                </li>
                <li>
                  <span className='text-white text-lg'>
                    {t('homepage.benefits.forStudents.benefit4')}
                  </span>
                </li>
              </ul>
            </div>
            <div className='bg-white/10 rounded-3xl flex flex-col justify-start items-start shadow-md p-6 lg:p-8 flex-1 min-h-[500px] w-full'>
              <div className='bg-amber-100 rounded-xl flex items-center justify-center mb-6 w-fit'>
                <Image
                  src='/dosen.svg'
                  width={150}
                  height={150}
                  alt='Lecturer'
                  className='p-6'
                />
              </div>
              <h3 className='text-amber-400 text-3xl font-bold mb-4'>
                {t('homepage.benefits.forLecturers.title')}
              </h3>
              <ul className='text-amber-400 text-lg font-light mt-4 space-y-3 list-disc list-inside flex-1'>
                <li>
                  <span className='text-white text-lg'>
                    {t('homepage.benefits.forLecturers.benefit1')}
                  </span>
                </li>
                <li>
                  <span className='text-white text-lg'>
                    {t('homepage.benefits.forLecturers.benefit2')}
                  </span>
                </li>
                <li>
                  <span className='text-white text-lg'>
                    {t('homepage.benefits.forLecturers.benefit3')}
                  </span>
                </li>
                <li>
                  <span className='text-white text-lg'>
                    {t('homepage.benefits.forLecturers.benefit4')}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>
        <section className='bg-white min-h-screen flex flex-col items-center justify-center px-4 lg:px-10 py-18 overflow-x-hidden'>
          <div className='flex flex-col items-center justify-center gap-18 max-w-6xl text-center'>
            <h2 className='text-zinc-800 text-2xl sm:text-3xl lg:text-4xl font-semibold mt-2'>
              {t('homepage.focus.title')}
            </h2>
            <p className='text-zinc-800 text-3xl sm:text-5xl lg:text-7xl font-extrabold italic mt-2 tracking-tight leading-snug'>
              <span className='text-blue-background'>EquiTeam</span>{' '}
              <HighlightText text={t.raw('homepage.focus.text') as string} />
            </p>
            <p className='font-light tracking-tight text-zinc-800 text-lg sm:text-2xl lg:text-3xl px-4'>
              {t('homepage.focus.justice')}
            </p>
          </div>
        </section>
        <footer className='bg-blue-background min-h-screen flex flex-col items-start gap-8 sm:gap-16 lg:gap-28 p-4 sm:p-8 lg:p-32 relative max-w-full overflow-hidden'>
          <h2 className='text-white text-4xl sm:text-6xl lg:text-9xl font-normal z-10'>
            {t('homepage.footer.title')}
          </h2>{' '}
          <div className='flex flex-col lg:flex-row items-center justify-between z-10 w-full'>
            <Logo
              imageClassName='h-8 w-auto md:h-24'
              size='text-xl sm:text-2xl md:text-5xl'
              className='justify-center'
            />
            <LoginButton />
          </div>
          <div className='flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-48 text-start whitespace-pre-line z-10 w-full'>
            <h2 className='text-white text-3xl font-semibold mt-2 max-w-lg'>
              {t('homepage.footer.description')}
            </h2>
            <div className='flex flex-col items-start justify-center gap-12 max-w-4xl text-start'>
              <h2 className='text-white text-xl font-bold mt-2'>
                {t('homepage.footer.address.title')}
              </h2>
              <p className='text-white text-lg font-normal mt-2'>
                {t('homepage.footer.address.text')}
              </p>
            </div>
            <div className='flex flex-col items-start justify-start gap-12 max-w-4xl text-start'>
              <h2 className='text-white text-xl font-bold mt-2'>
                {t('homepage.footer.contact.title')}
              </h2>
              <div className='flex flex-col items-start justify-start gap-6 mt-2'>
                <div className='flex items-center gap-2'>
                  <Phone className='w-6 h-6 text-white' />
                  <p className='text-white text-lg font-normal underline mt-2'>
                    {t('homepage.footer.contact.phone')}
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <Mail className='w-6 h-6 text-white' />
                  <p className='text-white text-lg font-normal underline'>
                    {t('homepage.footer.contact.email')}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className='flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-48 text-start mt-8 lg:mt-20 z-10 w-full'>
            <div className='max-w-lg' />
            <div className='max-w-4xl' />
            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 max-w-4xl'>
              <p className='text-white text-sm sm:text-lg font-normal whitespace-pre-line mt-2'>
                {t('homepage.footer.copyright')}
              </p>
              <SocialRow />
            </div>
          </div>
          <Image
            src='/landing/footer.svg'
            alt='footer'
            width={1000}
            height={600}
            sizes='(max-width: 640px) 300px, (max-width: 1024px) 500px, 1000px'
            className='absolute right-0 bottom-0 z-0 w-auto h-auto max-w-[300px] sm:max-w-[500px] lg:max-w-[1000px]'
          />
        </footer>
      </main>
      <ScrollToTopButton />
    </>
  );
}
