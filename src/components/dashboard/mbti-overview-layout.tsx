'use client';

import { ArrowLeft, Sparkle, X } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { SidebarData } from '@/lib/dashboard/sidebar-data';
import type { ExtendedUser } from '@/lib/types';
import { getMBTIColorScheme } from '@/lib/utils/mbti-colors';
import { getMBTIType } from '@/lib/utils/mbti-helpers';
import type { MBTIType } from '@/lib/validation/personality';
import Nav from './nav';
import Sidebar from './sidebar';

interface MBTIOverviewLayoutProps {
  user: ExtendedUser;
  isModal?: boolean;
  isCompact?: boolean;
  onRequestClose?: () => void;
  sidebarData?: SidebarData;
}

const PERSONALITY_DESCRIPTIONS = {
  ENFP: {
    title: 'The Campaigner',
    description:
      'ENFP adalah pribadi yang penuh semangat, kreatif, dan ekspresif. Mereka suka mengeksplorasi ide baru, berinteraksi dengan orang lain, dan membangun hubungan yang positif di sekitarnya. \n\n Dalam kerja kelompok, ENFP biasanya jadi penyemangat dan penghubung antar anggota. Mereka pandai memahami emosi orang lain dan terbuka untuk berdiskusi. Kehadirannya bikin tim terasa lebih hidup dan semangat.',
  },
  ENFJ: {
    title: 'The Protagonist',
    description:
      'ENFJ adalah sosok yang hangat, karismatik, dan suka mendukung orang lain berkembang. Mereka percaya bahwa kerja sama dan empati adalah kunci kesuksesan tim. Bisa dibilang, mereka punya aura pemimpin yang bersahabat.\n\nDalam kerja kelompok, ENFJ cenderung aktif mengambil peran sebagai pengarah yang membangun. Mereka pintar membaca suasana hati tim dan tahu kapan harus mendorong atau mendengarkan.',
  },
  INFP: {
    title: 'The Mediator',
    description:
      'INFP itu idealis, sensitif, dan penuh imajinasi. Mereka punya dunia batin yang kaya dan sangat peduli dengan hal-hal yang menurut mereka benar. Kadang mereka lebih fokus pada perasaan daripada logika — tapi itu kekuatan mereka.\n\nSaat bekerja dalam kelompok, INFP cenderung menjadi pendengar yang baik dan mendorong keharmonisan. Mereka mungkin nggak suka konflik, tapi akan bersuara saat ada hal yang bertentangan dengan nilai mereka.',
  },
  INFJ: {
    title: 'The Advocate',
    description:
      'INFJ dikenal bijaksana dan punya empati tinggi. Mereka sering memikirkan kesejahteraan jangka panjang, baik untuk diri sendiri maupun orang lain. Punya nilai yang kuat, INFJ suka mendukung hal-hal yang bermakna.\n\nDi kelompok, mereka sering jadi penghubung emosional antar anggota. INFJ mungkin terlihat pendiam, tapi sekali bicara — penuh makna. Mereka lebih suka mendukung dari balik layar, tapi kontribusinya terasa dalam.',
  },
  ENTJ: {
    title: 'The Commander',
    description:
      'ENTJ adalah pemimpin alami yang tegas, visioner, dan suka mengambil inisiatif. Mereka percaya diri dalam mengatur rencana, menyusun strategi, dan mengarahkan tim menuju tujuan bersama.\n\nSaat kerja kelompok, ENTJ biasanya cepat membaca situasi dan langsung ambil peran sebagai pengarah. Mereka bisa terdengar dominan, tapi tujuan utamanya adalah memastikan semua berjalan efisien dan produktif.',
  },
  ENTP: {
    title: 'The Debater',
    description:
      'ENTP penuh semangat, cepat berpikir, dan selalu punya ide seru. Mereka suka berdiskusi, menantang argumen, dan nggak takut mengutarakan pendapat. Bagi mereka, debat bukan konflik — tapi ajang eksplorasi pemikiran.\n\nDalam tim, ENTP membawa energi dinamis dan sering jadi pendorong inovasi. Walau kadang sulit fokus pada satu hal terlalu lama, ide-ide mereka bisa jadi pemicu kemajuan kalau dikombinasikan dengan eksekutor yang tepat.',
  },
  INTJ: {
    title: 'The Architect',
    description:
      'INTJ dikenal sebagai pemikir strategis yang selalu punya rencana matang. Mereka suka tantangan kompleks dan cenderung bekerja lebih baik secara independen. Fokus, logis, dan punya visi jangka panjang, mereka sering menjadi sumber solusi dalam tim.\n\nDalam kerja kelompok, INTJ biasanya berperan sebagai perencana atau analis. Meskipun kadang terlihat serius atau terlalu idealis, mereka sebenarnya sangat peduli dengan hasil dan efisiensi. Butuh ruang untuk berpikir? Mereka ahlinya.',
  },
  INTP: {
    title: 'The Thinker',
    description:
      'INTP adalah si pemikir bebas dan penuh rasa ingin tahu. Mereka suka mengeksplorasi ide-ide unik dan bisa menghabiskan waktu berjam-jam untuk memahami suatu konsep. Logis, kritis, dan suka membongkar cara kerja sesuatu.\n\nDalam tim, INTP sering muncul dengan sudut pandang baru yang nggak terpikirkan orang lain. Walau kadang terlihat di "dunia sendiri", mereka tetap berkontribusi besar lewat ide-ide cerdas dan pendekatan yang kreatif.',
  },
  ESFP: {
    title: 'The Entertainer',
    description:
      'ESFP adalah si pembawa keceriaan. Mereka suka berinteraksi, tampil, dan membuat orang lain tersenyum. Hidup bagi mereka adalah panggung — dan mereka ingin semua orang menikmati pertunjukannya.\n\nDalam kelompok, ESFP sering jadi pencair suasana. Mereka penuh semangat dan perhatian, walau kadang bisa kurang fokus pada hal teknis. Tapi kalau kamu butuh semangat, mereka selalu siap nyalain mood.',
  },
  ESTP: {
    title: 'The Entrepreneur',
    description:
      'ESTP itu energik, spontan, dan suka aksi. Mereka cenderung "terjun duluan, mikir belakangan" tapi sering berhasil karena instingnya tajam. Mereka senang jadi pusat perhatian dan nggak takut ambil risiko.\n\nDalam tim, ESTP bikin suasana jadi hidup. Mereka jago improvisasi dan bisa mengambil keputusan cepat dalam tekanan. Cocok jadi eksekutor yang fleksibel dan tahan banting.',
  },
  ISFP: {
    title: 'The Adventurer',
    description:
      'ISFP itu artistik, sensitif, dan menghargai kebebasan. Mereka suka eksplorasi hal baru, tapi cenderung melakukannya secara pribadi tanpa banyak bicara. Gaya mereka tenang, tapi penuh warna.\n\nDalam kerja kelompok, ISFP biasanya jadi pencetus ide-ide unik yang nggak biasa. Mereka mungkin nggak suka spotlight, tapi hasil kerja mereka sering mencerminkan keindahan dan kepekaan tinggi.',
  },
  ISTP: {
    title: 'The Virtuoso',
    description:
      'ISTP adalah pribadi yang tenang, logis, dan jago praktik. Mereka suka mengutak-atik, bereksperimen, dan belajar lewat pengalaman langsung. Jarang banyak teori, tapi langsung bisa paham begitu nyoba.\n\nDalam kelompok, ISTP sering ambil peran sebagai eksekutor diam-diam. Mereka nggak banyak bicara, tapi hasil kerjanya nyata. Butuh orang yang cepat dan praktis? ISTP solusinya.',
  },
  ESFJ: {
    title: 'The Consul',
    description:
      'ESFJ adalah pribadi yang supportive, organized, dan peduli dengan kesejahteraan orang lain. Mereka memiliki kemampuan untuk menciptakan lingkungan kerja yang harmonis.\n\nDalam kerja kelompok, ESFJ menjadi team coordinator yang memastikan semua anggota merasa didukung. Mereka pandai dalam komunikasi dan relationship management.',
  },
  ESTJ: {
    title: 'The Executive',
    description:
      'ESTJ adalah tipe yang tegas, suka keteraturan, dan cenderung jadi pemimpin secara alami. Mereka punya kemampuan mengatur strategi dan eksekusi dengan efektif, serta nggak ragu ambil keputusan.\n\nDalam kelompok, ESTJ sering jadi koordinator atau ketua yang memastikan semua berjalan lancar. Mereka mungkin terkesan kaku, tapi itu karena mereka ingin hasil terbaik dan nggak mau buang waktu.',
  },
  ISFJ: {
    title: 'The Protector',
    description:
      'ISFJ adalah orang yang perhatian, setia, dan sangat peduli pada kesejahteraan orang lain. Mereka cenderung pendiam namun sangat bertanggung jawab, pekerja keras, dan menghargai tradisi.\n\nDalam kelompok, mereka sering membantu secara diam-diam tanpa mengharapkan pujian. Mereka akan memastikan semua berjalan baik, bahkan jika harus mengorbankan kenyamanannya sendiri demi kebaikan bersama.',
  },
  ISTJ: {
    title: 'The Logistician',
    description:
      'ISTJ itu teliti, disiplin, dan sangat bertanggung jawab. Mereka suka hal-hal yang jelas, terstruktur, dan nggak neko-neko. Kalau ada yang bisa diandalkan untuk memastikan semuanya berjalan sesuai rencana — itu ISTJ.\n\nDi kelompok, ISTJ biasanya jadi penegak sistem dan pengingat deadline. Walaupun pendiam, mereka sangat serius soal tanggung jawab. Mereka mungkin nggak banyak bicara, tapi selalu tepat waktu dan efisien.',
  },
};

export function MBTIOverviewLayout({
  user,
  isModal = false,
  isCompact = false,
  onRequestClose,
  sidebarData,
}: MBTIOverviewLayoutProps) {
  const mbtiType = getMBTIType(user);
  const initialSelected = useMemo<MBTIType | null>(
    () => mbtiType ?? null,
    [mbtiType]
  );
  const [selectedMBTI, setSelectedMBTI] = useState<MBTIType | null>(
    initialSelected
  );

  const handleMBTIClick = (mbtiType: MBTIType) => {
    setSelectedMBTI(selectedMBTI === mbtiType ? null : mbtiType);
  };

  const handleKeyDown = (event: React.KeyboardEvent, mbtiType: MBTIType) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleMBTIClick(mbtiType);
    }
  };

  return (
    <main
      className={`${isModal ? '' : 'bg-accent px-10 py-8 h-screen'} flex flex-col overflow-hidden`}
    >
      {!isModal && (
        <div className='mb-8'>
          <Nav user={user} />
        </div>
      )}
      <div
        className={`${isModal ? '' : 'grid grid-cols-[auto_1fr] flex-1 min-h-0'}`}
      >
        {!isModal && sidebarData?.user && (
          <Sidebar
            user={sidebarData.user}
            notStartedCount={sidebarData.notStartedCount}
          />
        )}
        <div className={`${isModal ? '' : 'px-8 pb-0 min-h-0'}`}>
          <div
            className={`bg-white rounded-3xl ${isModal ? 'h-full' : 'h-full'} flex flex-col overflow-hidden ${isCompact ? 'p-6 gap-1' : 'p-4 gap-2'}`}
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                {!isModal && onRequestClose && (
                  <button
                    onClick={onRequestClose}
                    className='flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors duration-200'
                    aria-label='Go back'
                  >
                    <ArrowLeft className='w-6 h-6' />
                  </button>
                )}
                <p className='text-xl text-stone-900 font-semibold'>
                  Persebaran MBTI
                </p>
              </div>
              <Button
                variant='ghost'
                className='rounded-full'
                onClick={() => {
                  setSelectedMBTI(mbtiType ?? null);
                  onRequestClose?.();
                }}
                aria-label='Close'
              >
                <X className='w-6 h-6' />
              </Button>
            </div>
            <div className={`flex ${isCompact ? 'gap-x-2' : 'gap-x-4'} h-full`}>
              {/* mbti list stuff */}
              <div className={`flex flex-col gap-y-6 shrink-0`}>
                {/* purple */}
                <div className={`flex gap-x-3`}>
                  <div
                    onClick={() => handleMBTIClick('INTJ')}
                    onKeyDown={e => handleKeyDown(e, 'INTJ')}
                    role='button'
                    tabIndex={0}
                    aria-pressed={selectedMBTI === 'INTJ'}
                    className={`bg-violet-100 ${isCompact ? 'pt-2 pl-2' : 'pt-3 pl-2'} rounded-xl text-start relative overflow-hidden ${isCompact ? 'w-28 h-28' : 'w-30 h-30'} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-violet-600 ${
                      selectedMBTI === 'INTJ'
                        ? 'border-3 border-violet-600'
                        : 'border-3 border-transparent'
                    }`}
                  >
                    <p
                      className={`text-violet-600 ${isCompact ? 'text-2xl' : 'text-3xl'} font-bold z-10 relative`}
                    >
                      INTJ
                    </p>
                    <Image
                      src='/mbti-list/INTJ.svg'
                      alt='INTJ'
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className='absolute -right-1 -bottom-1 z-0'
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick('INTP')}
                    onKeyDown={e => handleKeyDown(e, 'INTP')}
                    role='button'
                    tabIndex={0}
                    aria-pressed={selectedMBTI === 'INTP'}
                    className={`bg-violet-100 ${isCompact ? 'pt-2 pl-2' : 'pt-3 pl-2'} rounded-xl text-start relative overflow-hidden ${isCompact ? 'w-28 h-28' : 'w-30 h-30'} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-violet-600 ${
                      selectedMBTI === 'INTP'
                        ? 'border-3 border-violet-600'
                        : 'border-3 border-transparent'
                    }`}
                  >
                    <p
                      className={`text-violet-600 ${isCompact ? 'text-2xl' : 'text-3xl'} font-bold z-10 relative`}
                    >
                      INTP
                    </p>
                    <Image
                      src='/mbti-list/INTP.svg'
                      alt='INTP'
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className='absolute -right-1 -bottom-1 z-0'
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick('ENTJ')}
                    onKeyDown={e => handleKeyDown(e, 'ENTJ')}
                    role='button'
                    tabIndex={0}
                    aria-pressed={selectedMBTI === 'ENTJ'}
                    className={`bg-violet-100 ${isCompact ? 'pt-2 pl-2' : 'pt-3 pl-2'} rounded-xl text-start relative overflow-hidden ${isCompact ? 'w-28 h-28' : 'w-30 h-30'} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-violet-600 ${
                      selectedMBTI === 'ENTJ'
                        ? 'border-3 border-violet-600'
                        : 'border-3 border-transparent'
                    }`}
                  >
                    <p
                      className={`text-violet-600 ${isCompact ? 'text-2xl' : 'text-3xl'} font-bold z-10 relative`}
                    >
                      ENTJ
                    </p>
                    <Image
                      src='/mbti-list/ENTJ.svg'
                      alt='ENTJ'
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className='absolute -right-1 -bottom-1 z-0'
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick('ENTP')}
                    onKeyDown={e => handleKeyDown(e, 'ENTP')}
                    role='button'
                    tabIndex={0}
                    aria-pressed={selectedMBTI === 'ENTP'}
                    className={`bg-violet-100 ${isCompact ? 'pt-2 pl-2' : 'pt-3 pl-2'} rounded-xl text-start relative overflow-hidden ${isCompact ? 'w-28 h-28' : 'w-30 h-30'} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-violet-600 ${
                      selectedMBTI === 'ENTP'
                        ? 'border-3 border-violet-600'
                        : 'border-3 border-transparent'
                    }`}
                  >
                    <p
                      className={`text-violet-600 ${isCompact ? 'text-2xl' : 'text-3xl'} font-bold z-10 relative`}
                    >
                      ENTP
                    </p>
                    <Image
                      src='/mbti-list/ENTP.svg'
                      alt='ENTP'
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className='absolute -right-1 -bottom-1 z-0'
                    />
                  </div>
                </div>
                {/* green */}
                <div className={`flex ${isCompact ? 'gap-x-2' : 'gap-x-3'}`}>
                  <div
                    onClick={() => handleMBTIClick('INFJ')}
                    onKeyDown={e => handleKeyDown(e, 'INFJ')}
                    role='button'
                    tabIndex={0}
                    aria-pressed={selectedMBTI === 'INFJ'}
                    className={`bg-green-100 ${isCompact ? 'pt-2 pl-2' : 'pt-3 pl-2'} rounded-xl text-start relative overflow-hidden ${isCompact ? 'w-28 h-28' : 'w-30 h-30'} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-green-600 ${
                      selectedMBTI === 'INFJ'
                        ? 'border-3 border-emerald-600'
                        : 'border-3 border-transparent'
                    }`}
                  >
                    <p
                      className={`text-green-600 ${isCompact ? 'text-2xl' : 'text-3xl'} font-bold z-10 relative`}
                    >
                      INFJ
                    </p>
                    <Image
                      src='/mbti-list/INFJ.svg'
                      alt='INFJ'
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className='absolute -right-1 -bottom-1 z-0'
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick('INFP')}
                    onKeyDown={e => handleKeyDown(e, 'INFP')}
                    role='button'
                    tabIndex={0}
                    aria-pressed={selectedMBTI === 'INFP'}
                    className={`bg-green-100 ${isCompact ? 'pt-2 pl-2' : 'pt-3 pl-2'} rounded-xl text-start relative overflow-hidden ${isCompact ? 'w-28 h-28' : 'w-30 h-30'} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-green-600 ${
                      selectedMBTI === 'INFP'
                        ? 'border-3 border-emerald-600'
                        : 'border-3 border-transparent'
                    }`}
                  >
                    <p
                      className={`text-green-600 ${isCompact ? 'text-2xl' : 'text-3xl'} font-bold z-10 relative`}
                    >
                      INFP
                    </p>
                    <Image
                      src='/mbti-list/INFP.svg'
                      alt='INFP'
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className='absolute -right-1 -bottom-1 z-0'
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick('ENFJ')}
                    onKeyDown={e => handleKeyDown(e, 'ENFJ')}
                    role='button'
                    tabIndex={0}
                    aria-pressed={selectedMBTI === 'ENFJ'}
                    className={`bg-green-100 ${isCompact ? 'pt-2 pl-2' : 'pt-3 pl-2'} rounded-xl text-start relative overflow-hidden ${isCompact ? 'w-28 h-28' : 'w-30 h-30'} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-green-600 ${
                      selectedMBTI === 'ENFJ'
                        ? 'border-3 border-emerald-600'
                        : 'border-3 border-transparent'
                    }`}
                  >
                    <p
                      className={`text-green-600 ${isCompact ? 'text-2xl' : 'text-3xl'} font-bold z-10 relative`}
                    >
                      ENFJ
                    </p>
                    <Image
                      src='/mbti-list/ENFJ.svg'
                      alt='ENFJ'
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className='absolute -right-1 -bottom-1 z-0'
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick('ENFP')}
                    onKeyDown={e => handleKeyDown(e, 'ENFP')}
                    role='button'
                    tabIndex={0}
                    aria-pressed={selectedMBTI === 'ENFP'}
                    className={`bg-green-100 ${isCompact ? 'pt-2 pl-2' : 'pt-3 pl-2'} rounded-xl text-start relative overflow-hidden ${isCompact ? 'w-28 h-28' : 'w-30 h-30'} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-green-600 ${
                      selectedMBTI === 'ENFP'
                        ? 'border-3 border-emerald-600'
                        : 'border-3 border-transparent'
                    }`}
                  >
                    <p
                      className={`text-green-600 ${isCompact ? 'text-2xl' : 'text-3xl'} font-bold z-10 relative`}
                    >
                      ENFP
                    </p>
                    <Image
                      src='/mbti-list/ENFP.svg'
                      alt='ENFP'
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className='absolute -right-1 -bottom-1 z-0'
                    />
                  </div>
                </div>
                {/* blue */}
                <div className={`flex ${isCompact ? 'gap-x-2' : 'gap-x-3'}`}>
                  <div
                    onClick={() => handleMBTIClick('ISTJ')}
                    onKeyDown={e => handleKeyDown(e, 'ISTJ')}
                    role='button'
                    tabIndex={0}
                    aria-pressed={selectedMBTI === 'ISTJ'}
                    className={`bg-blue-100 ${isCompact ? 'pt-2 pl-2' : 'pt-3 pl-2'} rounded-xl text-start relative overflow-hidden ${isCompact ? 'w-28 h-28' : 'w-30 h-30'} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-blue-600 ${
                      selectedMBTI === 'ISTJ'
                        ? 'border-3 border-sky-600'
                        : 'border-3 border-transparent'
                    }`}
                  >
                    <p
                      className={`text-blue-600 ${isCompact ? 'text-2xl' : 'text-3xl'} font-bold z-10 relative`}
                    >
                      ISTJ
                    </p>
                    <Image
                      src='/mbti-list/ISTJ.svg'
                      alt='ISTJ'
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className='absolute -right-1 -bottom-1 z-0'
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick('ISFJ')}
                    onKeyDown={e => handleKeyDown(e, 'ISFJ')}
                    role='button'
                    tabIndex={0}
                    aria-pressed={selectedMBTI === 'ISFJ'}
                    className={`bg-blue-100 ${isCompact ? 'pt-2 pl-2' : 'pt-3 pl-2'} rounded-xl text-start relative overflow-hidden ${isCompact ? 'w-28 h-28' : 'w-30 h-30'} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-blue-600 ${
                      selectedMBTI === 'ISFJ'
                        ? 'border-3 border-sky-600'
                        : 'border-3 border-transparent'
                    }`}
                  >
                    <p
                      className={`text-blue-600 ${isCompact ? 'text-2xl' : 'text-3xl'} font-bold z-10 relative`}
                    >
                      ISFJ
                    </p>
                    <Image
                      src='/mbti-list/ISFJ.svg'
                      alt='ISFJ'
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className='absolute -right-1 -bottom-1 z-0'
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick('ESTJ')}
                    onKeyDown={e => handleKeyDown(e, 'ESTJ')}
                    role='button'
                    tabIndex={0}
                    aria-pressed={selectedMBTI === 'ESTJ'}
                    className={`bg-blue-100 ${isCompact ? 'pt-2 pl-2' : 'pt-3 pl-2'} rounded-xl text-start relative overflow-hidden ${isCompact ? 'w-28 h-28' : 'w-30 h-30'} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-blue-600 ${
                      selectedMBTI === 'ESTJ'
                        ? 'border-3 border-sky-600'
                        : 'border-3 border-transparent'
                    }`}
                  >
                    <p
                      className={`text-blue-600 ${isCompact ? 'text-2xl' : 'text-3xl'} font-bold z-10 relative`}
                    >
                      ESTJ
                    </p>
                    <Image
                      src='/mbti-list/ESTJ.svg'
                      alt='ESTJ'
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className='absolute -right-1 -bottom-1 z-0'
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick('ESFJ')}
                    onKeyDown={e => handleKeyDown(e, 'ESFJ')}
                    role='button'
                    tabIndex={0}
                    aria-pressed={selectedMBTI === 'ESFJ'}
                    className={`bg-blue-100 ${isCompact ? 'pt-2 pl-2' : 'pt-3 pl-2'} rounded-xl text-start relative overflow-hidden ${isCompact ? 'w-28 h-28' : 'w-30 h-30'} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-blue-600 ${
                      selectedMBTI === 'ESFJ'
                        ? 'border-3 border-sky-600'
                        : 'border-3 border-transparent'
                    }`}
                  >
                    <p
                      className={`text-blue-600 ${isCompact ? 'text-2xl' : 'text-3xl'} font-bold z-10 relative`}
                    >
                      ESFJ
                    </p>
                    <Image
                      src='/mbti-list/ESFJ.svg'
                      alt='ESFJ'
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className='absolute -right-1 -bottom-1 z-0'
                    />
                  </div>
                </div>
                {/* amber */}
                <div className='flex gap-x-2'>
                  <div
                    onClick={() => handleMBTIClick('ISTP')}
                    onKeyDown={e => handleKeyDown(e, 'ISTP')}
                    role='button'
                    tabIndex={0}
                    aria-pressed={selectedMBTI === 'ISTP'}
                    className={`bg-orange-100 ${isCompact ? 'pt-2 pl-2' : 'pt-3 pl-2'} rounded-xl text-start relative overflow-hidden ${isCompact ? 'w-28 h-28' : 'w-30 h-30'} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-orange-600 ${
                      selectedMBTI === 'ISTP'
                        ? 'border-3 border-amber-600'
                        : 'border-3 border-transparent'
                    }`}
                  >
                    <p
                      className={`text-orange-600 ${isCompact ? 'text-2xl' : 'text-3xl'} font-bold z-10 relative`}
                    >
                      ISTP
                    </p>
                    <Image
                      src='/mbti-list/ISTP.svg'
                      alt='ISTP'
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className='absolute -right-1 -bottom-1 z-0'
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick('ISFP')}
                    onKeyDown={e => handleKeyDown(e, 'ISFP')}
                    role='button'
                    tabIndex={0}
                    aria-pressed={selectedMBTI === 'ISFP'}
                    className={`bg-orange-100 ${isCompact ? 'pt-2 pl-2' : 'pt-3 pl-2'} rounded-xl text-start relative overflow-hidden ${isCompact ? 'w-28 h-28' : 'w-30 h-30'} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-orange-600 ${
                      selectedMBTI === 'ISFP'
                        ? 'border-3 border-amber-600'
                        : 'border-3 border-transparent'
                    }`}
                  >
                    <p
                      className={`text-orange-600 ${isCompact ? 'text-2xl' : 'text-3xl'} font-bold z-10 relative`}
                    >
                      ISFP
                    </p>
                    <Image
                      src='/mbti-list/ISFP.svg'
                      alt='ISFP'
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className='absolute -right-1 -bottom-1 z-0'
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick('ESTP')}
                    onKeyDown={e => handleKeyDown(e, 'ESTP')}
                    role='button'
                    tabIndex={0}
                    aria-pressed={selectedMBTI === 'ESTP'}
                    className={`bg-orange-100 ${isCompact ? 'pt-2 pl-2' : 'pt-3 pl-2'} rounded-xl text-start relative overflow-hidden ${isCompact ? 'w-28 h-28' : 'w-30 h-30'} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-orange-600 ${
                      selectedMBTI === 'ESTP'
                        ? 'border-3 border-amber-600'
                        : 'border-3 border-transparent'
                    }`}
                  >
                    <p
                      className={`text-orange-600 ${isCompact ? 'text-2xl' : 'text-3xl'} font-bold z-10 relative`}
                    >
                      ESTP
                    </p>
                    <Image
                      src='/mbti-list/ESTP.svg'
                      alt='ESTP'
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className='absolute -right-1 -bottom-1 z-0'
                    />
                  </div>
                  <div
                    onClick={() => handleMBTIClick('ESFP')}
                    onKeyDown={e => handleKeyDown(e, 'ESFP')}
                    role='button'
                    tabIndex={0}
                    aria-pressed={selectedMBTI === 'ESFP'}
                    className={`bg-orange-100 ${isCompact ? 'pt-2 pl-2' : 'pt-3 pl-2'} rounded-xl text-start relative overflow-hidden ${isCompact ? 'w-28 h-28' : 'w-30 h-30'} cursor-pointer border-3 transition-colors duration-200 [@media(hover:hover)_and_(pointer:fine)]:hover:border-orange-600 ${
                      selectedMBTI === 'ESFP'
                        ? 'border-3 border-amber-600'
                        : 'border-3 border-transparent'
                    }`}
                  >
                    <p
                      className={`text-orange-600 ${isCompact ? 'text-2xl' : 'text-3xl'} font-bold z-10 relative`}
                    >
                      ESFP
                    </p>
                    <Image
                      src='/mbti-list/ESFP.svg'
                      alt='ESFP'
                      width={isCompact ? 90 : 100}
                      height={isCompact ? 90 : 100}
                      className='absolute -right-1 -bottom-1 z-0'
                    />
                  </div>
                </div>
              </div>
              {/* mbti display area */}
              <div className='flex flex-col gap-4 flex-1 h-full overflow-y-auto'>
                {selectedMBTI ? (
                  <>
                    <div
                      className={`flex items-center justify-center border ${getMBTIColorScheme(selectedMBTI).lightBorder} rounded-xl shadow-glow ${getMBTIColorScheme(selectedMBTI).lightShadow} px-4 py-3 w-full h-20`}
                    >
                      <Sparkle
                        className={`${getMBTIColorScheme(selectedMBTI).primaryText} rounded-md w-16 h-10 py-[1px] shrink-0`}
                        size={14}
                        fill='currentColor'
                      />
                      <div className='flex items-center justify-center'>
                        <Image
                          src={`/mbti-text/${selectedMBTI}.svg`}
                          alt={selectedMBTI}
                          width={140}
                          height={45}
                          className='max-w-full max-h-full object-contain'
                        />
                      </div>
                      <Sparkle
                        className={`${getMBTIColorScheme(selectedMBTI).primaryText} rounded-md w-16 h-10 py-[1px] shrink-0`}
                        size={14}
                        fill='currentColor'
                      />
                    </div>
                    <div className='flex justify-center w-full h-48'>
                      <div className='flex items-center justify-center w-48 h-48'>
                        <Image
                          src={`/mbti-type/${selectedMBTI}.svg`}
                          alt={selectedMBTI}
                          width={200}
                          height={200}
                          className='max-w-full max-h-full object-contain'
                        />
                      </div>
                    </div>
                    <div className='flex-1 flex flex-col min-h-0'>
                      <div
                        className={`flex flex-col text-start border ${getMBTIColorScheme(selectedMBTI).lightBorder} rounded-xl shadow-glow ${getMBTIColorScheme(selectedMBTI).lightShadow} p-4 gap-4 flex-1 self-stretch`}
                      >
                        <h1
                          className={`text-3xl font-bold ${getMBTIColorScheme(selectedMBTI).primaryText}`}
                        >
                          {PERSONALITY_DESCRIPTIONS[selectedMBTI]?.title ||
                            'Unknown Type'}
                        </h1>
                        <p className='text-sm text-black font-normal text-justify whitespace-pre-line'>
                          {PERSONALITY_DESCRIPTIONS[selectedMBTI]
                            ?.description ||
                            'No description available for this personality type.'}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  // Auto-select user's MBTI when available; fallback shows nothing extra
                  <div className='flex-1' />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
