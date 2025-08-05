'use client';

import type { ExtendedUser } from '@/lib/types';
import { getMBTIColorScheme } from '@/lib/utils/mbti-colors';

interface PersonalityDescriptionProps {
  user: ExtendedUser;
}

const PERSONALITY_DESCRIPTIONS = {
  ENFP: {
    title: 'The Campaigner',
    description:
      'ENFP adalah pribadi yang penuh semangat, kreatif, dan ekspresif. Mereka suka mengeksplorasi ide baru, berinteraksi dengan orang lain, dan membangun hubungan yang positif di sekitarnya.\n\nDalam kerja kelompok, ENFP biasanya jadi penyemangat dan penghubung antar anggota. Mereka pandai memahami emosi orang lain dan terbuka untuk berdiskusi. Kehadirannya bikin tim terasa lebih hidup dan semangat.',
  },
  ENFJ: {
    title: 'The Protagonist',
    description:
      'ENFJ adalah pemimpin natural yang inspiratif dan penuh empati. Mereka memiliki kemampuan untuk memotivasi dan mempengaruhi orang lain dengan cara yang positif.\n\nDalam kerja kelompok, ENFJ sering menjadi koordinator yang memastikan semua anggota terlibat dan merasa dihargai. Mereka pandai melihat potensi dalam diri orang lain.',
  },
  INFP: {
    title: 'The Mediator',
    description:
      'INFP adalah pribadi yang idealis, kreatif, dan memiliki nilai-nilai yang kuat. Mereka sering menjadi peacemaker dalam konflik dan sangat menghargai autentisitas.\n\nDalam kerja kelompok, INFP memberikan perspektif unik dan membantu menjaga harmoni tim. Mereka bekerja dengan penuh dedikasi ketika percaya pada misi tim.',
  },
  INFJ: {
    title: 'The Advocate',
    description:
      'INFJ adalah pribadi yang visioner, intuitif, dan memiliki pemahaman mendalam tentang orang lain. Mereka sering memiliki ide-ide inovatif untuk memecahkan masalah.\n\nDalam kerja kelompok, INFJ menjadi strategic thinker yang membantu tim melihat gambaran besar. Mereka pandai memahami dinamika kelompok dan memberikan solusi kreatif.',
  },
  ENTJ: {
    title: 'The Commander',
    description:
      'ENTJ adalah pemimpin natural yang tegas, strategis, dan berorientasi pada hasil. Mereka memiliki kemampuan untuk mengorganisir dan mengarahkan tim menuju tujuan.\n\nDalam kerja kelompok, ENTJ sering menjadi project leader yang memastikan tim tetap fokus dan produktif. Mereka pandai dalam perencanaan dan pengambilan keputusan.',
  },
  ENTP: {
    title: 'The Debater',
    description:
      'ENTP adalah pribadi yang inovatif, argumentatif, dan suka tantangan intelektual. Mereka memiliki kemampuan untuk melihat berbagai kemungkinan dan solusi kreatif.\n\nDalam kerja kelompok, ENTP menjadi brainstormer yang menghadirkan ide-ide segar dan perspektif berbeda. Mereka pandai dalam problem-solving dan adaptasi.',
  },
  INTJ: {
    title: 'The Architect',
    description:
      'INTJ adalah strategic thinker yang independen, analitis, dan memiliki visi jangka panjang. Mereka pandai dalam merancang sistem dan solusi yang efisien.\n\nDalam kerja kelompok, INTJ menjadi planner yang membantu tim mengembangkan strategi jangka panjang. Mereka memberikan analisis mendalam dan pemikiran sistematis.',
  },
  INTP: {
    title: 'The Thinker',
    description:
      'INTP adalah pribadi yang analitis, logis, dan suka mengeksplorasi teori. Mereka memiliki kemampuan untuk memahami sistem kompleks dan menemukan solusi inovatif.\n\nDalam kerja kelompok, INTP menjadi problem solver yang memberikan analisis objektif dan solusi teknis. Mereka pandai dalam research dan troubleshooting.',
  },
  ESFP: {
    title: 'The Entertainer',
    description:
      'ESFP adalah pribadi yang energik, spontan, dan suka berinteraksi dengan orang lain. Mereka memiliki kemampuan untuk menciptakan suasana yang menyenangkan dan positif.\n\nDalam kerja kelompok, ESFP menjadi motivator yang menjaga semangat tim tetap tinggi. Mereka pandai dalam adaptasi dan membangun hubungan interpersonal.',
  },
  ESTP: {
    title: 'The Entrepreneur',
    description:
      'ESTP adalah pribadi yang action-oriented, pragmatis, dan suka tantangan. Mereka memiliki kemampuan untuk mengambil keputusan cepat dan beradaptasi dengan situasi baru.\n\nDalam kerja kelompok, ESTP menjadi executor yang memastikan rencana dijalankan dengan efektif. Mereka pandai dalam crisis management dan quick decisions.',
  },
  ISFP: {
    title: 'The Adventurer',
    description:
      'ISFP adalah pribadi yang artistik, fleksibel, dan menghargai kebebasan. Mereka memiliki kemampuan untuk memberikan perspektif kreatif dan solusi out-of-the-box.\n\nDalam kerja kelompok, ISFP menjadi creative contributor yang memberikan ide-ide unik. Mereka bekerja dengan baik dalam lingkungan yang mendukung dan tidak hierarkis.',
  },
  ISTP: {
    title: 'The Virtuoso',
    description:
      'ISTP adalah pribadi yang praktis, independent, dan hands-on. Mereka memiliki kemampuan untuk memahami cara kerja sistem dan menemukan solusi praktis.\n\nDalam kerja kelompok, ISTP menjadi technical expert yang membantu implementasi solusi. Mereka pandai dalam troubleshooting dan optimization.',
  },
  ESFJ: {
    title: 'The Consul',
    description:
      'ESFJ adalah pribadi yang supportive, organized, dan peduli dengan kesejahteraan orang lain. Mereka memiliki kemampuan untuk menciptakan lingkungan kerja yang harmonis.\n\nDalam kerja kelompok, ESFJ menjadi team coordinator yang memastikan semua anggota merasa didukung. Mereka pandai dalam komunikasi dan relationship management.',
  },
  ESTJ: {
    title: 'The Executive',
    description:
      'ESTJ adalah pribadi yang organized, efficient, dan berorientasi pada hasil. Mereka memiliki kemampuan untuk mengelola proyek dan memastikan deadline terpenuhi.\n\nDalam kerja kelompok, ESTJ menjadi project manager yang memastikan tim bekerja dengan struktur yang jelas. Mereka pandai dalam planning dan resource management.',
  },
  ISFJ: {
    title: 'The Protector',
    description:
      'ISFJ adalah pribadi yang reliable, supportive, dan detail-oriented. Mereka memiliki kemampuan untuk memberikan dukungan konsisten dan memperhatikan kebutuhan anggota tim.\n\nDalam kerja kelompok, ISFJ menjadi support system yang memastikan semua detail terperhatikan. Mereka pandai dalam documentation dan quality assurance.',
  },
  ISTJ: {
    title: 'The Logistician',
    description:
      'ISTJ adalah pribadi yang methodical, responsible, dan dapat diandalkan. Mereka memiliki kemampuan untuk mengelola tugas dengan sistematis dan memastikan kualitas hasil.\n\nDalam kerja kelompok, ISTJ menjadi backbone yang memastikan semua proses berjalan sesuai standar. Mereka pandai dalam planning dan quality control.',
  },
};

export function PersonalityDescription({ user }: PersonalityDescriptionProps) {
  const colorScheme = getMBTIColorScheme(user.mbtiType);

  // Debug logging
  console.log('PersonalityDescription:', {
    userMbtiType: user.mbtiType,
    userMbtiTypeType: typeof user.mbtiType,
    hasPersonality: !!user.mbtiType,
  });

  // Don't show anything if user doesn't have an MBTI type
  if (!user.mbtiType) {
    return (
      <div
        className={`flex flex-col text-start border ${colorScheme.lightBorder} rounded-xl shadow-glow ${colorScheme.lightShadow} p-4 gap-4 flex-1 self-stretch`}
      >
        <h1 className={`text-3xl font-bold ${colorScheme.primaryText}`}>
          Complete Your Test
        </h1>
        <p className='text-xs text-black font-normal text-justify'>
          Complete your personality test to see your detailed personality
          description and team collaboration insights.
        </p>
      </div>
    );
  }

  const personality = PERSONALITY_DESCRIPTIONS[user.mbtiType];

  // Debug logging for found personality
  console.log('PersonalityDescription found:', {
    mbtiType: user.mbtiType,
    personalityTitle: personality?.title,
    hasPersonality: !!personality,
  });

  return (
    <div
      className={`flex flex-col text-start border ${colorScheme.lightBorder} rounded-xl shadow-glow ${colorScheme.lightShadow} p-4 gap-4 flex-1 self-stretch`}
    >
      <h1 className={`text-3xl font-bold ${colorScheme.primaryText}`}>
        {personality?.title || 'Unknown Type'}
      </h1>
      <p className='text-xs text-black font-normal text-justify whitespace-pre-line'>
        {personality?.description ||
          'No description available for this personality type.'}
      </p>
    </div>
  );
}
