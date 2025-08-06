-- CreateEnum
CREATE TYPE "MBTIType" AS ENUM ('ENFJ', 'ENFP', 'ENTJ', 'ENTP', 'ESFJ', 'ESFP', 'ESTJ', 'ESTP', 'INFJ', 'INFP', 'INTJ', 'INTP', 'ISFJ', 'ISFP', 'ISTJ', 'ISTP');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "mbtiType" "MBTIType",
ADD COLUMN     "personalityData" JSONB;

-- CreateIndex
CREATE INDEX "team_formation_requests_requestData_idx" ON "team_formation_requests" USING GIN ("requestData");

-- CreateIndex
CREATE INDEX "team_formation_requests_responseData_idx" ON "team_formation_requests" USING GIN ("responseData");

-- CreateIndex
CREATE INDEX "team_members_assignedSkillIds_idx" ON "team_members" USING GIN ("assignedSkillIds");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE INDEX "user_isOnboarded_idx" ON "user"("isOnboarded");

-- CreateIndex
CREATE INDEX "user_onboardingStep_idx" ON "user"("onboardingStep");

-- CreateIndex
CREATE INDEX "user_onboardingData_idx" ON "user" USING GIN ("onboardingData");

-- CreateIndex
CREATE INDEX "user_mbtiType_idx" ON "user"("mbtiType");

-- CreateIndex
CREATE INDEX "user_ei_idx" ON "user"("ei");

-- CreateIndex
CREATE INDEX "user_sn_idx" ON "user"("sn");

-- CreateIndex
CREATE INDEX "user_tf_idx" ON "user"("tf");

-- CreateIndex
CREATE INDEX "user_pj_idx" ON "user"("pj");

-- CreateIndex
CREATE INDEX "user_personalityData_idx" ON "user" USING GIN ("personalityData");
