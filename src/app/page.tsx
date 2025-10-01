import { Mail, Phone } from 'lucide-react';
import Image from 'next/image';
import { LoginButton } from '@/components/auth/login-button';
import { LanguageSwitcher } from '@/components/dashboard/language-switcher';
import Logo from '@/components/logo';
import { HighlightText } from '@/components/ui/highlight-text';
import { SkipLink } from '@/components/ui/skip-link';
import { SocialRow } from '@/components/ui/social-row';
import { getDictionary } from '@/i18n/get-dictionary';
import { getLocale } from '@/i18n/server';

export default async function Home() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  const mainContentId = `main-content-${locale}`;

  return (
    <>
      {/* Hidden element to prevent skip link from being focused on page load */}
      <div style={{ position: 'absolute', left: '-10000px' }} />
      <SkipLink href={`#${mainContentId}`}>Skip to content</SkipLink>
      <main id={mainContentId} className='overflow-x-hidden'>
        <section className='bg-blue-background flex flex-col px-6 pt-14 overflow-x-hidden relative'>
          {/* header */}
          <div className='flex items-center justify-between lg:justify-center px-4 max-w-full min-h-fit overflow-hidden'>
            <Logo
              imageSize='w-8 h-8 md:w-12 md:h-12'
              size='text-xl sm:text-2xl md:text-3xl'
              className='justify-center'
            />
            <div className='absolute right-4 sm:right-24'>
              <LanguageSwitcher current={locale} />
            </div>
          </div>

          {/* hero content */}
          <div className='flex flex-col items-center justify-center gap-6 sm:gap-8 lg:gap-10 px-4 pt-16 sm:pt-24 lg:pt-16 lg:pb-20'>
            <div className='text-center'>
              <h1 className='text-white text-5xl lg:text-7xl font-bold tracking-tight mb-4'>
                {dict.homepage.hero.titlePrefix}{' '}
                <span className='text-amber-300 font-bold'>
                  {dict.homepage.hero.titleCall}
                </span>
              </h1>
              <p className='text-white text-5xl lg:text-7xl font-bold tracking-tight'>
                {dict.homepage.hero.titleSuffix}
              </p>
            </div>

            <p className='text-center text-white text-base sm:text-xl lg:text-2xl max-w-4xl'>
              {dict.homepage.hero.description}
            </p>

            {/* login button speech bubble */}
            <div className='mt-4'>
              <LoginButton />
            </div>
            {/* mascot */}
            <div className='flex items-center justify-center z-20 relative mt-4 mb-6 lg:mb-0'>
              <Image
                src='/landing/Illustration.svg'
                width={1000}
                height={800}
                sizes='(max-width: 640px) 300px, (max-width: 768px) 500px, (max-width: 1024px) 700px, 1000px'
                alt='mascot'
                className='w-full h-auto max-w-[300px] sm:max-w-[700px] md:max-w-[500px] lg:max-w-[1000px] z-20'
                style={{ height: 'auto' }}
                priority
              />
            </div>
          </div>
        </section>

        {/* hills */}
        <section className='relative bg-white -mt-6 sm:mt-0'>
          <div className='absolute inset-x-0 -top-6 sm:-top-10 -translate-y-[10%] sm:-translate-y-[60%] pointer-events-none z-10 flex justify-center'>
            <Image
              src='/landing/Subtract.svg'
              width={1920}
              height={400}
              sizes='100vw'
              alt='hills'
              className='w-full h-auto max-w-[1920px]'
              style={{ height: 'auto' }}
              priority
            />
          </div>
          {/* text statement */}
          <div className='relative flex flex-col items-center justify-center px-8 max-w-full overflow-visible'>
            <div className='p-4 sm:p-8 lg:p-10 mb-22 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8'>
              <div className='flex items-start sm:items-center justify-start sm:justify-center h-full'>
                <h2 className='text-5xl sm:text-7xl font-bold sm:font-extrabold text-blue-background leading-snug sm:leading-snug mb-2 sm:mb-4'>
                  EquiTeam
                  <br className='sm:hidden' />{' '}
                  {dict.homepage.about.title.split(' ').slice(1).join(' ')}
                </h2>
              </div>
              <div className='flex items-center justify-center text-black text-xl font normal h-full'>
                <p>{dict.homepage.about.description}</p>
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

        {/* grey area */}
        <section className='bg-accent min-h-screen flex flex-col items-center justify-center px-12 py-14 lg:p-10 overflow-x-hidden z-0'>
          <h2 className='text-black text-4xl sm:text-5xl text-center font-semibold sm:font-bold tracking-tight mb-4'>
            {dict.homepage.problems.title}
          </h2>
          <p className='text-gray-900 text-base sm:text-xl lg:text-2xl text-center px-4'>
            {dict.homepage.problems.description}
          </p>
          {/* 3 problem cards row */}
          <div className='w-full max-w-5xl mx-auto mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch'>
            {/* Card 1 */}
            <div className='bg-gradient-to-b from-white to-lime-100 rounded-xl shadow-md p-6 pr-0 pb-0 flex flex-col text-start overflow-hidden h-full justify-between'>
              <h3 className='text-emerald-900 font-bold text-5xl mb-1'>
                {dict.homepage.problems.problem1}
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
            {/* Card 2 */}
            <div className='bg-gradient-to-b from-white to-yellow-100 rounded-xl shadow-md p-6 pr-0 pb-0 flex flex-col text-start overflow-hidden h-full justify-between'>
              <h3 className='text-orange-900 font-bold text-5xl mb-1'>
                {dict.homepage.problems.problem2}
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
            {/* Card 3 */}
            <div className='bg-gradient-to-b from-white to-indigo-200 rounded-xl shadow-md p-6 pr-0 pb-0 flex flex-col text-start overflow-hidden h-full justify-between'>
              <h3 className='text-violet-900 font-bold text-5xl mb-1'>
                {dict.homepage.problems.problem3}
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
            {dict.homepage.problems.solution}
          </div>
        </section>

        {/*solusi */}
        <section className='bg-white min-h-screen flex flex-col items-center justify-center px-8 lg:px-10 py-18 overflow-x-hidden'>
          <h2 className='text-blue-background text-5xl sm:text-5xl tracking-tighter sm:tracking-normal font-semibold sm:font-bold mt-2'>
            {dict.homepage.solution.title}
          </h2>
          <p className='text-gray-900 text-base sm:text-xl lg:text-2xl text-center mt-4'>
            {dict.homepage.solution.description}
          </p>

          {/* First row: 2 cards */}
          <div className='w-full max-w-6xl mx-auto mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='bg-white rounded-3xl shadow-md p-6'>
              <h2 className='text-black font-bold text-2xl mb-4'>
                {dict.homepage.solution.howItWorks.title}
              </h2>
              <div className='flex items-start gap-4 mb-4'>
                <div className='w-8 h-8 bg-blue-background rounded-full flex items-center justify-center'>
                  <span className='text-white text-sm font-bold'>1</span>
                </div>
                <div className='flex-1'>
                  <h3 className='text-gray-900 text-base font-semibold mb-1'>
                    {dict.homepage.solution.howItWorks.step1.title}
                  </h3>
                  <p className='text-gray-900 text-sm'>
                    {dict.homepage.solution.howItWorks.step1.description}
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-4 mb-4'>
                <div className='w-8 h-8 bg-blue-background rounded-full flex items-center justify-center'>
                  <span className='text-white text-sm font-bold'>2</span>
                </div>
                <div className='flex-1'>
                  <h3 className='text-gray-900 text-base font-semibold mb-1'>
                    {dict.homepage.solution.howItWorks.step2.title}
                  </h3>
                  <p className='text-gray-900 text-sm'>
                    {dict.homepage.solution.howItWorks.step2.description}
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-4'>
                <div className='w-8 h-8 bg-blue-background rounded-full flex items-center justify-center'>
                  <span className='text-white text-sm font-bold'>3</span>
                </div>
                <div className='flex-1'>
                  <h3 className='text-gray-900 text-base font-semibold mb-1'>
                    {dict.homepage.solution.howItWorks.step3.title}
                  </h3>
                  <p className='text-gray-900 text-sm'>
                    {dict.homepage.solution.howItWorks.step3.description}
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-indigo-800 rounded-3xl shadow-md p-6 border text-center'>
              <h2 className='text-white font-bold text-2xl leading-10'>
                {dict.homepage.solution.aspects.title}
              </h2>
              <p className='text-white text-lg font-light leading-7'>
                {dict.homepage.solution.aspects.description}
              </p>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6'>
                <div className='bg-white/10 rounded-xl p-4 text-center'>
                  <h3 className='text-emerald-400 font-bold text-2xl mb-2'>
                    {dict.homepage.solution.aspects.personality.name}
                  </h3>
                  <p className='text-white text-sm font-light'>
                    {dict.homepage.solution.aspects.personality.description}
                  </p>
                </div>
                <div className='bg-white/10 rounded-xl p-4 text-center'>
                  <h3 className='text-amber-400 font-bold text-2xl mb-2'>
                    {dict.homepage.solution.aspects.skills.name}
                  </h3>
                  <p className='text-white text-sm font-light'>
                    {dict.homepage.solution.aspects.skills.description}
                  </p>
                </div>
                <div className='bg-white/10 rounded-xl p-4 text-center'>
                  <h3 className='text-sky-400 font-bold text-2xl mb-2'>
                    {dict.homepage.solution.aspects.gender.name}
                  </h3>
                  <p className='text-white text-sm font-light'>
                    {dict.homepage.solution.aspects.gender.description}
                  </p>
                </div>
                <div className='bg-white/10 rounded-xl p-4 text-center'>
                  <h3 className='text-indigo-400 font-bold text-2xl mb-2'>
                    {dict.homepage.solution.aspects.preferences.name}
                  </h3>
                  <p className='text-white text-sm font-light'>
                    {dict.homepage.solution.aspects.preferences.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Second row: 4 cards */}
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
                {dict.homepage.solution.features.personalityMatching.title}
              </h3>
              <p className='text-gray-900 text-sm text-center font-normal'>
                {
                  dict.homepage.solution.features.personalityMatching
                    .description
                }
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
                {dict.homepage.solution.features.skillBalancing.title}
              </h3>
              <p className='text-gray-900 text-sm text-center font-normal'>
                {dict.homepage.solution.features.skillBalancing.description}
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
                {dict.homepage.solution.features.genderBalance.title}
              </h3>
              <p className='text-gray-900 text-sm text-center font-normal'>
                {dict.homepage.solution.features.genderBalance.description}
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
                {dict.homepage.solution.features.taskPreference.title}
              </h3>
              <p className='text-gray-900 text-sm text-center font-normal'>
                {dict.homepage.solution.features.taskPreference.description}
              </p>
            </div>
          </div>
        </section>
        <section className='bg-blue-background min-h-screen flex flex-col items-center px-4 sm:px-6 py-18 overflow-x-hidden'>
          <h2 className='text-white text-center text-5xl font-bold mt-2'>
            {dict.homepage.benefits.title}
          </h2>
          <p className='text-white font-normal text-base sm:text-lg lg:text-xl text-center mt-8'>
            {dict.homepage.benefits.description}
          </p>
          <div className='flex flex-col lg:flex-row justify-center items-center gap-6 lg:gap-8 mt-18 max-w-6xl mx-auto px-4'>
            {/* card 1 */}
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
                {dict.homepage.benefits.forStudents.title}
              </h3>
              <ul className='text-emerald-400 text-lg font-light mt-4 space-y-3 list-disc list-inside flex-1'>
                <li>
                  <span className='text-white text-lg'>
                    {dict.homepage.benefits.forStudents.benefit1}
                  </span>
                </li>
                <li>
                  <span className='text-white text-lg'>
                    {dict.homepage.benefits.forStudents.benefit2}
                  </span>
                </li>
                <li>
                  <span className='text-white text-lg'>
                    {dict.homepage.benefits.forStudents.benefit3}
                  </span>
                </li>
                <li>
                  <span className='text-white text-lg'>
                    {dict.homepage.benefits.forStudents.benefit4}
                  </span>
                </li>
              </ul>
            </div>
            {/* card 2 */}
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
                {dict.homepage.benefits.forLecturers.title}
              </h3>
              <ul className='text-amber-400 text-lg font-light mt-4 space-y-3 list-disc list-inside flex-1'>
                <li>
                  <span className='text-white text-lg'>
                    {dict.homepage.benefits.forLecturers.benefit1}
                  </span>
                </li>
                <li>
                  <span className='text-white text-lg'>
                    {dict.homepage.benefits.forLecturers.benefit2}
                  </span>
                </li>
                <li>
                  <span className='text-white text-lg'>
                    {dict.homepage.benefits.forLecturers.benefit3}
                  </span>
                </li>
                <li>
                  <span className='text-white text-lg'>
                    {dict.homepage.benefits.forLecturers.benefit4}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>
        <section className='bg-white min-h-screen flex flex-col items-center justify-center px-4 lg:px-10 py-18 overflow-x-hidden'>
          <div className='flex flex-col items-center justify-center gap-18 max-w-6xl text-center'>
            <h2 className='text-zinc-800 text-2xl sm:text-3xl lg:text-4xl font-semibold mt-2'>
              {dict.homepage.focus.title}
            </h2>
            <p className='text-zinc-800 text-3xl sm:text-5xl lg:text-7xl font-extrabold italic mt-2 tracking-tight leading-snug'>
              <span className='text-blue-background'>EquiTeam</span>{' '}
              <HighlightText text={dict.homepage.focus.text} />
            </p>
            <p className='font-light tracking-tight text-zinc-800 text-lg sm:text-2xl lg:text-3xl px-4'>
              {dict.homepage.focus.justice}
            </p>
          </div>
        </section>
        <footer className='bg-blue-background min-h-screen flex flex-col items-start gap-8 sm:gap-16 lg:gap-32 p-4 sm:p-8 lg:p-32 relative max-w-full overflow-hidden'>
          <h2 className='text-white text-4xl sm:text-6xl lg:text-9xl font-normal z-10'>
            {dict.homepage.footer.title}
          </h2>{' '}
          <div className='flex flex-col lg:flex-row items-start justify-start gap-8 lg:gap-48 text-start whitespace-pre-line z-10 w-full'>
            <h2 className='text-white text-3xl font-semibold mt-2 max-w-lg'>
              {dict.homepage.footer.description}
            </h2>
            <div className='flex flex-col items-start justify-center gap-12 max-w-4xl text-start'>
              <h2 className='text-white text-xl font-bold mt-2'>
                {dict.homepage.footer.address.title}
              </h2>
              <p className='text-white text-lg font-normal mt-2'>
                {dict.homepage.footer.address.text}
              </p>
            </div>
            <div className='flex flex-col items-start justify-start gap-12 max-w-4xl text-start'>
              <h2 className='text-white text-xl font-bold mt-2'>
                {dict.homepage.footer.contact.title}
              </h2>
              <div className='flex flex-col items-start justify-start gap-6 mt-2'>
                <div className='flex items-center gap-2'>
                  <Phone className='w-6 h-6 text-white' />
                  <p className='text-white text-lg font-normal underline mt-2'>
                    {dict.homepage.footer.contact.phone}
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <Mail className='w-6 h-6 text-white' />
                  <p className='text-white text-lg font-normal underline'>
                    {dict.homepage.footer.contact.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between text-start gap-6 mt-8 lg:mt-20 max-w-6xl z-10 w-full'>
            <Logo
              size='text-lg sm:text-2xl md:text-3xl lg:text-4xl'
              imageSize='w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14'
              className='min-w-0'
            />
            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4'>
              <p className='text-white text-sm sm:text-lg font-normal whitespace-pre-line mt-2'>
                {dict.homepage.footer.copyright}
              </p>
              {/* SocialRow: social icons row */}
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
    </>
  );
}
