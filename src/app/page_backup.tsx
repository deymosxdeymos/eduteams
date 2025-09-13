import { Mail, Phone } from 'lucide-react';
import Image from 'next/image';
import { LoginButton } from '@/components/auth/login-button';
import { LanguageSwitcher } from '@/components/dashboard/language-switcher';
import Logo from '@/components/logo';
import { SocialRow } from '@/components/ui/social-row';
import { TextRotate } from '@/components/ui/text-rotate';
import { getDictionary } from '@/i18n/get-dictionary';
import { getLocale } from '@/i18n/server';

export default async function Home() {
  const locale = await getLocale();
  const dict = await getDictionary(locale);
  return (
    <main>
      <section className='bg-blue-background min-h-screen flex flex-col pt-14'>
        {/* header */}
        <div className='relative flex items-center justify-center px-4'>
          <Logo className='justify-center' />
          <div className='absolute right-24'>
            <LanguageSwitcher current={locale} />
          </div>
        </div>

        {/* hero content */}
        <div className='flex flex-col items-center justify-center gap-6 sm:gap-8 lg:gap-10 px-4 pt-16 sm:pt-24 lg:pt-16 lg:pb-20'>
          <div className='text-center'>
            <h1 className='text-white text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-4'>
              {dict.homepage.hero.titlePrefix}{' '}
              <TextRotate
                texts={[...dict.homepage.hero.rotatingWords]}
                className='text-amber-300'
                splitBy='characters'
                staggerDuration={0.03}
                rotationInterval={2000}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              />
            </h1>
            <h1 className='text-white text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight'>
              {dict.homepage.hero.titleSuffix}
            </h1>
          </div>

          <p className='text-center text-white text-base sm:text-xl lg:text-2xl max-w-4xl'>
            {dict.homepage.hero.description}
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
          className='absolute left-0 right-0 -top-24 sm:-top-36 md:-top-42 z-0 w-full h-auto'
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
                {dict.homepage.about.title}
              </h1>
            </div>
            <div className='flex items-center justify-center text-black text-xl font normal h-full'>
              <p>{dict.homepage.about.description}</p>
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
      <section className='bg-accent min-h-screen flex flex-col items-center justify-center p-10'>
        <h1 className='text-black text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4'>
          {dict.homepage.problems.title}
        </h1>
        <p className='text-gray-900 text-base sm:text-xl lg:text-2xl text-center px-4'>
          {dict.homepage.problems.description}
        </p>
        {/* 3 problem cards row */}
        <div className='w-full max-w-5xl mx-auto mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch'>
          {/* Card 1 */}
          <div className='bg-gradient-to-b from-white to-lime-100 rounded-xl shadow-md p-6 pb-0 flex flex-col text-start overflow-hidden h-full justify-between'>
            <h1 className='text-emerald-900 font-bold text-5xl mb-1'>
              {dict.homepage.problems.problem1}
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
              {dict.homepage.problems.problem2}
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
              {dict.homepage.problems.problem3}
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
        <div className='text-center italic justify-start text-gray-900 text-3xl font-medium mt-22 whitespace-pre-line'>
          {dict.homepage.problems.solution}
        </div>
      </section>

      <section className='bg-white min-h-screen flex flex-col items-center justify-center px-10 py-18'>
        <h1 className='text-blue-background text-5xl font-extrabold mt-2'>
          {dict.homepage.solution.title}
        </h1>
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

            <div className='grid grid-cols-2 gap-4 mt-6'>
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
              {dict.homepage.solution.features.personalityMatching.title}
            </h1>
            <p className='text-gray-900 text-sm text-center font-normal'>
              {dict.homepage.solution.features.personalityMatching.description}
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
              {dict.homepage.solution.features.skillBalancing.title}
            </h1>
            <p className='text-gray-900 text-sm text-center font-normal'>
              {dict.homepage.solution.features.skillBalancing.description}
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
              {dict.homepage.solution.features.genderBalance.title}
            </h1>
            <p className='text-gray-900 text-sm text-center font-normal'>
              {dict.homepage.solution.features.genderBalance.description}
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
              {dict.homepage.solution.features.taskPreference.title}
            </h1>
            <p className='text-gray-900 text-sm text-center font-normal'>
              {dict.homepage.solution.features.taskPreference.description}
            </p>
          </div>
        </div>
      </section>
      <section className='bg-blue-background min-h-screen flex flex-col items-center px-6 py-18'>
        <h1 className='text-white text-5xl font-bold mt-2'>
          {dict.homepage.benefits.title}
        </h1>
        <p className='text-white font-normal text-base sm:text-lg lg:text-xl text-center mt-8'>
          {dict.homepage.benefits.description}
        </p>
        <div className='flex justify-center items-stretch gap-8 mt-18 max-w-6xl mx-auto'>
          {/* card 1 */}
          <div className='bg-white/10 rounded-3xl flex flex-col justify-start items-start shadow-md p-8 flex-1 min-h-[500px]'>
            <div className='bg-emerald-100 rounded-xl flex items-center justify-center mb-6 w-fit'>
              <Image
                src='/mahasiswa.svg'
                width={140}
                height={140}
                alt='Student'
                className='p-6'
              />
            </div>
            <h1 className='text-emerald-400 text-3xl font-bold mb-4'>
              {dict.homepage.benefits.forStudents.title}
            </h1>
            <ul className='text-emerald-400 text-lg font-light mt-4 space-y-3 list-disc list-inside flex-1'>
              <li>
                <span className='text-white'>
                  {dict.homepage.benefits.forStudents.benefit1}
                </span>
              </li>
              <li>
                <span className='text-white'>
                  {dict.homepage.benefits.forStudents.benefit2}
                </span>
              </li>
              <li>
                <span className='text-white'>
                  {dict.homepage.benefits.forStudents.benefit3}
                </span>
              </li>
              <li>
                <span className='text-white'>
                  {dict.homepage.benefits.forStudents.benefit4}
                </span>
              </li>
            </ul>
          </div>
          {/* card 2 */}
          <div className='bg-white/10 rounded-3xl flex flex-col justify-start items-start shadow-md p-8 flex-1 min-h-[500px]'>
            <div className='bg-amber-100 rounded-xl flex items-center justify-center mb-6 w-fit'>
              <Image
                src='/dosen.svg'
                width={140}
                height={140}
                alt='Lecturer'
                className='p-6'
              />
            </div>
            <h1 className='text-amber-400 text-3xl font-bold mb-4'>
              {dict.homepage.benefits.forLecturers.title}
            </h1>
            <ul className='text-amber-400 text-lg font-light mt-4 space-y-3 list-disc list-inside flex-1'>
              <li>
                <span className='text-white'>
                  {dict.homepage.benefits.forLecturers.benefit1}
                </span>
              </li>
              <li>
                <span className='text-white'>
                  {dict.homepage.benefits.forLecturers.benefit2}
                </span>
              </li>
              <li>
                <span className='text-white'>
                  {dict.homepage.benefits.forLecturers.benefit3}
                </span>
              </li>
              <li>
                <span className='text-white'>
                  {dict.homepage.benefits.forLecturers.benefit4}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
      <section className='bg-white min-h-[200px] flex flex-col items-center justify-center px-10 py-18'>
        <div className='flex flex-col items-center justify-center gap-18 max-w-6xl text-center'>
          <h1 className='text-zinc-800 text-4xl font-semibold mt-2'>
            {dict.homepage.focus.title}
          </h1>
          <h1 className='text-zinc-800 text-7xl font-extrabold italic mt-2 tracking-tight leading-snug'>
            <span className='text-blue-background'>EquiTeam</span>{' '}
            {dict.homepage.focus.text}
          </h1>
          <p className='font-light tracking-tight text-zinc-800 text-3xl'>
            {dict.homepage.focus.justice}
          </p>
        </div>
      </section>
      <footer className='bg-blue-background min-h-[1000px] flex flex-col items-start gap-32 p-48 pb-2 relative'>
        <h1 className='text-white text-9xl font-normal z-10'>
          {dict.homepage.footer.title}
        </h1>{' '}
        <div className='flex items-start justify-start gap-48 text-start z-10'>
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
        <div className='flex items-center justify-between text-start gap-6 mt-20 max-w-6xl z-10 w-full'>
          <Logo size='text-4xl' className='min-w-2xl' />
          <div className='flex flex-row items-center'>
            <p className='text-white text-lg font-normal min-w-sm mt-2'>
              {dict.homepage.footer.copyright}
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
