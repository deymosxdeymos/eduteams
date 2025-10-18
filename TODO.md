TODO – MBTI Pilot Upgrade
=========================

Context: Replace the provisional MBTI questionnaire with the validated 32-item bank (plus attention check), add telemetry for randomized delivery, and support reliability analysis so the team-matching feature uses trustworthy scores.

1. Prisma Schema & Migrations
   - [ ] Extend `PersonalityQuestion` with `bankVersion`, `status` (`draft|active|retired`), `locale`, `orderHint`, `reversed`, and `isAttentionCheck`.
   - [ ] Introduce relational telemetry tables:
     - `PersonalitySession` (user, bankVersion, presentedOrder JSON, startedAt/submittedAt, durationMs, attentionPassed).
     - `PersonalityResponse` (sessionId, questionId, rawValue, scoredValue, position).
     - `PersonalityScore` (sessionId, ei/sn/tf/pj floats, letters).
   - [ ] Add enums (`PersonalityAxis`, `BankStatus`) to keep Prisma type-safe.
   - [ ] Generate migration, run `bun prisma generate`, and verify against `AGENTS.md` guidelines.

2. Seed Data
   - [ ] Replace `mbtiQuestions` in `prisma/seed.ts` with the vetted 32 scored items (bankVersion = 1, status = active, locale = 'id-ID').
   - [ ] Append the attention-check item (orderHint ≈ 33, `isAttentionCheck = true`, excluded from scoring).
   - [ ] Ensure seeding clears old data safely and populates the new columns.

3. Scoring & Persistence Refactor
   - [ ] Remove hard-coded reversed ordinals in `src/lib/personality.ts` and rely on DB metadata via `calculatePersonalityScoresFromQuestions`.
   - [ ] Update server action (`submitPersonalityTest`) and API route (`/api/user/personality`) to create/read `PersonalitySession`, persist responses, and store computed scores.
   - [ ] Persist `presentedOrder`, `durationMs`, and `attentionPassed` so junk submissions can be filtered later.

4. Onboarding Client Flow
   - [ ] Request a new session (fetch shuffled questions + sessionId) before rendering the personality test.
   - [ ] Shuffle once on mount, insert the attention check at a random mid-range position, and keep the ID order for submission.
   - [ ] Track start/end timestamps, block submission if the attention check fails, and POST both answers and telemetry (`presentedOrder`, `durationMs`, sessionId).

5. Analysis Tooling
   - [ ] Create `scripts/psychometrics/analyze.ts` (Bun CLI) to ingest CSV/JSON exports, filter by bankVersion, drop failed checks/speeders, and output per-axis Cronbach’s alpha plus corrected item–total correlations.
   - [ ] Optionally compute test–retest correlations when a second session exists for the same user.

6. Documentation & Ops
   - [ ] Write `docs/mbti-pilot.md` covering schema rationale, seeding steps, survey configuration, pilot collection targets, data-cleaning rules, analysis script usage, and rollout checklist (feature flag, cut-over plan, retention of legacy data).
   - [ ] Note retake policy (one valid session per user per bank version) and any admin overrides needed.

7. QA & Pilot Execution
   - [ ] Dry-run onboarding flow end-to-end with the new schema to confirm telemetry tables populate correctly.
   - [ ] Validate seed counts and confirm the attention check never appears in scoring aggregates.
   - [ ] After pilot data arrives, run the analysis script, adjust items below thresholds, and lock bankVersion 1 for production use.

