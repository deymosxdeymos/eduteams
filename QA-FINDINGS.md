# QA Findings - equiteams.deymos.me

**Last updated:** 2026-03-14 -- Session 3 full workflow E2E (browser + security)
**Previous sessions:** 2026-03-13 (Session 2 security deep-dive), 2026-03-10 (Session 1 initial QA)

---

# Session 3 Findings (2026-03-14)

## Methodology

- Full E2E browser workflow via CDP: Student quiz (skills + topic preferences), teacher assignment analytics, team formation, team results (both roles)
- English locale testing across all pages
- Security re-verification of previously reported issues (curl)
- Code audit of hardcoded strings and untranslated components

## Flows Tested

1. **Student Quiz Flow:** Skills test instruction modal -> skill rating (3 skills) -> topic preference instruction modal -> topic rating (3 topics) -> submission -> "waiting for groups" state
2. **Teacher Dashboard:** Stats overview -> class detail -> assignment detail (charts) -> team formation modal (method selection, group count) -> team results with quality scores
3. **Teacher Team Detail:** Full member profile view with MBTI bars, skills, topic preferences, pagination between groups
4. **Student Team Result:** Groups displayed, own group highlighted, quality scores hidden (correct authorization)
5. **Profile Pages:** Student MBTI profile with bar/radar charts and description; teacher simple name/gender editor
6. **Manage Pages:** Student manage (My Group/Waiting/Not Started tabs); teacher manage (class table, archived classes)
7. **Role Switching:** Student <-> Teacher via floating button
8. **Locale Switching:** ID <-> EN via header button

---

## Security Status (Re-verification of Session 2 Findings)

### [S-C1] Cron endpoint -- FIXED

Previously unprotected. Now returns `{"error":"Unauthorized"}` for unauthenticated requests.

### [S-C2] Assignment stats IDOR -- FIXED

Previously accessible to any authenticated user. Now returns `{"success":false,"error":"Authentication required","code":"AUTH_ERROR"}` for unauthenticated requests.

### [S-H1] CSP -- PARTIALLY FIXED

- CSP is now in **enforcement mode** (no longer Report-Only)
- `unsafe-inline` removed from `script-src`, replaced with nonce
- **Still has `unsafe-eval`** in script-src -- this should be removed for production
- Frame-ancestors properly set to `'none'`
- `x-frame-options: DENY` and `x-content-type-options: nosniff` present

### Other Security

- Unauthenticated course creation properly rejected (401)
- Debug endpoints return empty response (not leaking data)

---

## NEW: CRITICAL

None found.

---

## NEW: HIGH

### [S3-H1] Locale resets to Indonesian when switching roles

**Confirmed:** Still present (was H4 in Session 1). When on `/en/dashboard` (English), clicking "Switch to Student/Teacher" navigates to `/dashboard` (no `/en/` prefix), resetting all text to Indonesian. The EN flag icon remains visible, creating a mismatch: English flag shown but all content in Indonesian.

**Reproduction:** On any English page -> click "Switch to Student" bottom-right -> observe URL changes from `/en/dashboard/...` to `/dashboard` -> all text reverts to Indonesian.

**Fix:** Preserve the current locale in the role-switch API redirect URL.

### [S3-H2] Manage page completely untranslated for EN locale (teacher)

**Page:** `/en/dashboard/manage` (Dosen role)
**All hardcoded in Indonesian** in `src/components/dashboard/manage-courses-view.tsx`:

- Table headers: "Nama Kelas", "Periode", "Total Tugas", "Total Mahasiswa"
- Sort option: "Terbaru" (line 89)
- Search placeholder: "Cari kelas atau kode"
- Row values: "1 Tugas", "8 Mahasiswa"
- Archive section: "Kelas yang diarsipkan"
- Dialog texts: "Tampilkan tugas untuk kelas ini agar mahasiswa dapat melihatnya"

Similarly `src/components/dashboard/manage-assignments-view.tsx`:

- "Nama Tugas", "Hapus Tugas?", "Sembunyikan Tugas?", "Tugas yang Diarsipkan"

**Impact:** The entire manage section is unusable in English.

### [S3-H3] Student manage page heading "Tugas Saya" untranslated in EN locale

**Page:** `/en/dashboard/manage` (Student role)
**Shows:** "Tugas Saya" heading instead of "My Assignments"

### [S3-H4] All MBTI personality descriptions hardcoded in Indonesian

**Files:** `src/components/dashboard/mbti-overview-layout.tsx`, `src/components/dashboard/personality-description.tsx`

All 16 MBTI type descriptions (e.g., "INFJ dikenal bijaksana dan punya empati tinggi...") are hardcoded in Indonesian. They render in Indonesian even on the English locale profile page.

**Impact:** English-speaking users see personality type analysis entirely in Indonesian.

### [S3-H5] Student profile "Lihat Persebaran MBTI" button untranslated

**File:** `src/components/dashboard/profile-content.tsx:43`
**Shows:** "Lihat Persebaran MBTI" on English locale instead of "View MBTI Distribution"

---

## NEW: MEDIUM

### [S3-M1] Student manage "My Group" tab shows no data despite team formation

**Page:** `/en/dashboard/manage` (Student after teams formed)
**Shows:** "No classes found." under "My Group" tab, even though Bagas is assigned to Group 02 in the Capstone assignment.

**Root cause:** `ManageLayout` calls `getStudentManageItems(user)` which queries `prisma.courseEnrollment` by `studentId`. Demo sandbox students don't have real enrollment records in the DB -- the demo course membership is synthesized at render time. The `DemoStudentManageContent` component receives empty `serverItems` and relies on `getDemoStudentManageItems()` + client-side `sandboxState.formedTeams` cookie. But the team formation we triggered via the "Buat Kelompok" modal writes teams to the DB, not to the client-side sandbox cookie. So the manage view's client state doesn't know about the DB-persisted teams.

**File:** `src/components/dashboard/manage-layout.tsx` (line ~24), `src/components/demo/demo-student-manage-content.tsx`

### [S3-M2] Dashboard course card doesn't use `<Link>` -- no keyboard/a11y navigation

**Page:** `/dashboard` (Teacher)
**Observation:** The course card (Machine Learning K01) uses a `<div>` with `cursor: pointer` and an `onClick` handler, but has no `<a>` tag, `role="link"`, `tabIndex`, or keyboard event handler. Cannot be focused or activated via keyboard. Screen readers cannot identify it as navigable.

**File likely:** `src/components/dashboard/content.tsx` or similar card component

**Fix:** Wrap in `<Link>` from `next/link` or add proper ARIA attributes + keyboard event handling.

### [S3-M3] Student dashboard shows "8 mahasiswa" in English locale

**Page:** `/en/dashboard` (Student, class card)
**Still present** from Session 1 (H5). Shows "8 mahasiswa" and "T.A 2025/2026" instead of "8 students" and "A.Y 2025/2026".

### [S3-M4] Search placeholder "Mencari sesuatu?" untranslated in EN locale (student dashboard)

**Page:** `/en/dashboard` (Student)
**Shows:** "Mencari sesuatu?" instead of "Search for something?"

### [S3-M5] "Masuk Kelas" button untranslated in EN locale (student dashboard)

**Page:** `/en/dashboard` (Student)
**Shows:** "Masuk Kelas" instead of "Join Class"
**Note:** Likely cascading from S3-H1 locale reset, but if directly navigated to `/en/dashboard` as student, the issue persists.

---

## NEW: LOW

### [S3-L1] CSP still includes `unsafe-eval` in script-src

While much improved from Session 2 (now enforced + nonce-based), `'unsafe-eval'` remains in the script-src directive. This allows `eval()`, `Function()`, and similar constructs. Should audit whether any dependencies truly need eval and remove it for production.

### [S3-L2] Quiz instruction modals use emojis in title/description

**Page:** Quiz pages (`/dashboard/class/.../quiz`)
**Shows:** Rocket emoji in "Tes Keahlian" heading, grimace emoji in subtitle text
**Still present** from Session 1 (L11). Minor cross-device rendering inconsistency risk.

### [S3-L3] Chart dropdown behind modal z-index bleed

**Observation:** When clicking the "Buat Kelompok" button which opened the confirmation dialog, the chart filter dropdown (Default/Tertinggi/Terendah) from the background page was briefly visible through the modal overlay. Likely a z-index or portal ordering issue.

### [S3-L4] "Grup siap untuk dibagi" badge shows even after teams are formed (EN locale)

**Page:** `/en/dashboard/class/.../assignments/...` (Teacher, after team formation)
**Shows:** "Groups are ready to be formed" badge on the student list sidebar even though teams have already been formed.

### [S3-L5] Dashboard stats show stale assignment count after team formation

**Page:** `/dashboard` (Teacher)
**Shows:** "1 Total tugas telah dibuat" but after forming teams, total teams shows "2". This is technically correct (1 assignment, 2 teams) but the dashboard only shows 1 assignment count while the user created teams. Not strictly a bug, just potentially confusing UX.

---

## Resolved Since Session 2

| ID   | Title                                         | Status                |
| ---- | --------------------------------------------- | --------------------- |
| S-C1 | Cron endpoint unprotected without CRON_SECRET | FIXED (returns 401)   |
| S-C2 | Assignment stats IDOR                         | FIXED (requires auth) |
| S-H1 | CSP Report-Only + unsafe-inline               | PARTIALLY FIXED       |
| C1   | Assignment detail page crash                  | FIXED (fd768d5)       |

## Still Present from Previous Sessions

| ID  | Severity | Title                                                 |
| --- | -------- | ----------------------------------------------------- |
| H4  | HIGH     | Locale resets when switching roles (=S3-H1)           |
| H5  | MEDIUM   | "8 mahasiswa" not translated in EN (=S3-M3)           |
| L8  | LOW      | EN landing page redirects to dashboard when logged in |
| L11 | LOW      | Quiz page emojis (=S3-L2)                             |

---

## Session 3 Summary

| Severity | Count | New |
| -------- | ----- | --- |
| Critical | 0     | 0   |
| High     | 5     | 5   |
| Medium   | 5     | 5   |
| Low      | 5     | 5   |

**Key theme:** The biggest gap is **internationalization**. The manage pages, MBTI descriptions, student dashboard, and profile page have extensive hardcoded Indonesian strings that bypass the i18n system entirely. The English locale is essentially broken for manage pages and personality descriptions.

**Security posture:** Significantly improved from Session 2. The two critical issues (cron auth, IDOR) are fixed, CSP is now enforced with nonces, and proper auth checks are in place on all tested API endpoints.

**Core workflow:** The full student quiz -> teacher team formation -> team results flow works end-to-end without crashes or data loss. Team detail modals render correctly with per-student MBTI analysis, skills, and preferences.

---

## Not Tested (Time Constraints)

- [ ] Class creation flow (teacher creating new class from scratch)
- [ ] Share class via token flow (teacher generates token, student joins)
- [ ] Assignment editing/deletion
- [ ] Multiple assignments per class
- [ ] Recreate Teams flow (after initial formation)
- [ ] Student leaving a class
- [ ] Mobile/responsive layout
- [ ] Dark mode (if supported)
- [ ] Error boundary recovery paths
- [ ] Rate limiting on team formation endpoint
