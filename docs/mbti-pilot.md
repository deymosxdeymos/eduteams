# MBTI Pilot Playbook

The MBTI v1 pilot replaces the provisional questionnaire with the validated 32-item Indonesian bank (plus one attention-check) and adds telemetry so we can evaluate reliability before rolling into production.

## 1. Schema Overview

- **PersonalityQuestion**: Versioned by `bankVersion`, scoped by `locale`, enriched with `status`, `orderHint`, `reversed`, and `isAttentionCheck`.
- **PersonalitySession**: Captures randomized order, timestamps, duration, attention-check outcome, and bank metadata per user run.
- **PersonalityResponse**: Stores raw Likert selections alongside the scored value and ordinal position.
- **PersonalityScore**: Normalized axis scores (EI / SN / TF / PJ) for the session, feeding user snapshots.

Refer to `prisma/schema.prisma` and the migration `20251016150324_mbti_v1_schema` for the exact model definitions and indexes.

## 2. Seeding the Validated Bank

`prisma/seed.ts` now seeds the 32 scored prompts plus one attention-check for `bankVersion = 1`, `locale = 'id-ID'`. The seed script:

1. Purges legacy banks and telemetry rows.
2. Inserts the new question metadata and validates eight items per axis.
3. Flags the attention-check with `isAttentionCheck = true` so scoring excludes it automatically.

Run the seed after applying migrations:

```bash
bun prisma migrate deploy
bun prisma db seed
```

## 3. Session Randomization & Guardrails

`src/lib/personality-session.ts` handles session lifecycle:

- Shuffles the active bank once per user session.
- Injects the attention-check between items 20–28.
- Prevents duplicate in-progress sessions and reuses pending ones.
- Rejects submissions that fail the attention check, skip items, or finish in under 60 seconds.
- Updates the user snapshot only when the latest session passes all filters.

Client flows (`onboarding/resume`, `data-diri`, `role`) read the session status to block duplicate attempts and fast-forward onboarded users to the dashboard.

## 4. Telemetry Exports & Analysis

### 4.1 Exporting Data

Use SQL (or Prisma) to export telemetry tables after the pilot window:

- `personality_sessions` → CSV/JSON (includes `id`, `userId`, `bankVersion`, `locale`, `attentionPassed`, `durationMs`, `submittedAt`).
- `personality_responses` → CSV/JSON (includes `sessionId`, `questionId`, `rawValue`, `scoredValue`, `position`).
- `personality_questions` → CSV/JSON (includes `id`, `bankVersion`, `locale`, `dimension`, `reversed`, `isAttentionCheck`, `orderHint`, `text`).

### 4.2 Running the Psychometrics CLI

The new Bun CLI lives at `scripts/psychometrics/analyze.ts`. It accepts telemetry exports, filters valid sessions, and reports reliability metrics.

```bash
bun scripts/psychometrics/analyze.ts \
  --sessions exports/personality_sessions.json \
  --responses exports/personality_responses.json \
  --questions exports/personality_questions.json \
  --bank-version 1 \
  --locale id-ID \
  --min-duration 60000 \
  --compute-test-retest \
  --output reports/mbti-v1-reliability.json
```

#### Key Outputs

- Cronbach’s alpha per axis (EI / SN / TF / PJ).
- Corrected item-total correlations with flags for items < 0.20.
- Optional test–retest correlations when multiple sessions exist per user.

Use `--json` to emit the full JSON payload to stdout instead of the readable summary.

### 4.3 Interpreting Results

- Target Cronbach’s alpha ≥ 0.70 per axis. Investigate items flagged with weak item-total correlations (< 0.20).
- For test–retest, aim for correlations ≥ 0.70 across axes. Review outliers by inspecting raw session exports.

## 5. Pilot Execution Checklist

1. **Dry-run QA**: Walk through onboarding with a test user, confirm telemetry rows populate, and ensure attention-check exclusion.
2. **Recruit & Collect**: Run the pilot with real participants, enforcing single valid session per bank version.
3. **Analyze**: Use the CLI to evaluate reliability, remove or revise underperforming items, and rerun as needed.
4. **Lock & Launch**: Once metrics meet thresholds, lock `bankVersion = 1`, flip the production feature flag, and retain telemetry for longitudinal benchmarks.

Keep this document updated as additional locales, banks, or analysis scripts land.

