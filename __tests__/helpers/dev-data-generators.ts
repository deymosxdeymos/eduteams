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
  const sn = scores.sn >= 0 ? 'S' : 'N';
  const tf = scores.tf >= 0 ? 'T' : 'F';
  const pj = scores.pj >= 0 ? 'J' : 'P';
  
  const mbtiString = `${ei}${sn}${tf}${pj}` as MBTIType;
  return mbtiTypes.includes(mbtiString) ? mbtiString : 'INTJ';
}

// Real question IDs from the database (OJTS v4 has 81 questions)
const QUESTION_IDS = [
  "0196b4da-61b4-4b1a-8919-e928c24dfea0", "01c58828-2170-43b6-94fe-13afb9b720bf", "07dbacbc-aede-4ce3-a346-56d7e674cc3a",
  "0828973e-34f0-4701-bdd0-43638585b340", "0fc01b20-5781-40b2-99fc-de70ae56efef", "126622e0-216e-4019-8f21-637280fcc1e9",
  "148e1ea9-804f-48af-88f8-eca829c0ca26", "1497e240-5942-4b68-a4ff-2fa358b6b63e", "1aa9c519-ac41-40a1-bfd7-437bf3959b83",
  "1ec8e968-6a0c-4e98-b68f-7538ac4d79a0", "1ee28205-ec10-4305-93b9-243c0d29737e", "232bc4be-0fc7-41b2-b079-34016c59a058",
  "268cc02c-ba48-43ca-be86-e16dea1083c6", "2b1f5d4d-d451-4660-afb3-318bc81b44e1", "2ba81ec4-f7c0-4736-affa-6dbc87d437a7",
  "2ca304f9-b496-45ed-afa5-6767401545ef", "2e30afe7-c947-469c-8c52-9827375a2534", "2f4e2ca5-e269-4f90-92b3-8164692d9c89",
  "368704c5-fa08-4cf3-95a8-5ee79daa2eff", "38d884e4-d036-42b4-8aab-e1f6ed2cbde3", "38e5489e-d484-497f-98c8-f57d68a5de9c",
  "3acff6cd-e315-46af-9d76-37f812733416", "3af46f81-ca96-4b77-8d54-a971c29c7322", "3fb5257d-509e-4ce3-acfe-63b26d9c228a",
  "40b29178-9194-47f5-a821-c758c4af3758", "45618aee-4cb7-44e4-aef8-523b99d82cc0", "48511d28-c0a7-4dbe-96ad-46a3616ad8cd",
  "48d1b13b-f299-4552-9e3a-45ecd53b2739", "4be12651-d938-4411-954e-ed2891fcdf40", "4c2fb3b1-24f2-43b6-bd51-ee6e57dd9dee",
  "4f027452-c167-4220-8aa7-62bd1410c524", "50f81e00-72ab-49c1-9b54-ef19d69b20b9", "5303df4d-c192-474d-b51e-95cc20ef16ac",
  "5a41dee5-ce83-4b87-9ff6-b7ee60593cf4", "5bc2f0b9-c6c7-40d5-bd7e-085a1d896855", "5d765c27-fa16-4774-9d37-6568e9c83b54",
  "607a088a-ecae-4275-8db5-4baee7d245c6", "61d9022f-cd27-48f9-8c9b-ec2c53738860", "645c8f87-3f8e-4ec1-a799-f417a2bc80cf",
  "65d6a924-a268-4c96-8808-502c7ccd1e72", "7041cf9f-9ef7-489f-85c7-098a287fe594", "756071bf-551d-473b-a446-2676f0ca685f",
  "7ecfb069-34da-48e3-a0db-63e55f940eba", "804c2b2f-b86c-4827-8a66-e28cb956d96e", "83258e60-aa6c-4205-8337-4aae139a4a41",
  "8dbc2b97-811a-4e00-81de-fc6fa2ce4bd5", "8e044432-44f2-495a-a9c7-353dec9f1fa6", "8ed2fe1b-6b51-48fa-812f-271bbac561fd",
  "9d862b18-8f6d-4e28-a337-a2c98ef4642b", "9f5eaa4d-e72f-4066-9f81-d54173a86795", "a861743d-ffe3-416a-89f0-191203827829",
  "a938d1a6-4473-4882-a80e-c180e6e94557", "ac6b03ee-6e31-42d6-a136-d14fd2d01346", "aef7ac5e-959e-4cec-a643-2077566b7cdd",
  "af4fce3c-98ce-459c-905e-73b3f8ed5d7b", "b8e85246-c4e5-48b8-83ea-218212098032", "baf49b27-d6a7-4af0-a48b-1993cbf38020",
  "bd513de4-1dea-4da5-b2c3-6de542ded0d3", "c3fda419-5dd4-4826-937c-b2276afdd0a4", "c6f24948-5057-420e-a138-6d502517032b",
  "c76c4210-2d04-4f45-8b67-be1e74650f92", "c97009f9-d970-4429-9da7-3da1723c896d", "cb20b8f9-dcce-4c51-8612-6d573651fd5d",
  "cea58958-30b1-4312-b07c-f102873289e3", "cf7355e2-3064-4422-ad19-ebba7c18baaf", "d1cd0b84-9ff5-4012-806c-cc2d06ac0b9b",
  "d5239e81-a55c-4508-9511-70c1182efc4e", "d55e495e-d1f7-4083-b958-c1434e841dff", "d5924efd-d665-496e-b6d8-031d7798d50c",
  "d78c0552-4515-4c4f-824e-972026bfdc4c", "dc0205e9-cd4d-4a11-94ac-aa312061430c", "e02532bd-e9b2-43c0-acfc-1d6039ea15e4",
  "e11b9179-350f-49f1-822f-8abc50ee96a2", "e38ece10-d114-4cc5-b967-2e0cdf099ab5", "e7e57773-cd10-4640-be11-f95b17ee92d0",
  "ea88ddaf-174e-4db8-96ea-600b263e602c", "ecd511ad-ff53-431d-af50-b780592456a8", "ed4fa1c8-f3de-40e1-bafa-d74ef1b89c7b",
  "edde3695-d7cd-4855-a4f5-af922735c55b", "eea7e604-aebb-4abb-86c5-9b5614ba2b9a", "fc814f22-9fda-432e-a2e5-aa08010bb511",
  "ff3843f6-e74c-4187-9297-fd4ecf411c54"
];

export function generateMBTIResponses(scores: PersonalityScores): AnswerRecord {
  const responses: AnswerRecord = {};
  
  // Generate responses for all 81 questions
  QUESTION_IDS.forEach((questionId, index) => {
    // Generate responses that are consistent with personality scores
    let response = Math.floor(Math.random() * 5) + 1; // 1-5 scale
    
    // Adjust responses based on personality scores
    // These ranges are approximate based on typical OJTS structure
    if (index < 20) { // EI questions (0-19)
      response = scores.ei > 0 ? 
        Math.floor(Math.random() * 2) + 4 : // 4-5 for extroverts
        Math.floor(Math.random() * 2) + 1;  // 1-2 for introverts
    } else if (index < 40) { // SN questions (20-39)
      response = scores.sn > 0 ?
        Math.floor(Math.random() * 2) + 4 : // 4-5 for sensing
        Math.floor(Math.random() * 2) + 1;  // 1-2 for intuitive
    } else if (index < 60) { // TF questions (40-59)
      response = scores.tf > 0 ?
        Math.floor(Math.random() * 2) + 4 : // 4-5 for thinking
        Math.floor(Math.random() * 2) + 1;  // 1-2 for feeling
    } else if (index < 80) { // PJ questions (60-79)
      response = scores.pj > 0 ?
        Math.floor(Math.random() * 2) + 4 : // 4-5 for judging
        Math.floor(Math.random() * 2) + 1;  // 1-2 for perceiving
    } else { // Attention check (question 81, index 80)
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