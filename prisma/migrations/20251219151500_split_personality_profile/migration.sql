-- Move personality fields off the user table into personality_profiles,
-- copy existing data, and align supporting indexes/constraints.

INSERT INTO "personality_profiles" (
  "userId",
  "ei",
  "sn",
  "tf",
  "pj",
  "mbtiType",
  "personalityData",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  "ei",
  "sn",
  "tf",
  "pj",
  "mbtiType",
  "personalityData",
  COALESCE("createdAt", CURRENT_TIMESTAMP),
  COALESCE("updatedAt", CURRENT_TIMESTAMP)
FROM "user"
WHERE "ei" IS NOT NULL
   OR "sn" IS NOT NULL
   OR "tf" IS NOT NULL
   OR "pj" IS NOT NULL
   OR "mbtiType" IS NOT NULL
   OR "personalityData" IS NOT NULL
ON CONFLICT ("userId") DO UPDATE SET
  "ei" = EXCLUDED."ei",
  "sn" = EXCLUDED."sn",
  "tf" = EXCLUDED."tf",
  "pj" = EXCLUDED."pj",
  "mbtiType" = EXCLUDED."mbtiType",
  "personalityData" = EXCLUDED."personalityData",
  "createdAt" = LEAST("personality_profiles"."createdAt", EXCLUDED."createdAt"),
  "updatedAt" = GREATEST("personality_profiles"."updatedAt", EXCLUDED."updatedAt");

DROP INDEX IF EXISTS "user_mbtiType_idx";
DROP INDEX IF EXISTS "user_ei_idx";
DROP INDEX IF EXISTS "user_sn_idx";
DROP INDEX IF EXISTS "user_tf_idx";
DROP INDEX IF EXISTS "user_pj_idx";
DROP INDEX IF EXISTS "user_personalityData_idx";

ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_ei_range_check";
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_sn_range_check";
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_tf_range_check";
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_pj_range_check";
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_personality_completeness_check";
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_mbti_consistency_check";
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS "user_personality_data_schema_check";

ALTER TABLE "user"
  DROP COLUMN IF EXISTS "ei",
  DROP COLUMN IF EXISTS "sn",
  DROP COLUMN IF EXISTS "tf",
  DROP COLUMN IF EXISTS "pj",
  DROP COLUMN IF EXISTS "mbtiType",
  DROP COLUMN IF EXISTS "personalityData";

CREATE INDEX "personality_profiles_mbtiType_idx" ON "personality_profiles" ("mbtiType");
CREATE INDEX "personality_profiles_ei_idx" ON "personality_profiles" ("ei");
CREATE INDEX "personality_profiles_sn_idx" ON "personality_profiles" ("sn");
CREATE INDEX "personality_profiles_tf_idx" ON "personality_profiles" ("tf");
CREATE INDEX "personality_profiles_pj_idx" ON "personality_profiles" ("pj");
CREATE INDEX "personality_profiles_personalityData_idx" ON "personality_profiles" USING GIN ("personalityData");

ALTER TABLE "student_competency_profiles" DROP CONSTRAINT IF EXISTS "student_competency_profiles_studentId_skillId_key";
ALTER TABLE "student_competency_profiles" DROP CONSTRAINT IF EXISTS "student_competency_profiles_studentId_topicKey_key";

ALTER TABLE "student_competency_profiles"
  ADD CONSTRAINT "student_competency_profiles_studentId_competencyKind_skillId_key"
  UNIQUE ("studentId", "competencyKind", "skillId");

ALTER TABLE "student_competency_profiles"
  ADD CONSTRAINT "student_competency_profiles_studentId_competencyKind_topicKey_key"
  UNIQUE ("studentId", "competencyKind", "topicKey");
