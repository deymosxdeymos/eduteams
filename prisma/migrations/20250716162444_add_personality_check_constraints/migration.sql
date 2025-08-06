-- Add check constraints for personality scores (-1.0 to 1.0)
ALTER TABLE "user" ADD CONSTRAINT "user_ei_range_check" CHECK ("ei" IS NULL OR ("ei" >= -1.0 AND "ei" <= 1.0));
ALTER TABLE "user" ADD CONSTRAINT "user_sn_range_check" CHECK ("sn" IS NULL OR ("sn" >= -1.0 AND "sn" <= 1.0));
ALTER TABLE "user" ADD CONSTRAINT "user_tf_range_check" CHECK ("tf" IS NULL OR ("tf" >= -1.0 AND "tf" <= 1.0));
ALTER TABLE "user" ADD CONSTRAINT "user_pj_range_check" CHECK ("pj" IS NULL OR ("pj" >= -1.0 AND "pj" <= 1.0));

-- Add check constraint for complete personality data (all dimensions must be present together)
ALTER TABLE "user" ADD CONSTRAINT "user_personality_completeness_check" CHECK (
  (("ei" IS NULL AND "sn" IS NULL AND "tf" IS NULL AND "pj" IS NULL) OR
   ("ei" IS NOT NULL AND "sn" IS NOT NULL AND "tf" IS NOT NULL AND "pj" IS NOT NULL))
);

-- Add check constraint for MBTI type consistency with personality scores
ALTER TABLE "user" ADD CONSTRAINT "user_mbti_consistency_check" CHECK (
  ("mbtiType" IS NULL AND ("ei" IS NULL OR "sn" IS NULL OR "tf" IS NULL OR "pj" IS NULL)) OR
  ("mbtiType" IS NOT NULL AND "ei" IS NOT NULL AND "sn" IS NOT NULL AND "tf" IS NOT NULL AND "pj" IS NOT NULL)
);

-- Add JSON schema validation for personalityData
ALTER TABLE "user" ADD CONSTRAINT "user_personality_data_schema_check" CHECK (
  "personalityData" IS NULL OR (
    jsonb_typeof("personalityData") = 'object' AND
    (
      ("personalityData" ? 'answers' AND jsonb_typeof("personalityData"->'answers') = 'object') OR
      ("personalityData" ? 'scores' AND jsonb_typeof("personalityData"->'scores') = 'object') OR
      ("personalityData" ? 'metadata' AND jsonb_typeof("personalityData"->'metadata') = 'object')
    )
  )
);

-- Add constraint for skill level ranges
ALTER TABLE "person_skills" ADD CONSTRAINT "person_skills_level_range_check" CHECK ("level" >= 0.0 AND "level" <= 10.0);

-- Add constraint for preference ranges
ALTER TABLE "person_preferences" ADD CONSTRAINT "person_preferences_preference_range_check" CHECK ("preference" >= -1.0 AND "preference" <= 1.0);

-- Add constraint for task preference ranges
ALTER TABLE "task_preferences" ADD CONSTRAINT "task_preferences_preference_range_check" CHECK ("preference" >= -1.0 AND "preference" <= 1.0);

-- Add constraint for skill similarity ranges
ALTER TABLE "skill_similarities" ADD CONSTRAINT "skill_similarities_similarity_range_check" CHECK ("similarity" >= 0.0 AND "similarity" <= 1.0);

-- Add constraint for task skill level and importance ranges
ALTER TABLE "task_skills" ADD CONSTRAINT "task_skills_level_range_check" CHECK ("level" >= 0.0 AND "level" <= 10.0);
ALTER TABLE "task_skills" ADD CONSTRAINT "task_skills_importance_range_check" CHECK ("importance" >= 0.0 AND "importance" <= 1.0);

-- Add constraint to prevent self-preferences
ALTER TABLE "person_preferences" ADD CONSTRAINT "person_preferences_no_self_preference_check" CHECK ("personId" != "preferredPersonId");

-- Add constraint for team formation request parameters
ALTER TABLE "team_formation_requests" ADD CONSTRAINT "team_formation_requests_alpha_range_check" CHECK ("alpha" IS NULL OR ("alpha" >= 0.0 AND "alpha" <= 1.0));
ALTER TABLE "team_formation_requests" ADD CONSTRAINT "team_formation_requests_beta_range_check" CHECK ("beta" IS NULL OR ("beta" >= 0.0 AND "beta" <= 1.0));
ALTER TABLE "team_formation_requests" ADD CONSTRAINT "team_formation_requests_gamma_range_check" CHECK ("gamma" IS NULL OR ("gamma" >= 0.0 AND "gamma" <= 1.0));
ALTER TABLE "team_formation_requests" ADD CONSTRAINT "team_formation_requests_delta_range_check" CHECK ("delta" IS NULL OR ("delta" >= 0.0 AND "delta" <= 1.0));

-- Add constraint for team quality ranges
ALTER TABLE "teams" ADD CONSTRAINT "teams_quality_range_check" CHECK ("quality" IS NULL OR ("quality" >= 0.0 AND "quality" <= 1.0));

-- Add constraint for team size
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_team_size_positive_check" CHECK ("teamSize" > 0);