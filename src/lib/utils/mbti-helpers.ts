import { getMBTIType as getMBTITypeFromScores } from '@/lib/personality';
import type { MBTIType } from '@/generated/prisma';

/**
 * Derive MBTI type from user's personality scores
 * Returns null if scores are incomplete
 */
export function deriveMBTIType(user: {
  ei: number | null;
  sn: number | null;
  tf: number | null;
  pj: number | null;
}): MBTIType | null {
  if (
    user.ei === null ||
    user.sn === null ||
    user.tf === null ||
    user.pj === null
  ) {
    return null;
  }

  return getMBTITypeFromScores({
    ei: user.ei,
    sn: user.sn,
    tf: user.tf,
    pj: user.pj,
  }) as MBTIType;
}

/**
 * Get MBTI type from user, preferring derived from scores over stored value
 * This ensures the MBTI type always matches the raw personality dimension scores
 */
export function getMBTIType(user: {
  ei: number | null;
  sn: number | null;
  tf: number | null;
  pj: number | null;
  mbtiType?: MBTIType | null;
}): MBTIType | null {
  // Always prefer derived from scores if available
  const derived = deriveMBTIType(user);
  if (derived) return derived;

  // Fallback to stored value (for backwards compatibility)
  return user.mbtiType ?? null;
}
