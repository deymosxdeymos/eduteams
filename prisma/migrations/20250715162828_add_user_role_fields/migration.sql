-- AlterTable
ALTER TABLE "user" ADD COLUMN     "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nimNpm" TEXT,
ADD COLUMN     "role" TEXT;
