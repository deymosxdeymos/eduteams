# QA Findings - equiteams.deymos.me

**Date:** 2026-03-10
**Tester:** Automated browser QA via CDP

---

## Flow Tested

Landing -> Role Select -> Student Onboarding -> Personality -> Student Dashboard -> Switch to Lecturer -> Create Class -> Class Detail -> Create Task -> Task Detail (CRASH) -> Student Quiz -> Task Detail (CRASH)

---

## Issues Found

### CRITICAL

1. **[C1] Assignment detail page crashes with Server Component error**
   - URL: `/dashboard/class/{id}/assignments/{assignmentId}`
   - Affects: BOTH Dosen and Mahasiswa roles
   - Error: `"An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details."`
   - Shows: "Something went wrong! We encountered an error loading your dashboard. Please try again."
   - "Try again" button does NOT recover - same error on retry
   - Hard reload also crashes
   - **This blocks the ENTIRE group formation flow.** Users can create tasks but cannot view them, manage groups, or see results.
   - The error is caught by the dashboard error boundary (`error-7f637ce5807cc837.js`)
   - Network shows the RSC payload returns 200, so the error is in the server component render itself
   - **ROOT CAUSE 1 (primary):** Migration `20260310110000_add_team_formation_provider` was not applied to production. The Prisma schema expects a `provider` column on `team_formation_requests` that didn't exist in the prod DB. Every query that touches that table with `include` fails with "column does not exist".
   - **FIX 1:** Applied `prisma migrate deploy` to production. RESOLVED.
   - **ROOT CAUSE 2 (secondary, would have surfaced after fixing #1):** In `src/components/dashboard/async/assignment-detail-async.tsx` line 406, a `Set<string>` (`submittedStudentIds`) was passed as a prop to `<AssignmentContent>`, which is a `'use client'` component. `Set` is NOT serializable across the RSC boundary.
   - **FIX 2:** Committed in `fd768d5` — convert Set to Array at the boundary, reconstruct via `useMemo` in the client component. RESOLVED.

2. **[C2] Task creation does not update the UI without page reload**
   - Page: `/dashboard/class/{id}` (Dosen)
   - After creating a task (POST `/api/courses/{id}/assignments` returns 201), the dialog closes but the page still shows "Anda belum membuat tugas"
   - Only after a full page reload does the task card appear
   - Code inspection shows `mutateAssignments()` (SWR) is called after creation, which should refetch. This might be a race condition or the SWR mutate not triggering properly when `fallbackData` is set and the list was initially empty.
   - The SWR config has `revalidateOnFocus: false` and `revalidateOnReconnect: false`, which means if `mutate()` fails silently, the data won't auto-correct.

### HIGH

3. **[H1] Mixed language validation messages in "Buat Kelas Baru" dialog**
   - Page: `/dashboard` (Dosen, create class dialog)
   - When submitting empty form, error messages are in English:
     - "Nama mata kuliah is required"
     - "Kelas is required"
     - "Periode must be either ganjil, genap, or pendek"
   - Rest of the UI is fully Indonesian. These should be localized.

4. **[H2] Demo account join-class error message in English**
   - Page: `/dashboard` (Mahasiswa, join class dialog)
   - Error: `Demo accounts cannot join shared classes.`
   - Should be in Indonesian to match the rest of the UI, or at minimum be a friendlier message explaining what the user can do instead.

5. **[H3] Error page text is in English regardless of locale**
   - The error boundary shows "Something went wrong!" and "We encountered an error loading your dashboard. Please try again." and "Try again"
   - Should be localized to match the active locale (ID/EN)

6. **[H4] Language locale resets when switching roles**
   - Was on `/en/dashboard` (English), clicked "Switch to Student"
   - Student dashboard loaded at `/dashboard` (Indonesian, no `/en/` prefix)
   - The locale preference is lost during role switching

7. **[H5] "25 mahasiswa" not translated in English locale**
   - Page: `/en/dashboard` (class card)
   - Shows "25 mahasiswa" instead of "25 students"
   - The class card `T.A 2025/2026` text is also not translated

### MEDIUM

8. **[M1] Missing `aria-describedby` on DialogContent (a11y)**
   - Console warning: `Missing Description or aria-describedby={undefined} for {DialogContent}`
   - Affects: "Masuk ke Kelas" dialog, likely "Buat Kelas Baru" and "Buat Tugas Baru" too
   - Impact: Screen readers won't associate dialog description properly.
   - Fix: Add `<DialogDescription>` inside each `<DialogContent>`, or set `aria-describedby` explicitly.

9. **[M2] No input validation attributes on form fields**
   - Page: `/onboarding/data-diri/mahasiswa`
   - Fields `namaLengkap` and `nim` have no `required`, `minLength`, `maxLength`, or `pattern` attributes.
   - Demo prefills data so users skip validation, but the form would accept empty values if cleared.

10. **[M3] "Masuk Kelas" dialog input has no `name` attribute**
    - Page: `/dashboard` (Mahasiswa)
    - The class code input `<input type="text" placeholder="687ad8sa">` has no `name`.
    - Minor but affects form semantics and autofill.

11. **[M4] No success/error toast after class creation**
    - Page: `/dashboard` (Dosen)
    - After creating a class (POST `/api/courses` returns 200), the dialog closes and the class card appears, but there's no confirmation toast or success message. User has to notice the card appeared.

12. **[M5] "Buat Tugas" form - no validation shown for empty required fields**
    - Page: Class detail (Dosen)
    - The "Buat Tugas" button is disabled when required fields are empty, but there's no visible error message or red highlight telling the user what's missing.
    - The UX relies entirely on the disabled button state, which is not accessible (no aria-disabled explanation).

13. **[M6] Student list shows duplicate NIM**
    - Page: Class detail
    - "Bagas Pratama" (the demo user) has NIM `20260001`, same as "Alya Demo"
    - This could cause data integrity issues if NIM is used as a unique key anywhere

### LOW

14. **[L1] Onboarding role page allows "Lanjut" without selection**
    - Page: `/onboarding/role`
    - Clicking "Lanjut" without selecting DOSEN or MAHASISWA does nothing (no error shown).
    - Would be better to show a validation message like "Pilih role terlebih dahulu".

15. **[L2] Personality test allows "Selesai" without selecting MBTI**
    - Page: `/onboarding/kepribadian`
    - Clicking "Selesai" without selecting any MBTI type does nothing silently.
    - Should show validation feedback.

16. **[L3] Footer social links go to generic domains**
    - Landing page footer links: `facebook.com/`, `x.com/`, `instagram.com/`, `linkedin.com/`
    - These are placeholder links, not actual EquiTeam social pages.

17. **[L4] Language switcher shows "ID" but links to `/en`**
    - Landing page nav has a button labeled "ID" that links to `/en`.
    - Confusing UX: label shows current language but the link goes to the other language. The affordance is unclear.

18. **[L5] Dashboard shows "Loading..." briefly before content**
    - Page: `/dashboard`
    - On navigation, shows "Loading..." text with only the "Pindah ke..." button visible for ~2-3 seconds.
    - Could use a skeleton loader instead for better perceived performance.

19. **[L6] `net::ERR_ABORTED` on several POST navigations**
    - Observed on POST to `/onboarding/role`, `/onboarding/data-diri/mahasiswa`, `/onboarding/kepribadian`
    - These are 303 redirects from server actions where the browser aborts the POST body since it's redirecting. Normal Next.js behavior, not a real error.

20. **[L7] Copyright year says 2025**
    - Landing page footer: "Copyright 2025 EquiTeam"
    - Current date is 2026. Should be dynamic or updated.

21. **[L8] `/en/` landing page redirects to dashboard for onboarded users**
    - Navigating to `https://equiteams.deymos.me/en/` redirects to `/en/dashboard` if user is already onboarded.
    - No way to see the English landing page once onboarded.

22. **[L9] Sidebar navigation icon buttons have no aria-label or title**
    - The sidebar buttons (home, grid, settings, logout at x=56px) have no `aria-label`, `title`, or visible text.
    - Screen readers cannot identify what these buttons do.

23. **[L10] Student kebab menu buttons lack descriptive labels**
    - Student list items have "Opsi" as aria-label on the kebab (three dots) menu
    - Better to include the student name: e.g. "Opsi untuk Alya Demo"

24. **[L11] Student quiz page shows emojis in heading**
    - The quiz page title has emoji rockets and grimace faces in the instruction text.
    - While playful, this may not render consistently across all devices/browsers.

---

## Blocked / Not Tested

[C1] is now RESOLVED. The assignment detail page loads successfully with charts, student list, and "Buat Kelompok" button.

Still not tested (time constraints):

- [ ] Group formation / AI grouping flow (clicking "Buat Kelompok")
- [ ] Group results view (Dosen)
- [ ] Group results view (Mahasiswa)
- [ ] Editing/deleting assignments
- [ ] Multiple assignments per class

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2     |
| High     | 5     |
| Medium   | 6     |
| Low      | 11    |

**The most urgent fix needed is [C1] - the assignment detail page crash.** This is a server component error that completely blocks the core product flow (group formation). Without fixing this, the demo is fundamentally broken past task creation.

**[C2] is also important** - task creation appears to succeed silently with no UI update, making users think nothing happened.
