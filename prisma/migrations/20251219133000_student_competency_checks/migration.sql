-- Ensure SKILL rows have only skillId and TOPIC rows have only topicKey populated.
ALTER TABLE "student_competency_profiles"
ADD CONSTRAINT "student_competency_profiles_skill_guard"
CHECK (
  "competencyKind" <> 'SKILL'
  OR ("skillId" IS NOT NULL AND "topicKey" IS NULL)
);

ALTER TABLE "student_competency_profiles"
ADD CONSTRAINT "student_competency_profiles_topic_guard"
CHECK (
  "competencyKind" <> 'TOPIC'
  OR ("topicKey" IS NOT NULL AND "skillId" IS NULL)
);
