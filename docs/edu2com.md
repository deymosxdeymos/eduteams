# Edu2Com Integration Guide

This app delegates team formation to the external Edu2Com service. The canonical contracts live in `openapi.json` (see `/v1/teamFormation` and `/v1/backgroundTeamFormation`, lines 27-81). Keep code, fixtures, and tests aligned with the schema below.

## Request Contract
- `people`: required array (min 2). Each entry must include `id`, `personality` (`ei`, `sn`, `tf`, `pj` ∈ [-1,1]), at least one `skill` with `level` ∈ [0,1], optional `gender` (`MALE` | `FEMALE`), optional `preferences` with `{ personId, preference ∈ [0,1] }`. Schema: `src/lib/edu2com/contract.ts:24`.
- **Fallback skill**: If a student has no mapped skills, we inject a fallback skill (first declared skill at level 0) to satisfy the local Zod contract’s min(1) requirement. This prevents silent drops by Edu2com. See `src/app/api/assignments/[id]/form-teams/route.ts:299-303`.
- `tasks`: required array (min 1) with `id`, `teamSize ≥ 2`, at least one `skill` `{ id, level ∈ [0,1], importance ≥ 1 }`, optional `preferences` identical to people prefs. Schema: `src/lib/edu2com/contract.ts:41`.
- Optional knobs: `alpha`, `beta`, `gamma`, `delta` (each ∈ [0,1]), `initRandom`, and `similarities` (`{ sourceId, targetId, similarity ∈ [0,1] }`).

Authoritative payload builders live in `src/lib/edu2com/fixtures.ts` so test suites and routes share the same canonical shapes. The background variant simply extends the payload with a `replyPostUrl` that points to `POST /api/edu2com/webhook`, signed via `src/lib/edu2com/webhook.ts`.

## Response & Errors
- Success returns `{ teams: Array<{ taskId, quality ∈ [0,1], people: Array<{ id, skillIds[] }> }> }`. Schema validation happens in `src/lib/edu2com/contract.ts:60` and is enforced at runtime in `callEdu2comTeamFormation`/`callEdu2comBackgroundTeamFormation` (`src/lib/edu2com/api.ts`).
- Failure responses are documented as HTTP 400 (“Cannot form the teams with the provided data.”) or 422 (“The experiment is not valid.”). We surface these as `HttpError` instances, preserving the status code.

When background mode is used (default for `/api/assignments/[id]/form-teams`), the HTTP request returns immediately with `PROCESSING` status while the webhook route persists the resulting teams and revalidates dashboard caches.
- **Unassigned safety**: The webhook detects any input people not present in Edu2com’s response and appends them to the smallest teams before persisting. This guarantees every submitted student is assigned. See `src/app/api/edu2com/webhook/route.ts:88-101`.

## Testing Strategy
1. **Schema tests** – `src/lib/edu2com/__tests__/team-formation.contract.test.ts` validates curated fixtures with `edu2comParametersSchema` and exercises the live API only when `EDU2COM_INTEGRATION=1` is set.
2. **Route behaviour** – `src/app/api/assignments/[id]/form-teams/__tests__/route.test.ts` stubs `callEdu2comBackgroundTeamFormation` to cover application-specific error handling without hitting the network, including concurrency protection.
3. **Live smoke tests** – Opt-in scenarios in the contract test call the real endpoint to detect upstream regressions; assertions focus on status codes and schema validation rather than brittle message fragments.

When adding new edge cases, update the fixtures first, extend the schema test, and document the behaviour here with a link back to the spec section in `openapi.json`.
