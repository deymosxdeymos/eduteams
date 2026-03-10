# Vercel Audit Remediation Checklist

## Landing route static + bundle split

- [x] Remove `force-dynamic` from `src/app/[locale]/(marketing)/page.tsx` so the marketing route can render with default static behavior.
- [x] Replace eager `HeroMbtiCollage` and `AnimatedEntj` imports in `src/app/[locale]/(marketing)/page.tsx` with `next/dynamic` client-only imports.
- [x] Keep stable wrapper boxes around decorative landing animations so layout dimensions do not shift while chunks load.
- [x] Replace mascot barrel imports in `src/components/landing/hero-mbti-collage.tsx` with direct mascot-file imports.
- [x] Replace the mascot barrel import in `src/components/landing/animated-entj.tsx` with a direct mascot-file import.

## Dashboard modal lazy loading

- [x] Lazy-load `CreateClassModal` with `ssr: false` in `src/components/dashboard/empty-class-state.tsx`.
- [x] Lazy-load `JoinClassModal` with `ssr: false` in `src/components/dashboard/empty-student-class-state.tsx`.

## Assignment route server data dedupe

- [x] Add `gender` to the shared student shape returned by `getCourseAndStudents()` in `src/app/[locale]/dashboard/class/[id]/assignments/[assignmentId]/page.tsx`.
- [x] Reuse the server-fetched `students` array for both `StudentList` and assignment-content enrollment data on the assignment route.
- [x] Remove the duplicate `prisma.courseEnrollment.findMany()` query from `src/components/dashboard/async/assignment-detail-async.tsx`.
- [x] Derive `totalEnrollments`, `incompleteCount`, and `enrolledStudentsList` from the `students` prop in `src/components/dashboard/async/assignment-detail-async.tsx`.

## Client fetch gating

- [x] Stop `src/components/dashboard/student-list.tsx` from revalidating on mount when `initialData` is already present.
- [x] Gate `src/components/ui/multi-select-combobox-badges.tsx` suggestion fetching behind `showCombobox`, `popoverOpen`, and `suggestionsEndpoint`.
- [x] Keep cached combobox suggestions in component state across popover close/reopen, while aborting in-flight requests on close.
- [x] Avoid any suggestions fetch in simple-input mode for `src/components/ui/multi-select-combobox-badges.tsx`.

## Derived-state cleanup

- [x] Replace prop-mirroring state in `src/components/dashboard/manage-courses-view.tsx` with optimistic update/delete overlays derived from `courses`.
- [x] Replace prop-mirroring state in `src/components/dashboard/manage-assignments-view.tsx` with optimistic update/delete overlays derived from `assignments`.
- [x] Extract the stateful inner form from `src/components/dashboard/edit-assignment-modal.tsx` so assignment form state initializes on open without a prop-sync reset effect.
- [x] Replace assignment-content prop-sync reset effects in `src/components/dashboard/assignment-content.tsx` with explicit committed-team and removed-student overlays.
- [x] Dynamically load optional topics quiz pieces in `src/components/dashboard/assignment-quiz-client.tsx` only when `assignment.hasTopics` is true.

## Verification

- [x] Add a focused test covering no initial SWR refetch in `src/components/dashboard/student-list.tsx` when `initialData` exists.
- [x] Add a focused test covering deferred combobox suggestion fetching in `src/components/ui/multi-select-combobox-badges.tsx`.
- [x] Manually verify the landing page still renders correctly without decorative layout shift.
- [ ] Manually verify empty-state CTA buttons still open the correct modals.
- [x] Manually verify assignment roster, incomplete counts, and team editing flows after save/remove actions.
- [x] Run `bun run lint`.
- [x] Run `bun run tsgo`.
- [x] Run targeted tests for the updated client components.
- [x] Run `bun run build`.
