-- CreateEnum
CREATE TYPE "CompetencyKind" AS ENUM ('SKILL', 'TOPIC');

-- CreateTable
CREATE TABLE "student_competency_profiles" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "competencyKind" "CompetencyKind" NOT NULL,
    "skillId" TEXT,
    "topicKey" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "sourceAssignmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_competency_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_competency_profiles_studentId_idx" ON "student_competency_profiles"("studentId");

-- CreateIndex
CREATE INDEX "student_competency_profiles_skillId_idx" ON "student_competency_profiles"("skillId");

-- CreateIndex
CREATE INDEX "student_competency_profiles_topicKey_idx" ON "student_competency_profiles"("topicKey");

-- CreateIndex
CREATE INDEX "student_competency_profiles_sourceAssignmentId_idx" ON "student_competency_profiles"("sourceAssignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "student_competency_profiles_studentId_competencyKind_skillI_key" ON "student_competency_profiles"("studentId", "competencyKind", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "student_competency_profiles_studentId_competencyKind_topicK_key" ON "student_competency_profiles"("studentId", "competencyKind", "topicKey");

-- AddForeignKey
ALTER TABLE "student_competency_profiles" ADD CONSTRAINT "student_competency_profiles_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_competency_profiles" ADD CONSTRAINT "student_competency_profiles_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_competency_profiles" ADD CONSTRAINT "student_competency_profiles_sourceAssignmentId_fkey" FOREIGN KEY ("sourceAssignmentId") REFERENCES "assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
