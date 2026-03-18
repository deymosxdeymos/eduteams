import type { AssignmentStatus } from "@/generated/prisma/client";
import { parseAssignmentDescription } from "@/lib/assignment-description";

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
  const { skills, topics } = parseAssignmentDescription(description, { defaultSkills: [] });
  return { skills, topics };
}

/**
 * Check if two strings are similar enough to be considered a rename.
 * Uses substring matching (case-insensitive).
 */
function isSimilar(a: string, b: string): boolean {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  return aLower.includes(bLower) || bLower.includes(aLower);
}

/**
 * Detect changes between two arrays of strings.
 * Supports detecting multiple renames using substring matching.
 */
export function detectArrayChanges(oldArr: string[], newArr: string[]): StructuralChange {
  const oldSet = new Set(oldArr.map((s) => s.toLowerCase().trim()));
  const newSet = new Set(newArr.map((s) => s.toLowerCase().trim()));

  const oldMap = new Map(oldArr.map((s) => [s.toLowerCase().trim(), s]));
  const newMap = new Map(newArr.map((s) => [s.toLowerCase().trim(), s]));

  const initiallyAdded: string[] = [];
  const initiallyRemoved: string[] = [];

  for (const item of newSet) {
    if (!oldSet.has(item)) {
      const value = newMap.get(item);
      if (value) initiallyAdded.push(value);
    }
  }

  for (const item of oldSet) {
    if (!newSet.has(item)) {
      const value = oldMap.get(item);
      if (value) initiallyRemoved.push(value);
    }
  }

  const renamed: Array<{ old: string; new: string }> = [];
  const matchedRemoved = new Set<string>();
  const matchedAdded = new Set<string>();

  for (const oldItem of initiallyRemoved) {
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const newItem of initiallyAdded) {
      if (matchedAdded.has(newItem)) continue;

      if (isSimilar(oldItem, newItem)) {
        const score = Math.min(oldItem.length, newItem.length);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = newItem;
        }
      }
    }

    if (bestMatch) {
      renamed.push({ old: oldItem, new: bestMatch });
      matchedRemoved.add(oldItem);
      matchedAdded.add(bestMatch);
    }
  }

  const added = initiallyAdded.filter((item) => !matchedAdded.has(item));
  const removed = initiallyRemoved.filter((item) => !matchedRemoved.has(item));

  return { added, removed, renamed };
}

/**
 * Determine the edit tier based on changes and current assignment status
 */
export function determineEditTier(
  skillChanges: StructuralChange,
  topicChanges: StructuralChange,
  status: AssignmentStatus,
  submissionCount: number,
): { tier: EditTier; reason?: string } {
  if (status === "BERHASIL_PEMBAGIAN_GRUP") {
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
          "Cannot edit assignment structure after teams have been formed. Please reset the assignment first.",
      };
    }
  }

  if (submissionCount === 0) {
    return { tier: 1 };
  }

  const hasDestructiveChanges =
    skillChanges.removed.length > 0 ||
    skillChanges.renamed.length > 0 ||
    topicChanges.removed.length > 0 ||
    topicChanges.renamed.length > 0;

  if (hasDestructiveChanges) {
    return {
      tier: 3,
      reason: `This will invalidate ${submissionCount} existing submission${submissionCount === 1 ? "" : "s"}. Students will need to retake the assessment.`,
    };
  }

  const hasAdditiveChanges = skillChanges.added.length > 0 || topicChanges.added.length > 0;

  if (hasAdditiveChanges) {
    return {
      tier: 2,
      reason: `New items added. ${submissionCount} student${submissionCount === 1 ? "" : "s"} who submitted will need to complete the new sections.`,
    };
  }

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
  submissionCount: number,
): EditImpact {
  const current = parseAssignmentStructure(currentDescription);
  const skillChanges = detectArrayChanges(current.skills, newSkills);
  const topicChanges = detectArrayChanges(current.topics, newTopics);
  const { tier, reason } = determineEditTier(skillChanges, topicChanges, status, submissionCount);

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
 * @public
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
  skills: Array<{ type: "added" | "removed" | "renamed"; text: string }>;
  topics: Array<{ type: "added" | "removed" | "renamed"; text: string }>;
} {
  return {
    skills: [
      ...changes.skills.removed.map((s) => ({
        type: "removed" as const,
        text: s,
      })),
      ...changes.skills.added.map((s) => ({ type: "added" as const, text: s })),
      ...changes.skills.renamed.map((r) => ({
        type: "renamed" as const,
        text: `${r.old} → ${r.new}`,
      })),
    ],
    topics: [
      ...changes.topics.removed.map((t) => ({
        type: "removed" as const,
        text: t,
      })),
      ...changes.topics.added.map((t) => ({ type: "added" as const, text: t })),
      ...changes.topics.renamed.map((r) => ({
        type: "renamed" as const,
        text: `${r.old} → ${r.new}`,
      })),
    ],
  };
}
