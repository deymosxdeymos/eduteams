import type { MBTIType } from '@/generated/prisma';

export type PersonalityCategory =
  | 'diplomats'
  | 'analysts'
  | 'explorers'
  | 'sentinels';

export type ColorScheme = {
  primaryBg: string;
  primaryText: string;
  primaryBorder: string;
  lightBorder: string;
  lightShadow: string;
  gradientFrom: string;
  gradientTo: string;
};

export const MBTI_CATEGORIES: Record<MBTIType, PersonalityCategory> = {
  INFJ: 'diplomats',
  INFP: 'diplomats',
  ENFJ: 'diplomats',
  ENFP: 'diplomats',
  INTJ: 'analysts',
  INTP: 'analysts',
  ENTJ: 'analysts',
  ENTP: 'analysts',
  ISTP: 'explorers',
  ISFP: 'explorers',
  ESTP: 'explorers',
  ESFP: 'explorers',
  ISTJ: 'sentinels',
  ISFJ: 'sentinels',
  ESTJ: 'sentinels',
  ESFJ: 'sentinels',
};

export const COLOR_SCHEMES: Record<PersonalityCategory, ColorScheme> = {
  diplomats: {
    primaryBg: 'bg-emerald-500',
    primaryText: 'text-emerald-500',
    primaryBorder: 'border-emerald-500',
    lightBorder: 'border-emerald-100',
    lightShadow: 'shadow-emerald-100',
    gradientFrom: 'from-emerald-600',
    gradientTo: 'to-emerald-400',
  },
  analysts: {
    primaryBg: 'bg-violet-500',
    primaryText: 'text-violet-500',
    primaryBorder: 'border-violet-500',
    lightBorder: 'border-violet-100',
    lightShadow: 'shadow-violet-100',
    gradientFrom: 'from-violet-600',
    gradientTo: 'to-violet-400',
  },
  explorers: {
    primaryBg: 'bg-orange-500',
    primaryText: 'text-orange-500',
    primaryBorder: 'border-orange-500',
    lightBorder: 'border-orange-100',
    lightShadow: 'shadow-orange-100',
    gradientFrom: 'from-orange-600',
    gradientTo: 'to-orange-400',
  },
  sentinels: {
    primaryBg: 'bg-blue-500',
    primaryText: 'text-blue-500',
    primaryBorder: 'border-blue-500',
    lightBorder: 'border-blue-100',
    lightShadow: 'shadow-blue-100',
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-blue-400',
  },
};

export function getMBTIColorScheme(
  mbtiType: MBTIType | null | undefined
): ColorScheme {
  if (!mbtiType) {
    return COLOR_SCHEMES.diplomats; // Default to ENFP's category
  }

  const category = MBTI_CATEGORIES[mbtiType];
  return COLOR_SCHEMES[category];
}

export function getMBTICategory(
  mbtiType: MBTIType | null | undefined
): PersonalityCategory {
  if (!mbtiType) {
    return 'diplomats';
  }

  return MBTI_CATEGORIES[mbtiType];
}
