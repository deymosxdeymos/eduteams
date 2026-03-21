export const DEFAULT_ASSIGNMENT_SKILLS = [
  "UI/UX Design",
  "Frontend Development",
  "Backend Development",
] as const;

const NORMALIZED_DEFAULT_SKILLS: string[] = [...DEFAULT_ASSIGNMENT_SKILLS];
const EMPTY_TOPICS: string[] = [];

export function normalizeAssignmentNames(values: unknown) {
  if (!Array.isArray(values)) {
    return [] as string[];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized;
}

export function parseAssignmentDescription(
  description: string | null | undefined,
  options?: { defaultSkills?: readonly string[] },
) {
  const defaultSkills = options?.defaultSkills
    ? normalizeAssignmentNames(options.defaultSkills)
    : NORMALIZED_DEFAULT_SKILLS;

  if (!description) {
    return {
      text: null,
      skills: defaultSkills,
      topics: EMPTY_TOPICS,
    };
  }

  try {
    const parsed = JSON.parse(description);
    const skills = normalizeAssignmentNames(parsed?.skills);
    const topics = normalizeAssignmentNames(parsed?.topics);

    return {
      text: typeof parsed?.text === "string" ? parsed.text.trim() || null : null,
      skills: skills.length > 0 ? skills : defaultSkills,
      topics,
    };
  } catch {
    return {
      text: description.trim() || null,
      skills: defaultSkills,
      topics: EMPTY_TOPICS,
    };
  }
}
