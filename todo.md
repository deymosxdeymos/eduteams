# React / Next Best Practice Review

Source of review: `vercel-react-best-practices` skill in `AGENTS.md`

## Critical

1. Server waterfall in [src/components/dashboard/student-manage-content.tsx](/home/deymos/Documents/eduteams/src/components/dashboard/student-manage-content.tsx)
   - Relevant lines: `19`, `59`, `114`, `131`, `202`
   - Current flow serializes enrollments, assignments, submissions, per-assignment topic lookups, and fallback team-formation fetches.
   - Vercel guidance: flatten independent server work and parallelize where possible.

## High

2. Server waterfall and duplicate lookup in [src/app/[locale]/dashboard/class/[id]/page.tsx](/home/deymos/Documents/eduteams/src/app/[locale]/dashboard/class/[id]/page.tsx)
   - Relevant lines: `21`, `54`, `118`, `124`, `130`
   - Access check and full course fetch duplicate course/user lookup work.
   - Access check, course fetch, and student fetch are serialized before render.

3. Sequential fetches and duplicate course query in [src/app/[locale]/dashboard/manage/assignments/[courseId]/page.tsx](/home/deymos/Documents/eduteams/src/app/[locale]/dashboard/manage/assignments/[courseId]/page.tsx) and [src/lib/data/manage-assignments.ts](/home/deymos/Documents/eduteams/src/lib/data/manage-assignments.ts)
   - Relevant lines: page `71`, `77`, `78`; data helper `8`
   - Page fetches course, assignments, and students sequentially.
   - Helper performs another course authorization query internally.

4. Effect-driven client fetching and polling in [src/hooks/use-team-formation-status.ts](/home/deymos/Documents/eduteams/src/hooks/use-team-formation-status.ts)
   - Relevant lines: `104`, `113`
   - Hook fetches in `useEffect` and manages polling in a second effect.
   - This bypasses shared cache/deduping patterns recommended by Vercel.

5. Post-hydration refetch of server-owned data in [src/components/dashboard/student-list.tsx](/home/deymos/Documents/eduteams/src/components/dashboard/student-list.tsx)
   - Relevant line: `125`
   - Client SWR fetch runs when `canManage` is true even if `initialData` already exists.

6. Route handler starts `request.json()` too late in [src/app/api/courses/[id]/assignments/[assignmentId]/submit/route.ts](/home/deymos/Documents/eduteams/src/app/api/courses/[id]/assignments/[assignmentId]/submit/route.ts)
   - Relevant lines: `20`, `28`, `39`, `49`, `59`
   - Params resolution, enrollment lookup, assignment lookup, and submission lookup all finish before body parsing starts.

## Medium

7. Eager modal imports in [src/components/dashboard/search-input.tsx](/home/deymos/Documents/eduteams/src/components/dashboard/search-input.tsx)
   - Relevant lines: `9`, `10`, `49`, `53`, `55`
   - Statically imports [src/components/dashboard/create-class-modal.tsx](/home/deymos/Documents/eduteams/src/components/dashboard/create-class-modal.tsx) and [src/components/dashboard/join-class-modal.tsx](/home/deymos/Documents/eduteams/src/components/dashboard/join-class-modal.tsx).
   - These are button-triggered overlays and should be lazy boundaries.

8. Eager overlay imports in [src/components/dashboard/class-assignments.tsx](/home/deymos/Documents/eduteams/src/components/dashboard/class-assignments.tsx)
   - Relevant lines: `13`, `16`, `266`, `272`
   - `ShareClassModal` and `CreateAssignmentModal` are imported and mounted eagerly.

9. Radar chart loaded before needed in [src/components/dashboard/personality-metrics.tsx](/home/deymos/Documents/eduteams/src/components/dashboard/personality-metrics.tsx)
   - Relevant lines: `15`, `26`, `130`
   - Eagerly loads [src/components/dashboard/personality-radar-chart.tsx](/home/deymos/Documents/eduteams/src/components/dashboard/personality-radar-chart.tsx) even though the initial view is not the radar tab.

10. Broad Recharts namespace import in [src/components/ui/chart.tsx](/home/deymos/Documents/eduteams/src/components/ui/chart.tsx)
   - Relevant line: `4`
   - `import * as RechartsPrimitive from 'recharts'` widens the client bundle.

11. Global listeners kept alive too broadly in [src/components/dashboard/student-list.tsx](/home/deymos/Documents/eduteams/src/components/dashboard/student-list.tsx)
   - Relevant lines: `190`, `202`
   - Document click and keydown listeners are attached for mostly inactive UI states.

12. Non-passive scroll listener with DOM reads in [src/components/ui/scroll-to-top-button.tsx](/home/deymos/Documents/eduteams/src/components/ui/scroll-to-top-button.tsx)
   - Relevant line: `9`
   - Uses a global scroll listener without `{ passive: true }` and performs DOM reads on every scroll.

13. Unnecessary client prop serialization in [src/components/dashboard/dashboard-client.tsx](/home/deymos/Documents/eduteams/src/components/dashboard/dashboard-client.tsx)
   - Relevant lines: `7`, `14`
   - Accepts a full `user` prop it does not use, causing avoidable RSC-to-client serialization from multiple pages.

## Low

14. JSX `&&` conditional rendering in:
   - [src/components/dashboard/content.tsx](/home/deymos/Documents/eduteams/src/components/dashboard/content.tsx) line `140`
   - [src/components/dashboard/assignment-charts.tsx](/home/deymos/Documents/eduteams/src/components/dashboard/assignment-charts.tsx) line `73`
   - Vercel guidance prefers explicit ternary/null branches.

## Suggested Fix Order

1. Flatten server waterfalls in dashboard pages and `student-manage-content`.
2. Refactor client effect-driven fetching in `use-team-formation-status` and `student-list`.
3. Defer heavy modal and chart bundles with `next/dynamic`.
4. Remove unnecessary client serialization and broad listeners.
