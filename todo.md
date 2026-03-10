# React Best-Practice Cut-Off TODO

Date: 2026-03-05
Method: Parallel subagent audit (`dashboard/hooks`, `app/lib`, `ui/onboarding`) + direct fixes.
Rule: Cut-off approach only. No backward-compatibility shims.

## Current Backlog

- [x] Remove broad `router.refresh()` usage after row-level mutations in `manage-courses-view` and `team-member-list-client` via targeted optimistic updates.
- [x] Deduplicate metadata/page DB reads in dynamic dashboard pages by sharing cached server helpers.
- [x] Batch sequential route-handler DB writes in submit endpoint (`src/app/api/courses/[id]/assignments/[assignmentId]/submit/route.ts`).
- [x] Convert remaining side-effecting GET endpoints to explicit mutation semantics where appropriate:
  - `src/app/api/auth/clear-session/route.ts`

## Notes

- `src/app/api/cron/cleanup-stale-requests/route.ts` remains `GET` because the scheduled invoker relies on that contract.
