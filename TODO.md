# TODO - Code Review Concerns Resolution

## Overview
Addressing concerns identified in uncommitted changes review:
- Code duplication in data fetching functions
- TypeScript `any` types usage
- Dashboard layout verification needed
- Quality assurance checks

---

## Phase 1: Code Deduplication (High Priority)

### Task 1.1: Create Shared Data Fetching Utilities
**File:** `src/lib/data/course-data.ts`

- [ ] Extract `getInitialAssignments` function
  - Currently duplicated in:
    - `src/components/dashboard/async/class-assignments-async.tsx:23-58`
    - `src/components/dashboard/async/student-class-data-async.tsx:20-55`
  - Add role-based authorization parameter
  - Use Prisma `select` to avoid over-fetching
  - Return proper `AssignmentResponse[]` type

- [ ] Extract `getStudentsData` function
  - Currently duplicated in:
    - `src/app/[locale]/dashboard/class/[id]/page.tsx:52`
    - `src/components/dashboard/async/class-assignments-async.tsx:61`
  - Consolidate into single implementation
  - Return proper `StudentData[]` type

### Task 1.2: Create Shared Type Definitions
**File:** `src/types/course.ts` or extend existing types

- [ ] Create `StudentData` type definition
  - Currently duplicated 3x across async components
  - Include: id, name, nim, email, mbtiType, ei, sn, tf, pj, enrolledAt
  - Export for reusability

### Task 1.3: Update All Consuming Files

- [ ] Update `src/components/dashboard/async/class-assignments-async.tsx`
  - Import shared `getInitialAssignments` and `getStudentsData`
  - Import shared `StudentData` type
  - Remove local duplicates

- [ ] Update `src/components/dashboard/async/student-class-data-async.tsx`
  - Import shared `getInitialAssignments`
  - Import shared `StudentData` type
  - Remove local duplicates

- [ ] Update `src/app/[locale]/dashboard/class/[id]/page.tsx`
  - Import shared `getStudentsData`
  - Remove local duplicate

---

## Phase 2: Type Safety Improvements (Medium Priority)

### Task 2.1: Fix Course Type Usage

- [ ] Update `src/components/dashboard/async/class-assignments-async.tsx:102`
  - Replace `course: any` with proper `Course` type
  - Import from `@/lib/types`

- [ ] Update `src/components/dashboard/async/student-class-data-async.tsx:60`
  - Replace `course: any` with proper `Course` type
  - Import from `@/lib/types`

### Task 2.2: Fix DashboardStatistics Type Usage

- [ ] Update `src/components/dashboard/async/dashboard-courses-async.tsx:11`
  - Replace `statistics: any` with proper `DashboardStatistics` type
  - Import from `@/lib/dashboard/statistics`

---

## Phase 3: UI/UX Verification (Medium Priority)

### Task 3.1: Dashboard Page Layout Testing

- [ ] Compare before/after dashboard structure
  - Verify Nav component placement
  - Verify Sidebar component placement
  - Verify Content area layout

- [ ] Test responsive behavior
  - Mobile viewport (< 768px)
  - Laptop viewport (1024px-1920px)
  - Ultra-wide viewport (> 1920px, test at 50% zoom)

- [ ] Verify loading states
  - Skeleton components mirror final content
  - No layout shift (CLS) during loading
  - Proper Suspense boundary behavior

### Task 3.2: Skeleton Component Accessibility Audit

- [ ] Verify semantic markup
  - Check `data-slot="skeleton"` usage
  - Ensure proper ARIA attributes if needed

- [ ] Test animation behavior
  - Verify `animate-pulse` respects `prefers-reduced-motion`
  - Check that animations are interruptible

- [ ] Validate loading experience
  - Screen reader compatibility
  - Keyboard navigation during loading states

---

## Phase 4: Quality Assurance (Low Priority)

### Task 4.1: Type Checking

- [ ] Run `bun run type-check`
- [ ] Verify all TypeScript errors resolved
- [ ] Ensure no new type errors introduced

### Task 4.2: Linting

- [ ] Run `bun run lint`
- [ ] Verify Biome formatting compliance:
  - 2 spaces indentation
  - Single quotes
  - Semicolons
  - Trailing commas
- [ ] Check import organization uses `@/` alias

### Task 4.3: Manual End-to-End Testing

**Dosen Flow:**
- [ ] View dashboard with statistics
- [ ] View course list
- [ ] Navigate to class detail page
- [ ] View student list with MBTI data
- [ ] View assignments list
- [ ] Navigate to assignment detail page
- [ ] View assignment statistics and submissions

**Mahasiswa Flow:**
- [ ] View dashboard
- [ ] Navigate to enrolled class
- [ ] View classmate list
- [ ] View assignments list
- [ ] Navigate to assignment detail page
- [ ] Verify submission status display

**Accessibility Testing:**
- [ ] Full keyboard navigation (Tab, Enter, Esc)
- [ ] Visible focus indicators
- [ ] Screen reader compatibility (test with NVDA/VoiceOver)
- [ ] Touch targets ≥44px on mobile

---

## Success Criteria

✅ **Zero Code Duplication**
- All data fetching functions in single location
- All type definitions in central types file

✅ **Full Type Safety**
- No `any` types in codebase
- Proper TypeScript inference everywhere

✅ **No Visual Regressions**
- Dashboard layout matches original
- Loading states work correctly
- Responsive design intact

✅ **Accessible Loading States**
- Proper ARIA attributes
- Reduced motion support
- No layout shift

✅ **All Quality Gates Pass**
- `bun run type-check` passes
- `bun run lint` passes
- Manual testing complete

---

## Estimated Timeline

- **Phase 1:** ~30-45 minutes
- **Phase 2:** ~10-15 minutes
- **Phase 3:** ~20-30 minutes
- **Phase 4:** ~15-20 minutes

**Total:** ~1.5-2 hours

---

## Notes

- Follow AGENTS.md guidelines for all code changes
- Follow INTERFACE.md for accessibility and UX requirements
- Test on both development and build modes
- Document any deviations from plan in this file
