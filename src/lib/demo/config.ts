import type { Gender } from '@/generated/prisma/client';

export type DemoRole = 'TEACHER' | 'STUDENT';

interface DemoAccountProfile {
  name: string;
  role: DemoRole;
  gender: Gender;
  nim: string | null;
}

export const DEMO_COURSE_CATALOG = [
  { id: 'demo-1', code: 'IF3270', name: 'Machine Learning' },
  { id: 'demo-2', code: 'IF3250', name: 'Software Engineering' },
  { id: 'demo-3', code: 'IF3210', name: 'Mobile Development' },
] as const;

export const DEMO_CLASS_CATALOG = [
  { id: 'demo-a', code: 'K01' },
  { id: 'demo-b', code: 'K02' },
] as const;

export const DEMO_ACCOUNT_PROFILES: Record<DemoRole, DemoAccountProfile> = {
  TEACHER: {
    name: 'Dr. Rina Wijaya',
    role: 'TEACHER',
    gender: 'FEMALE',
    nim: null,
  },
  STUDENT: {
    name: 'Bagas Pratama',
    role: 'STUDENT',
    gender: 'MALE',
    nim: '20260001',
  },
};

export function isDemoModeEnabled(): boolean {
  return process.env.DEMO_MODE === '1';
}

export function isDemoLoginEnabled(): boolean {
  return isDemoModeEnabled();
}

export function isDemoUiEnabled(): boolean {
  return isDemoLoginEnabled() || process.env.NEXT_PUBLIC_DEMO_MODE === '1';
}

export function getDemoDataDiriDefaults(role: 'dosen' | 'mahasiswa') {
  if (role === 'dosen') {
    return {
      namaLengkap: DEMO_ACCOUNT_PROFILES.TEACHER.name,
      nim: '',
      jenisKelamin: 'perempuan',
      role,
    };
  }

  return {
    namaLengkap: DEMO_ACCOUNT_PROFILES.STUDENT.name,
    nim: DEMO_ACCOUNT_PROFILES.STUDENT.nim ?? '',
    jenisKelamin: 'laki-laki',
    role,
  };
}
