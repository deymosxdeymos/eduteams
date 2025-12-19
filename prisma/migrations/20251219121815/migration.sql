-- Ensure personality_profiles exists so subsequent migrations can alter it
CREATE TABLE IF NOT EXISTS "personality_profiles" (
  "userId" TEXT NOT NULL,
  "ei" DOUBLE PRECISION,
  "sn" DOUBLE PRECISION,
  "tf" DOUBLE PRECISION,
  "pj" DOUBLE PRECISION,
  "mbtiType" "MBTIType",
  "personalityData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "personality_profiles_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "personality_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- DropIndex
DROP INDEX IF EXISTS "student_competency_profiles_studentId_skillId_key";

-- DropIndex
DROP INDEX IF EXISTS "student_competency_profiles_studentId_topicKey_key";

-- AlterTable
ALTER TABLE "personality_profiles" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- RenameIndex
ALTER INDEX IF EXISTS "student_competency_profiles_studentId_competencyKind_skillId_ke" RENAME TO "student_competency_profiles_studentId_competencyKind_skillI_key";

-- RenameIndex
ALTER INDEX IF EXISTS "student_competency_profiles_studentId_competencyKind_topicKey_k" RENAME TO "student_competency_profiles_studentId_competencyKind_topicK_key";
