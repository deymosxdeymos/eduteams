-- Ensure legacy index using snake_case is removed when present
DROP INDEX IF EXISTS "public"."courses_archived_at_idx";

-- Rename the legacy snake_case column when it exists; otherwise add the new column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'courses'
      AND column_name = 'archived_at'
  ) THEN
    ALTER TABLE "public"."courses" RENAME COLUMN "archived_at" TO "archivedAt";
  ELSIF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'courses'
      AND column_name = 'archivedAt'
  ) THEN
    ALTER TABLE "public"."courses" ADD COLUMN "archivedAt" TIMESTAMP(3);
  END IF;
END
$$;

-- Create the camelCase index if it is missing
CREATE INDEX IF NOT EXISTS "courses_archivedAt_idx" ON "courses"("archivedAt");
