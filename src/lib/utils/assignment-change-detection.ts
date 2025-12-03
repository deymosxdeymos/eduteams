import type { AssignmentStatus } from '@/generated/prisma';

/**
 * Tier system for assignment edits:
 * - Tier 1: Safe metadata changes (no confirmation needed)
 * - Tier 2: Additive structural changes (soft warning, mark needsUpdate)
 * - Tier 3: Destructive structural changes (hard confirmation, invalidate submissions)
 * - Tier 4: Blocked edits (teams already formed, requires explicit reset)
 */
export type EditTier = 1 | 2 | 3 | 4;

export interface StructuralChange {
  added: string[];
  removed: string[];
  renamed: Array<{ old: string; new: string }>;
}

export interface AssignmentChanges {
  skills: StructuralChange;
  topics: StructuralChange;
}

export interface EditImpact {
  tier: EditTier;
  affectedSubmissions: number;
  changes: AssignmentChanges;
  reason?: string;
}

/**
 * Parse skills/topics from assignment description JSON
 */
export function parseAssignmentStructure(description: string | null): {
  skills: string[];
  topics: string[];
} {
  if (!description) {
    return { skills: [], topics: [] };
  }

  try {
    const parsed = JSON.parse(description);
    if (parsed && typeof parsed === 'object') {
      return {
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        topics: Array.isArray(parsed.topics) ? parsed.topics : [],
      };
    }
  } catch {
    // Invalid JSON, return empty arrays
  }

  return { skills: [], topics: [] };
}

/**
 * Detect changes between two arrays of strings
 */
export function detectArrayChanges(
  oldArr: string[],
  newArr: string[]
): StructuralChange {
  const oldSet = new Set(oldArr.map(s => s.toLowerCase().trim()));
  const newSet = new Set(newArr.map(s => s.toLowerCase().trim()));

  // Create maps for original casing
  const oldMap = new Map(oldArr.map(s => [s.toLowerCase().trim(), s]));
  const newMap = new Map(newArr.map(s => [s.toLowerCase().trim(), s]));

  const added: string[] = [];
  const removed: string[] = [];
  const renamed: Array<{ old: string; new: string }> = [];

  // Find added items
  for (const item of newSet) {
    if (!oldSet.has(item)) {
      const value = newMap.get(item);
      if (value) added.push(value);
    }
  }

  // Find removed items
  for (const item of oldSet) {
    if (!newSet.has(item)) {
      const value = oldMap.get(item);
      if (value) removed.push(value);
    }
  }

  // Detect potential renames using simple heuristic
  if (removed.length === 1 && added.length === 1) {
    const old = removed[0];
    const newItem = added[0];

    // Check if one contains the other (case-insensitive)
    if (
      old.toLowerCase().includes(newItem.toLowerCase()) ||
      newItem.toLowerCase().includes(old.toLowerCase())
    ) {
      renamed.push({ old, new: newItem });
      removed.length = 0;
      added.length = 0;
    }
  }

  return { added, removed, renamed };
}

/**
 * Determine the edit tier based on changes and current assignment status
 */
export function determineEditTier(
  skillChanges: StructuralChange,
  topicChanges: StructuralChange,
  status: AssignmentStatus,
  submissionCount: number
): { tier: EditTier; reason?: string } {
  // Tier 4: Teams already formed - block all structural edits
  if (status === 'BERHASIL_PEMBAGIAN_GRUP') {
    const hasStructuralChanges =
      skillChanges.added.length > 0 ||
      skillChanges.removed.length > 0 ||
      skillChanges.renamed.length > 0 ||
      topicChanges.added.length > 0 ||
      topicChanges.removed.length > 0 ||
      topicChanges.renamed.length > 0;

    if (hasStructuralChanges) {
      return {
        tier: 4,
        reason:
          'Cannot edit assignment structure after teams have been formed. Please reset the assignment first.',
      };
    }
  }

  // No submissions yet - all changes are safe
  if (submissionCount === 0) {
    return { tier: 1 };
  }

  // Check for destructive changes (removals or renames)
  const hasDestructiveChanges =
    skillChanges.removed.length > 0 ||
    skillChanges.renamed.length > 0 ||
    topicChanges.removed.length > 0 ||
    topicChanges.renamed.length > 0;

  if (hasDestructiveChanges) {
    return {
      tier: 3,
      reason: `This will invalidate ${submissionCount} existing submission${submissionCount === 1 ? '' : 's'}. Students will need to retake the assessment.`,
    };
  }

  // Check for additive changes only
  const hasAdditiveChanges =
    skillChanges.added.length > 0 || topicChanges.added.length > 0;

  if (hasAdditiveChanges) {
    return {
      tier: 2,
      reason: `New items added. ${submissionCount} student${submissionCount === 1 ? '' : 's'} who submitted will need to complete the new sections.`,
    };
  }

  // Only metadata changes (title, description text, dates)
  return { tier: 1 };
}

/**
 * Main function to analyze assignment edit impact
 */
export function analyzeAssignmentEditImpact(
  currentDescription: string | null,
  newSkills: string[],
  newTopics: string[],
  status: AssignmentStatus,
  submissionCount: number
): EditImpact {
  // Parse current structure
  const current = parseAssignmentStructure(currentDescription);

  // Detect changes
  const skillChanges = detectArrayChanges(current.skills, newSkills);
  const topicChanges = detectArrayChanges(current.topics, newTopics);

  // Determine tier
  const { tier, reason } = determineEditTier(
    skillChanges,
    topicChanges,
    status,
    submissionCount
  );

  return {
    tier,
    affectedSubmissions: submissionCount,
    changes: {
      skills: skillChanges,
      topics: topicChanges,
    },
    reason,
  };
}

/**
 * Check if there are any structural changes
 */
export function hasStructuralChanges(changes: AssignmentChanges): boolean {
  return (
    changes.skills.added.length > 0 ||
    changes.skills.removed.length > 0 ||
    changes.skills.renamed.length > 0 ||
    changes.topics.added.length > 0 ||
    changes.topics.removed.length > 0 ||
    changes.topics.renamed.length > 0
  );
}

/**
 * Format changes for display (used in diff preview)
 */
export function formatChangesForDisplay(changes: AssignmentChanges): {
  skills: Array<{ type: 'added' | 'removed' | 'renamed'; text: string }>;
  topics: Array<{ type: 'added' | 'removed' | 'renamed'; text: string }>;
} {
  return {
    skills: [
      ...changes.skills.removed.map(s => ({
        type: 'removed' as const,
        text: s,
      })),
      ...changes.skills.added.map(s => ({ type: 'added' as const, text: s })),
      ...changes.skills.renamed.map(r => ({
        type: 'renamed' as const,
        text: `${r.old} → ${r.new}`,
      })),
    ],
    topics: [
      ...changes.topics.removed.map(t => ({
        type: 'removed' as const,
        text: t,
      })),
      ...changes.topics.added.map(t => ({ type: 'added' as const, text: t })),
      ...changes.topics.renamed.map(r => ({
        type: 'renamed' as const,
        text: `${r.old} → ${r.new}`,
      })),
    ],
  };
}
