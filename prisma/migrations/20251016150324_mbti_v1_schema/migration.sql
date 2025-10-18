/*
  Warnings:

  - You are about to drop the column `order` on the `personality_questions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bankVersion,orderHint,locale]` on the table `personality_questions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bankVersion` to the `personality_questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderHint` to the `personality_questions` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `dimension` on the `personality_questions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PersonalityAxis" AS ENUM ('ei', 'sn', 'tf', 'pj');

-- CreateEnum
CREATE TYPE "PersonalityBankStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RETIRED');

-- DropIndex
DROP INDEX "public"."personality_questions_order_key";

-- AlterTable
ALTER TABLE "personality_questions"
ADD COLUMN     "bankVersion" INTEGER,
ADD COLUMN     "isAttentionCheck" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'id-ID',
ADD COLUMN     "orderHint" INTEGER,
ADD COLUMN     "status" "PersonalityBankStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "dimension_new" "PersonalityAxis";

-- Backfill newly added columns for existing questions
UPDATE "personality_questions"
SET "bankVersion" = 1
WHERE "bankVersion" IS NULL;

UPDATE "personality_questions"
SET "orderHint" = "order"
WHERE "orderHint" IS NULL;

WITH mapped_dimensions AS (
  SELECT
    id,
    CASE
      WHEN LOWER("dimension") IN ('ei', 'ie') THEN 'ei'
      WHEN LOWER("dimension") IN ('sn', 'ns') THEN 'sn'
      WHEN LOWER("dimension") IN ('tf', 'ft') THEN 'tf'
      WHEN LOWER("dimension") IN ('pj', 'jp') THEN 'pj'
      ELSE NULL
    END AS axis
  FROM "personality_questions"
)
UPDATE "personality_questions" q
SET "dimension_new" = mapped_dimensions.axis::"PersonalityAxis"
FROM mapped_dimensions
WHERE q.id = mapped_dimensions.id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "personality_questions" WHERE "dimension_new" IS NULL
  ) THEN
    RAISE EXCEPTION 'Unable to map existing personality question dimensions to PersonalityAxis enum';
  END IF;
END
$$;

ALTER TABLE "personality_questions"
ALTER COLUMN "bankVersion" SET NOT NULL,
ALTER COLUMN "orderHint" SET NOT NULL,
ALTER COLUMN "dimension_new" SET NOT NULL;

ALTER TABLE "personality_questions"
DROP COLUMN "dimension";

ALTER TABLE "personality_questions"
RENAME COLUMN "dimension_new" TO "dimension";

ALTER TABLE "personality_questions"
DROP COLUMN "order";

-- CreateTable
CREATE TABLE "personality_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bankVersion" INTEGER NOT NULL,
    "presentedOrder" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "attentionPassed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personality_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personality_responses" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "rawValue" INTEGER NOT NULL,
    "scoredValue" INTEGER,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personality_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personality_scores" (
    "sessionId" TEXT NOT NULL,
    "ei" DOUBLE PRECISION NOT NULL,
    "sn" DOUBLE PRECISION NOT NULL,
    "tf" DOUBLE PRECISION NOT NULL,
    "pj" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personality_scores_pkey" PRIMARY KEY ("sessionId")
);

-- CreateIndex
CREATE INDEX "personality_sessions_userId_idx" ON "personality_sessions"("userId");

-- CreateIndex
CREATE INDEX "personality_sessions_bankVersion_idx" ON "personality_sessions"("bankVersion");

-- CreateIndex
CREATE INDEX "personality_sessions_bankVersion_submittedAt_idx" ON "personality_sessions"("bankVersion", "submittedAt");

-- CreateIndex
CREATE INDEX "personality_sessions_attentionPassed_submittedAt_idx" ON "personality_sessions"("attentionPassed", "submittedAt");

-- CreateIndex
CREATE INDEX "personality_sessions_createdAt_idx" ON "personality_sessions"("createdAt");

-- CreateIndex
CREATE INDEX "personality_sessions_submittedAt_idx" ON "personality_sessions"("submittedAt");

-- CreateIndex
CREATE INDEX "personality_responses_sessionId_idx" ON "personality_responses"("sessionId");

-- CreateIndex
CREATE INDEX "personality_responses_questionId_idx" ON "personality_responses"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "personality_responses_sessionId_questionId_key" ON "personality_responses"("sessionId", "questionId");

-- CreateIndex
CREATE INDEX "personality_questions_bankVersion_status_idx" ON "personality_questions"("bankVersion", "status");

-- CreateIndex
CREATE INDEX "personality_questions_dimension_idx" ON "personality_questions"("dimension");

-- CreateIndex
CREATE UNIQUE INDEX "personality_questions_bankVersion_orderHint_locale_key" ON "personality_questions"("bankVersion", "orderHint", "locale");

-- AddForeignKey
ALTER TABLE "personality_sessions" ADD CONSTRAINT "personality_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personality_responses" ADD CONSTRAINT "personality_responses_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "personality_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personality_responses" ADD CONSTRAINT "personality_responses_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "personality_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personality_scores" ADD CONSTRAINT "personality_scores_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "personality_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
