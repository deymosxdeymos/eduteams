import type { PersonalityQuestionRecord } from "@/lib/mbti-questions-simple";

export interface PersonalityAnswerRow {
  id: string;
  text: string;
  answerValue: number | null;
}

export interface SkillAnswerRow {
  name: string;
  level: number | null;
}

export interface TopicAnswerRow {
  name: string;
  preference: number | null;
}

interface BuildAssignmentAnswerRowsInput {
  mbtiQuestions: readonly Pick<PersonalityQuestionRecord, "id" | "text" | "orderHint">[];
  personalityAnswers: Record<string, unknown>;
  skills: readonly { name: string; level: number | null }[];
  topics: readonly { name: string; preference: number | null }[];
}

function getLikertValue(
  personalityAnswers: Record<string, unknown>,
  question: Pick<PersonalityQuestionRecord, "id" | "orderHint">,
  index: number,
): number | null {
  const byId = personalityAnswers[question.id];
  const byOrder = personalityAnswers[String(question.orderHint ?? index + 1)];
  const raw = byId ?? byOrder;

  if (typeof raw === "number") {
    return raw;
  }

  if (typeof raw === "string") {
    const parsed = Number.parseInt(raw, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}

export function buildAssignmentAnswerRows({
  mbtiQuestions,
  personalityAnswers,
  skills,
  topics,
}: BuildAssignmentAnswerRowsInput) {
  return {
    personalityRows: mbtiQuestions.map((question, index) => ({
      id: question.id || `${question.orderHint ?? index + 1}-${question.text}`,
      text: question.text,
      answerValue: getLikertValue(personalityAnswers, question, index),
    })),
    skillRows: skills.map((skill) => ({
      name: skill.name,
      level: skill.level,
    })),
    topicRows: topics.map((topic) => ({
      name: topic.name,
      preference: topic.preference,
    })),
  } satisfies {
    personalityRows: PersonalityAnswerRow[];
    skillRows: SkillAnswerRow[];
    topicRows: TopicAnswerRow[];
  };
}
