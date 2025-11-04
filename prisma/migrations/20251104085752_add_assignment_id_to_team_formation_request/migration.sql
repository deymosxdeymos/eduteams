-- AlterTable
ALTER TABLE "team_formation_requests" ADD COLUMN     "assignmentId" TEXT;

-- CreateIndex
CREATE INDEX "team_formation_requests_assignmentId_idx" ON "team_formation_requests"("assignmentId");

-- AddForeignKey
ALTER TABLE "team_formation_requests" ADD CONSTRAINT "team_formation_requests_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
