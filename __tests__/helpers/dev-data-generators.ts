import type { MBTIType, Gender } from '@/generated/prisma';

export interface PersonalityScores {
  ei: number;
  sn: number;
  tf: number;
  pj: number;
}

export interface AnswerRecord {
  [questionId: string]: number;
}

export interface SkillAssignment {
  skillId: string;
  level: number;
}

const indonesianNames = {
  male: [
    'Ahmad Rizki',
    'Budi Santoso',
    'Cahyo Prabowo',
    'Dimas Setiawan',
    'Eko Prasetyo',
    'Fajar Nugroho',
    'Gani Wijaya',
    'Hendra Gunawan',
    'Irfan Hakim',
    'Joko Widodo',
    'Kusuma Wardana',
    'Lukman Hakim',
    'Muhammad Fadli',
    'Nanda Pratama',
    'Omar Hakim',
    'Prasetyo Wibowo',
    'Rizky Hidayat',
    'Surya Putra',
    'Teguh Prasetya',
    'Umar Bakri',
    'Viktor Santoso',
    'Wahyu Hidayat',
    'Yudi Pratama',
    'Zainal Abidin',
  ],
  female: [
    'Siti Nurhaliza',
    'Dewi Lestari',
    'Ratna Sari',
    'Maya Anggraini',
    'Fitri Handayani',
    'Indah Permata',
    'Citra Kirana',
    'Sarah Amelia',
    'Nadia Putri',
    'Rina Susanti',
    'Diana Kartika',
    'Lisa Permata',
    'Maya Sari',
    'Fitria Dewi',
    'Citra Sari',
    'Ratna Dewi',
    'Siti Aminah',
    'Nurul Hidayah',
    'Diana Putri',
    'Sarah Wijaya',
    'Maya Permata',
    'Indah Sari',
    'Rina Permata',
  ],
};

const mbtiTypes: MBTIType[] = [
  'INTJ',
  'INTP',
  'ENTJ',
  'ENTP',
  'INFJ',
  'INFP',
  'ENFJ',
  'ENFP',
  'ISTJ',
  'ISTP',
  'ESTJ',
  'ESTP',
  'ISFJ',
  'ISFP',
  'ESFJ',
  'ESFP',
];

export function generateIndonesianName(gender: Gender): string {
  const names = gender === 'MALE' ? indonesianNames.male : indonesianNames.female;
  return names[Math.floor(Math.random() * names.length)];
}

export function generateNIM(sequence: number): string {
  const year = new Date().getFullYear();
  const paddedSequence = sequence.toString().padStart(4, '0');
  return `${year}${paddedSequence}`;
}

export function generatePersonalityScores(): PersonalityScores {
  return {
    ei: Math.random() * 2 - 1, // -1 to 1
    sn: Math.random() * 2 - 1, // -1 to 1
    tf: Math.random() * 2 - 1, // -1 to 1
    pj: Math.random() * 2 - 1, // -1 to 1
  };
}

export function generateBalancedMBTI(index: number, total: number): MBTIType {
  // Distribute MBTI types evenly across all students
  const typeIndex = Math.floor((index / total) * mbtiTypes.length);
  return mbtiTypes[typeIndex];
}

export function getMBTIType(scores: PersonalityScores): MBTIType {
  const ei = scores.ei >= 0 ? 'E' : 'I';
  const sn = scores.sn >= 0 ? 'N' : 'S';
  const tf = scores.tf >= 0 ? 'F' : 'T';
  const pj = scores.pj >= 0 ? 'P' : 'J';
  
  const mbtiString = `${ei}${sn}${tf}${pj}` as MBTIType;
  return mbtiTypes.includes(mbtiString) ? mbtiString : 'INTJ';
}

/**
 * Generate personality scores that match a specific MBTI type
 * Ensures consistency between mbtiType and raw scores
 */
export function generateScoresForMBTI(mbtiType: MBTIType): PersonalityScores {
  // Parse MBTI string
  const [e_i, s_n, t_f, j_p] = mbtiType.split('');
  
  // Generate scores that match the type with some variance (0.3 to 1.0)
  const variance = () => Math.random() * 0.7 + 0.3;
  
  return {
    ei: e_i === 'E' ? variance() : -variance(),
    sn: s_n === 'N' ? variance() : -variance(),
    tf: t_f === 'F' ? variance() : -variance(),
    pj: j_p === 'P' ? variance() : -variance(),
  };
}

export function generateMBTIResponses(
  scores: PersonalityScores,
  questionIds: string[]
): AnswerRecord {
  const responses: AnswerRecord = {};

  // Generate responses for all questions (typically 82)
  questionIds.forEach((questionId, index) => {
    // Generate responses that are consistent with personality scores
    let response = Math.floor(Math.random() * 5) + 1; // 1-5 scale

    // Adjust responses based on personality scores
    // These ranges are approximate based on typical OJTS structure
    if (index < 20) {
      // EI questions (0-19)
      response =
        scores.ei > 0
          ? Math.floor(Math.random() * 2) + 4 // 4-5 for extroverts
          : Math.floor(Math.random() * 2) + 1; // 1-2 for introverts
    } else if (index < 40) {
      // SN questions (20-39)
      response =
        scores.sn > 0
          ? Math.floor(Math.random() * 2) + 4 // 4-5 for sensing
          : Math.floor(Math.random() * 2) + 1; // 1-2 for intuitive
    } else if (index < 60) {
      // TF questions (40-59)
      response =
        scores.tf > 0
          ? Math.floor(Math.random() * 2) + 4 // 4-5 for thinking
          : Math.floor(Math.random() * 2) + 1; // 1-2 for feeling
    } else if (index < questionIds.length - 1) {
      // PJ questions (60 to second-to-last)
      response =
        scores.pj > 0
          ? Math.floor(Math.random() * 2) + 4 // 4-5 for judging
          : Math.floor(Math.random() * 2) + 1; // 1-2 for perceiving
    } else {
      // Attention check (last question)
      response = 4; // Must be 4 for attention check to pass
    }

    responses[questionId] = response;
  });

  return responses;
}

// All available skill IDs from the database
const SKILL_IDS = [
  "9f030e3d-abab-4d99-aeae-823d5ef6959e", // Rust
  "eb5fdd35-8798-4930-85ec-74973e1bc70c", // Linux
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890", // JavaScript
  "b2c3d4e5-f6a7-8901-bcde-f12345678901", // Python
];

export function generateRandomSkills(count: number): SkillAssignment[] {
  const skills: SkillAssignment[] = [];
  const availableIds = [...SKILL_IDS];
  
  for (let i = 0; i < count && availableIds.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableIds.length);
    const skillId = availableIds.splice(randomIndex, 1)[0];
    skills.push({
      skillId,
      level: Math.random() * 0.6 + 0.3, // 0.3 to 0.9
    });
  }
  
  return skills;
}

export function generateRandomGender(): Gender {
  return Math.random() > 0.5 ? 'MALE' : 'FEMALE';
}

export function generateEmail(baseName: string, index: number): string {
  const timestamp = Date.now();
  return `dev-student-${timestamp}-${index}-${baseName.toLowerCase().replace(/\s+/g, '-')}@eduteams.local`;
}