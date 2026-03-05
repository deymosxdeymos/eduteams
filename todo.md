# React Best-Practice Cut-Off TODO

Date: 2026-03-05
Method: Parallel subagent audit (`dashboard/hooks`, `app/lib`, `ui/onboarding`) + direct fixes.
Rule: Cut-off approach only. No backward-compatibility shims.

## Completed

- [x] Make Likert choices keyboard-accessible radio controls in `src/components/onboarding/kepribadian/personality-question.tsx`.
- [x] Migrate onboarding instruction modal to accessible dialog primitives in `src/components/onboarding/kepribadian/instruction-modal.tsx`.
- [x] Fix blocked-submit flow so feedback still works when role is invalid in `src/components/onboarding/role/role-form-client.tsx`.
- [x] Remove duplicate Enter handlers on native buttons in:
  - `src/components/onboarding/role/role-select.tsx`
  - `src/components/onboarding/data-diri/data-diri-form-client.tsx`
- [x] Replace clickable SVG remove controls with real buttons and stable list keys in `src/components/ui/multi-select-combobox-badges.tsx`.
- [x] Restore Radix dialog description wiring by removing forced `aria-describedby={undefined}` in `src/components/ui/dialog.tsx`.
- [x] Remove skip-link auto-blur anti-pattern in `src/components/ui/skip-link.tsx`.
- [x] Make footer observation resilient to late footer mount in `src/components/ui/scroll-to-top-button.tsx`.
- [x] Stop noisy per-skeleton live-region announcements in `src/components/ui/skeleton.tsx`.
- [x] Improve non-critical splash completion call reliability with `keepalive` in `src/components/dashboard/dashboard-client.tsx`.
- [x] Disable focus/reconnect refetch churn for static-ish SWR reads in:
  - `src/components/dashboard/sidebar-wrapper.tsx`
  - `src/components/dashboard/class-assignments.tsx`
  - `src/components/dashboard/student-class-assignments.tsx`
- [x] Remove global assignment event bus and route-wide refresh coupling by using explicit callbacks/local updates in:
  - `src/components/dashboard/create-assignment-modal.tsx`
  - `src/components/dashboard/class-assignments.tsx`
  - `src/components/dashboard/edit-assignment-modal.tsx`
  - `src/components/dashboard/manage-assignments-view.tsx`
- [x] Add explicit server-only boundaries in:
  - `src/lib/prisma.ts`
  - `src/lib/api-utils.ts`
  - `src/lib/server-auth.ts`
  - `src/lib/data/course-data.ts`

## Remaining Backlog (Not Yet Implemented)

- [ ] Remove broad `router.refresh()` usage after row-level mutations in `manage-courses-view` and `team-member-list-client` via targeted optimistic updates.
- [ ] Deduplicate metadata/page DB reads in dynamic dashboard pages by sharing cached server helpers.
- [ ] Batch sequential route-handler DB writes in submit endpoint (`src/app/api/courses/[id]/assignments/[assignmentId]/submit/route.ts`).
- [ ] Convert side-effecting GET endpoints to POST semantics where applicable.
