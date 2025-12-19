/*
  Warnings:

  - The `role` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[studentId,skillId]` on the table `student_competency_profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,topicKey]` on the table `student_competency_profiles` will be added. If there are existing duplicate values, this will fail.
  - Made the column `createdAt` on table `verification` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `verification` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "courses_shareToken_idx";

-- DropIndex
DROP INDEX "dosen_tokens_token_idx";

-- DropIndex
DROP INDEX "student_competency_profiles_studentId_competencyKind_skillI_key";

-- DropIndex
DROP INDEX "student_competency_profiles_studentId_competencyKind_topicK_key";

-- DropIndex
DROP INDEX "user_email_idx";

-- AlterTable
ALTER TABLE "account" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "session" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "role",
ADD COLUMN     "role" "RoleName";

-- AlterTable
ALTER TABLE "verification" ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "student_competency_profiles_studentId_skillId_key" ON "student_competency_profiles"("studentId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "student_competency_profiles_studentId_topicKey_key" ON "student_competency_profiles"("studentId", "topicKey");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");
