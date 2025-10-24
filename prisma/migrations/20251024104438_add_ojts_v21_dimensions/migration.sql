-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PersonalityAxis" ADD VALUE 'i';
ALTER TYPE "PersonalityAxis" ADD VALUE 'e';
ALTER TYPE "PersonalityAxis" ADD VALUE 's';
ALTER TYPE "PersonalityAxis" ADD VALUE 'n';
ALTER TYPE "PersonalityAxis" ADD VALUE 'f';
ALTER TYPE "PersonalityAxis" ADD VALUE 't';
ALTER TYPE "PersonalityAxis" ADD VALUE 'j';
ALTER TYPE "PersonalityAxis" ADD VALUE 'p';
ALTER TYPE "PersonalityAxis" ADD VALUE 'nj';
ALTER TYPE "PersonalityAxis" ADD VALUE 'np';
ALTER TYPE "PersonalityAxis" ADD VALUE 'sj';
ALTER TYPE "PersonalityAxis" ADD VALUE 'sp';
ALTER TYPE "PersonalityAxis" ADD VALUE 'ef';
ALTER TYPE "PersonalityAxis" ADD VALUE 'et';
ALTER TYPE "PersonalityAxis" ADD VALUE 'if';
ALTER TYPE "PersonalityAxis" ADD VALUE 'it';
