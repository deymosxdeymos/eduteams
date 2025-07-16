-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE');

-- CreateEnum
CREATE TYPE "TeamFormationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "ei" DOUBLE PRECISION,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "pj" DOUBLE PRECISION,
ADD COLUMN     "sn" DOUBLE PRECISION,
ADD COLUMN     "tf" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_skills" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person_preferences" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "preferredPersonId" TEXT NOT NULL,
    "preference" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "person_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_similarities" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "similarity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_similarities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "teamSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_skills" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" DOUBLE PRECISION NOT NULL,
    "importance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_preferences" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "preference" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_formation_requests" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" "TeamFormationStatus" NOT NULL DEFAULT 'PENDING',
    "alpha" DOUBLE PRECISION,
    "beta" DOUBLE PRECISION,
    "gamma" DOUBLE PRECISION,
    "delta" DOUBLE PRECISION,
    "initRandom" BOOLEAN NOT NULL DEFAULT false,
    "requestData" JSONB,
    "responseData" JSONB,
    "errorMessage" TEXT,
    "replyPostUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "team_formation_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "teamFormationRequestId" TEXT NOT NULL,
    "taskId" TEXT,
    "name" TEXT,
    "quality" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedSkillIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE INDEX "skills_name_idx" ON "skills"("name");

-- CreateIndex
CREATE INDEX "person_skills_personId_idx" ON "person_skills"("personId");

-- CreateIndex
CREATE INDEX "person_skills_skillId_idx" ON "person_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "person_skills_personId_skillId_key" ON "person_skills"("personId", "skillId");

-- CreateIndex
CREATE INDEX "person_preferences_personId_idx" ON "person_preferences"("personId");

-- CreateIndex
CREATE INDEX "person_preferences_preferredPersonId_idx" ON "person_preferences"("preferredPersonId");

-- CreateIndex
CREATE UNIQUE INDEX "person_preferences_personId_preferredPersonId_key" ON "person_preferences"("personId", "preferredPersonId");

-- CreateIndex
CREATE INDEX "skill_similarities_sourceId_idx" ON "skill_similarities"("sourceId");

-- CreateIndex
CREATE INDEX "skill_similarities_targetId_idx" ON "skill_similarities"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "skill_similarities_sourceId_targetId_key" ON "skill_similarities"("sourceId", "targetId");

-- CreateIndex
CREATE INDEX "tasks_teamSize_idx" ON "tasks"("teamSize");

-- CreateIndex
CREATE INDEX "task_skills_taskId_idx" ON "task_skills"("taskId");

-- CreateIndex
CREATE INDEX "task_skills_skillId_idx" ON "task_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "task_skills_taskId_skillId_key" ON "task_skills"("taskId", "skillId");

-- CreateIndex
CREATE INDEX "task_preferences_taskId_idx" ON "task_preferences"("taskId");

-- CreateIndex
CREATE INDEX "task_preferences_personId_idx" ON "task_preferences"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "task_preferences_taskId_personId_key" ON "task_preferences"("taskId", "personId");

-- CreateIndex
CREATE INDEX "team_formation_requests_status_createdAt_idx" ON "team_formation_requests"("status", "createdAt");

-- CreateIndex
CREATE INDEX "team_formation_requests_ownerId_idx" ON "team_formation_requests"("ownerId");

-- CreateIndex
CREATE INDEX "teams_teamFormationRequestId_idx" ON "teams"("teamFormationRequestId");

-- CreateIndex
CREATE INDEX "teams_taskId_idx" ON "teams"("taskId");

-- CreateIndex
CREATE INDEX "team_members_teamId_idx" ON "team_members"("teamId");

-- CreateIndex
CREATE INDEX "team_members_userId_idx" ON "team_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_userId_key" ON "team_members"("teamId", "userId");

-- AddForeignKey
ALTER TABLE "person_skills" ADD CONSTRAINT "person_skills_personId_fkey" FOREIGN KEY ("personId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_skills" ADD CONSTRAINT "person_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_preferences" ADD CONSTRAINT "person_preferences_personId_fkey" FOREIGN KEY ("personId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "person_preferences" ADD CONSTRAINT "person_preferences_preferredPersonId_fkey" FOREIGN KEY ("preferredPersonId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_similarities" ADD CONSTRAINT "skill_similarities_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_similarities" ADD CONSTRAINT "skill_similarities_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_skills" ADD CONSTRAINT "task_skills_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_skills" ADD CONSTRAINT "task_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_preferences" ADD CONSTRAINT "task_preferences_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_preferences" ADD CONSTRAINT "task_preferences_personId_fkey" FOREIGN KEY ("personId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_formation_requests" ADD CONSTRAINT "team_formation_requests_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_teamFormationRequestId_fkey" FOREIGN KEY ("teamFormationRequestId") REFERENCES "team_formation_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
