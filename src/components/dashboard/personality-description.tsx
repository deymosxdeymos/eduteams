'use client';

import type { ExtendedUser } from '@/lib/types';
import { getMBTIColorScheme } from '@/lib/utils/mbti-colors';
import { getMBTIType } from '@/lib/utils/mbti-helpers';

interface PersonalityDescriptionProps {
  user: ExtendedUser;
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

export function PersonalityDescription({ user }: PersonalityDescriptionProps) {
  const mbtiType = getMBTIType(user);
  const colorScheme = getMBTIColorScheme(mbtiType);

  // Don't show anything if user doesn't have an MBTI type
  if (!mbtiType) {
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

  const personality = PERSONALITY_DESCRIPTIONS[mbtiType];

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
