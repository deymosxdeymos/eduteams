-- AlterTable
ALTER TABLE "assignment_submissions" ADD COLUMN     "needsUpdate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "structureVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "assignments" ADD COLUMN     "structureUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "structureVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "assignment_snapshots" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "snapshotReason" TEXT,

    CONSTRAINT "assignment_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assignment_snapshots_assignmentId_idx" ON "assignment_snapshots"("assignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_snapshots_assignmentId_version_key" ON "assignment_snapshots"("assignmentId", "version");

-- CreateIndex
CREATE INDEX "assignment_submissions_needsUpdate_idx" ON "assignment_submissions"("needsUpdate");

-- AddForeignKey
ALTER TABLE "assignment_snapshots" ADD CONSTRAINT "assignment_snapshots_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
