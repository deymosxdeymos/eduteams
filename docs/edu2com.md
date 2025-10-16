# Edu2Com Integration Guide

This app delegates team formation to the external Edu2Com service. The canonical contract lives in `openapi.json` (see `/v1/teamFormation`, lines 27-54). Keep code, fixtures, and tests aligned with the schema below.

## Request Contract
- `people`: required array (min 2). Each entry must include `id`, `personality` (`ei`, `sn`, `tf`, `pj` ∈ [-1,1]), at least one `skill` with `level` ∈ [0,1], optional `gender` (`MALE` | `FEMALE`), optional `preferences` with `{ personId, preference ∈ [0,1] }`. Schema: `src/lib/edu2com/contract.ts:24`.
- `tasks`: required array (min 1) with `id`, `teamSize ≥ 2`, at least one `skill` `{ id, level ∈ [0,1], importance ≥ 1 }`, optional `preferences` identical to people prefs. Schema: `src/lib/edu2com/contract.ts:41`.
- Optional knobs: `alpha`, `beta`, `gamma`, `delta` (each ∈ [0,1]), `initRandom`, and `similarities` (`{ sourceId, targetId, similarity ∈ [0,1] }`).

Authoritative payload builders live in `src/lib/edu2com/fixtures.ts` so test suites and routes share the same canonical shapes.

## Response & Errors
- Success returns `{ teams: Array<{ taskId, quality ∈ [0,1], people: Array<{ id, skillIds[] }> }> }`. Schema validation happens in `src/lib/edu2com/contract.ts:60` and is enforced at runtime in `callEdu2comTeamFormation` (`src/lib/edu2com/api.ts:11`).
- Failure responses are documented as HTTP 400 (“Cannot form the teams with the provided data.”) or 422 (“The experiment is not valid.”). We surface these as `HttpError` instances, preserving the status code.

## Testing Strategy
1. **Schema tests** – `src/lib/edu2com/__tests__/team-formation.contract.test.ts` validates curated fixtures with `edu2comParametersSchema` and exercises the live API only when `EDU2COM_INTEGRATION=1` is set.
2. **Route behaviour** – `src/app/api/assignments/[id]/form-teams/__tests__/route.test.ts` stubs `callEdu2comTeamFormation` to cover application-specific error handling without hitting the network.
3. **Live smoke tests** – Opt-in scenarios in the contract test call the real endpoint to detect upstream regressions; assertions focus on status codes and schema validation rather than brittle message fragments.

When adding new edge cases, update the fixtures first, extend the schema test, and document the behaviour here with a link back to the spec section in `openapi.json`.
