CREATE TYPE "TeamFormationProvider" AS ENUM ('LOCAL', 'EDU2COM');

ALTER TABLE "team_formation_requests"
ADD COLUMN "provider" "TeamFormationProvider" NOT NULL DEFAULT 'EDU2COM';
