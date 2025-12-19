-- Restore constraints that were on the old user table but not carried over
-- to the new personality_profiles table during the split migration.

-- Completeness constraint: all 4 personality scores must be present together or all null
ALTER TABLE "personality_profiles" ADD CONSTRAINT "personality_profiles_completeness_check" CHECK (
  (("ei" IS NULL AND "sn" IS NULL AND "tf" IS NULL AND "pj" IS NULL) OR
   ("ei" IS NOT NULL AND "sn" IS NOT NULL AND "tf" IS NOT NULL AND "pj" IS NOT NULL))
);

-- Range constraints: personality scores must be between -1.0 and 1.0
ALTER TABLE "personality_profiles" ADD CONSTRAINT "personality_profiles_ei_range_check" 
  CHECK ("ei" IS NULL OR ("ei" >= -1.0 AND "ei" <= 1.0));
ALTER TABLE "personality_profiles" ADD CONSTRAINT "personality_profiles_sn_range_check" 
  CHECK ("sn" IS NULL OR ("sn" >= -1.0 AND "sn" <= 1.0));
ALTER TABLE "personality_profiles" ADD CONSTRAINT "personality_profiles_tf_range_check" 
  CHECK ("tf" IS NULL OR ("tf" >= -1.0 AND "tf" <= 1.0));
ALTER TABLE "personality_profiles" ADD CONSTRAINT "personality_profiles_pj_range_check" 
  CHECK ("pj" IS NULL OR ("pj" >= -1.0 AND "pj" <= 1.0));

-- MBTI type consistency: mbtiType must be present if and only if all scores are present
ALTER TABLE "personality_profiles" ADD CONSTRAINT "personality_profiles_mbti_consistency_check" CHECK (
  ("mbtiType" IS NULL AND ("ei" IS NULL OR "sn" IS NULL OR "tf" IS NULL OR "pj" IS NULL)) OR
  ("mbtiType" IS NOT NULL AND "ei" IS NOT NULL AND "sn" IS NOT NULL AND "tf" IS NOT NULL AND "pj" IS NOT NULL)
);
