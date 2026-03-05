# Vercel React Best Practices Remediation TODO

- [x] Reduce root i18n payload serialization in `src/app/[locale]/layout.tsx`
- [x] Remove large `dict/messages` prop serialization in onboarding data diri flow
- [x] Remove large `dict/messages` prop serialization in onboarding kepribadian flow
- [x] Deduplicate repeated assignment fetches in answers route using request-level cache
- [x] Add cache for MBTI question bank loading to reduce repeated static DB reads
- [x] Guard debounced async combobox fetch against stale/racing responses
- [x] Remove derived-state syncing effect that may reset edits in manage courses dialog
- [x] Prevent hydration mismatch for client-side date formatting in class assignments
- [x] Prevent hydration mismatch for client-side date formatting in group card
- [x] Add `content-visibility` optimization for class grid items
- [x] Add `content-visibility` optimization for student class grid items
- [x] Add `content-visibility` optimization for class assignment list items
- [x] Add `content-visibility` optimization for student assignment list items
- [x] Stabilize SWR fetcher in assignment actions
- [x] Remove trivial `useMemo` in create class modal
- [x] Run lint/typecheck/tests for touched areas

Notes:
- Lint passed for all touched files.
- `bun run tsgo` still fails due pre-existing workspace issues (missing generated Prisma client and unrelated type errors outside this remediation set).
