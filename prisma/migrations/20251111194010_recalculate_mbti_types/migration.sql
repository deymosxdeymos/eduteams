-- Recalculate MBTI types from raw personality dimension scores
-- This fixes inconsistencies from seed data where mbtiType didn't match the raw scores

-- Update all users who have complete personality scores
UPDATE "user"
SET "mbtiType" = 
  CASE 
    -- Only recalculate if all dimension scores exist
    WHEN ei IS NULL OR sn IS NULL OR tf IS NULL OR pj IS NULL THEN "mbtiType"
    ELSE 
      -- Derive MBTI type from scores:
      -- ei >= 0 → E, ei < 0 → I
      -- sn >= 0 → N, sn < 0 → S  
      -- tf >= 0 → F, tf < 0 → T
      -- pj >= 0 → P, pj < 0 → J
      CAST(
        (CASE WHEN ei >= 0 THEN 'E' ELSE 'I' END) ||
        (CASE WHEN sn >= 0 THEN 'N' ELSE 'S' END) ||
        (CASE WHEN tf >= 0 THEN 'F' ELSE 'T' END) ||
        (CASE WHEN pj >= 0 THEN 'P' ELSE 'J' END)
      AS "MBTIType")
  END
WHERE 
  -- Only update records that have personality scores
  ei IS NOT NULL AND 
  sn IS NOT NULL AND 
  tf IS NOT NULL AND 
  pj IS NOT NULL;
