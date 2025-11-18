# Edu2com API - Quick Reference

## Overview

The Edu2com API (`https://ardid.iiia.csic.es/eduteams/edu2com`) is a team formation service for educational tasks. It uses an algorithm balancing:
- **Skills** (alpha: 0.0-1.0)
- **Personality compatibility** (beta: 0.0-1.0) - MBTI-based
- **Student preferences** (gamma: 0.0-1.0)
- **Task preferences** (delta: 0.0-1.0)

## API Endpoints

### GET /v1/help
Returns API info. **Response:** `{ "name": "Edu2com", "version": "0.5.0" }`

### POST /v1/teamFormation (Synchronous)
Forms teams immediately. Returns `{ teams: [...] }` with `taskId`, `quality` (0-1), and `people`.

**Error codes:** `200` ok, `400` insufficient students, `422` invalid payload

### POST /v1/backgroundTeamFormation (Asynchronous)
Returns `202 Accepted`. Requires `replyPostUrl` for webhook callback.

### POST /v1/teamQuality
Calculates quality for a given team composition.

## Parameters

| Parameter | Range | Effect |
|-----------|-------|--------|
| `alpha` | 0.0-1.0 | Skill matching weight |
| `beta` | 0.0-1.0 | Personality compatibility (MBTI) |
| `gamma` | 0.0-1.0 | Student preference weight |
| `delta` | 0.0-1.0 | Task preference weight |
| `initRandom` | boolean | Deterministic (false) or randomized (true) |

**Note:** Weights don't need to sum to 1.0. With all weights at 1.0, quality scores can exceed 1.0.

Reference schema: `openapi.json#/components/schemas/Edu2comParameters`. The OpenAPI spec documents the ranges above but does **not** promise deterministic results when tweaking `alpha`/`beta`/`gamma`/`delta`, so use the integration suite to observe reproducibility characteristics.

## Key Behaviors

✅ **Works:**
- Minimum 2 people, 1 task with teamSize ≥ 2
- Team sizes match task requirements exactly
- All students assigned to max 1 team (no duplicates)
- Quality scores exposed to the rest of the app are now clamped to [0.0, 1.0] even when the upstream API emits >1.0 values
- Unicode IDs, UUIDs, numbers supported
- Personality values clamped to [-1.0, 1.0]
- Circular & conflicting preferences handled
- All-male/all-female/mixed cohorts work
- Optional gender field

⚠️ **Important:**
- With `initRandom=false`: assignments are deterministic—same people get grouped together and assigned to the same tasks. However, the response array order may vary, so normalize results (sort teams by `taskId`, sort people IDs within teams) before comparing in tests.
- Few students may be left unassigned if `total_seats < total_students`
- When `alpha + beta + gamma + delta > 1.0` the upstream API frequently emits `quality > 1.0`; the client now clamps to [0,1] and logs a warning.

## Performance

| Size | Timeout | Observed Time | Status |
|------|---------|---------------|--------|
| 4 students | 10s | ~1s | ✅ Reliable |
| 8 students | 15s | ~2s | ✅ Reliable |
| 20 students | 30s | ~13s | ✅ Reliable |
| 40 students | 60s | ~35s | ✅ Reliable |
| 60+ students | 120s | ~60s (timeout) | ❌ Unreliable* |

\* Synchronous `/teamFormation` requests with ≥60 students or ≥15 tasks consistently return `504 Gateway Time-out` or `EDU2COM_INVALID_RESPONSE` after ~60s. **Use `/backgroundTeamFormation` (webhook) for cohorts above 50 students** or split into smaller batches.

### Observations from the live integration suite (Jan 2025)

- **Quality normalization:** Setting all weights to 1.0 consistently produced `quality` scores above 1.0. The client now clamps upstream values into [0,1] before returning them downstream.
- **Deterministic behavior:** With `initRandom=false`, team compositions and task assignments are fully deterministic. However, the response array order may vary between requests. Tests must normalize results (sort teams by `taskId`, sort `people` IDs within each team) before comparing, as the API does not guarantee a stable response order.
- **Response ordering caveat:** While assignments are stable, the API may return teams in different array positions across identical requests. This is a presentation issue, not a logic change—use `normalizeTeamsForComparison` helper when testing.
- **Throughput limits:** synchronous `/teamFormation` calls with 60, 80, or 100 students (15–25 tasks) fail with `504 Gateway Time-out`. Use the background endpoint or chunk requests for anything above ~50 students.
- **Timeout semantics:** the upstream service ignores our requested timeout; without client-side safeguards the request resolved only when Edu2com responded (≈21s in tests). The API client now enforces timeouts locally and throws `EDU2COM_TIMEOUT` / `EDU2COM_BACKGROUND_TIMEOUT`.
- **Burst traffic:** running 10+ property-based trials back-to-back triggered sporadic `502/504` responses even for moderate payloads. Space out load tests or add exponential backoff when exercising the real API.

### Timeouts & reliability knobs

- `timeoutMs` parameter (and `EDU2COM_TIMEOUT_MS` env var) now caps the total time we wait. Once exceeded we abort the request and throw `EDU2COM_TIMEOUT` (synchronous) or `EDU2COM_BACKGROUND_TIMEOUT` (background).
- Despite the abort signal, the upstream service may continue processing. Always treat timeouts as unknown state and consider retrying with a new `requestId`.
- For heavy cohorts, prefer `/backgroundTeamFormation` so Edu2com can finish asynchronously and call back via `replyPostUrl` instead of timing out the HTTP response.
- Background POSTs now scale their timeout budget based on cohort size (students + tasks). Override the heuristic globally with `EDU2COM_BACKGROUND_TIMEOUT_MS`.

## Testing

Run integration tests with live API:

```bash
# All tests
EDU2COM_INTEGRATION=1 bun test src/lib/edu2com/__tests__

# Specific suite
EDU2COM_INTEGRATION=1 bun test src/lib/edu2com/__tests__/api-endpoints.integration.test.ts
```

**Test files:**
- `api-endpoints.integration.test.ts` - All 4 endpoints
- `weight-parameters.integration.test.ts` - Alpha/beta/gamma/delta combinations
- `edge-cases.integration.test.ts` - Unicode, boundaries, odd distributions
- `property-based.integration.test.ts` - Random inputs & invariants
- `performance.integration.test.ts` - Speed benchmarks

## Request Schema

```typescript
{
  people: Array<{
    id: string;
    gender?: "MALE" | "FEMALE";
    personality: { ei: -1...1, sn: -1...1, tf: -1...1, pj: -1...1 };
    skills: Array<{ id: string, level: 0...1 }>;
    preferences?: Array<{ personId: string, preference: 0...1 }>;
  }>;
  tasks: Array<{
    id: string;
    teamSize: number; // ≥ 2
    skills: Array<{ id: string, level: 0...1, importance: number }>;
    preferences?: Array<{ personId: string, preference: 0...1 }>;
  }>;
  alpha?: number;
  beta?: number;
  gamma?: number;
  delta?: number;
  initRandom?: boolean;
}
```

## Common Issues

**Quality validation fails (> 1.0):**
- This is now handled automatically in `callEdu2comTeamFormation`, but keep an eye on warnings so we can report issues upstream.
- If you consume Edu2com elsewhere, clamp manually: `Math.min(1.0, team.quality)`.

**Response array ordering with initRandom=false:**
- Team compositions AND task assignments are fully deterministic and reproducible
- Only the response array order may vary—normalize before comparing (sort by `taskId`, sort people IDs)

**Personality validation errors:**
- Clamp all MBTI values to [-1.0, 1.0]: `Math.max(-1, Math.min(1, value))`

## Defaults (Recommended)

```json
{
  "alpha": 0.4,
  "beta": 0.3,
  "gamma": 0.2,
  "delta": 0.1,
  "initRandom": false
}
```

Set `EDU2COM_ALPHA_WEIGHT`, `EDU2COM_BETA_WEIGHT`, `EDU2COM_GAMMA_WEIGHT`, or `EDU2COM_DELTA_WEIGHT` to override the defaults above. Each team formation request now records the weights (and `initRandom`) in `team_formation_requests` for auditing.

---

**Last Updated:** 2025-01-18 | **Coverage:** 93 passing tests, 500+ scenarios | **Test Results:** 93 pass, 6 skip, 1 fail (timeout-related)
