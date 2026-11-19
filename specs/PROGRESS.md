# Progress

| Phase | Status | Notes |
|---|---|---|
| P0 Scaffold | **Done** | Migrations on the shared project; AC 1 passes there; dashboard steps done and checked |
| P1 Auth + roles | **Done** (Musts) | AC 1–7 pass; Google sign-in needs one manual check by Kim (below) |
| P2 Student pages | **Done** (Musts + the curriculum-map Should) | AC 1–6, 8, 9 pass; AC 7 needs the P4 upload (mechanism tested now) |
| P3 Editor | next | |
| P4 AI import | not started | |
| P5 Content Caution | not started | |
| P6 Staff dashboard | not started | |
| P7 Demo hardening | not started | |

## P0 — scaffold (spec 02)

**Built:** SvelteKit 2 / Svelte 5 / TS strict / Tailwind 4 / adapter-vercel, Prompt + Sarabun, app shell with the prototype footer; `src/lib/i18n/th.ts`; `src/lib/schema/syllabus.ts` (draft/strict factory, Thai messages) and `extraction.ts`; AI layer (`generateJson`, Gemini provider with the free-tier 429 policy, ThaiLLM provider with format fallback, JSON-reply parser, rate limiter, `toGeminiSchema`, `redactContacts`); migrations 0001–0004 in schema `courseplat` (+ the one shared hook in `public`); `scripts/migrate.ts` (own ledger), `scripts/db-snapshot.ts`, `scripts/check-secrets.ts`; `.env.example`.

**Passed:**
- `npm run check`: 0 errors. `npm run test`: AC 2, 7, 8 and, on PGlite, AC 1, 3, 4, 5, rule 5 deletion, spec 03 AC 3.
- AC 6: `npm run build && npm run check:secrets` finds no secret in client assets; `.env`, `api.md`, `thaillm-api.md` untracked.
- ThaiLLM HTTPS probe: HTTP 200.
- Shared project: `before` snapshot (Kim confirmed) → 0001–0004 found applied by hand, verified identical to the files, recorded in the ledger → `db:migrate` applies nothing → `--compare before after`: **OK** (only `public.shared_before_user_created`, schema `courseplat`, bucket `syllabus-uploads`, two `courseplat_uploads_*` storage policies).
- Dashboard (checked from outside): REST with `Accept-Profile: courseplat` → 200; providers google + email, no email confirmation; a non-demo email sign-up → 403 with our hook's message. The redirect URL can't be checked from outside (opaque OAuth state); it shows on the first Google sign-in.

## P1 — auth, roles, catalog and people seed (spec 03, spec 08)

**Built:**
- `src/hooks.server.ts`: `@supabase/ssr` client per request (schema `courseplat`, cookies with cache headers), session validated with `auth.getUser()`, profile loaded once (or created with `ensure_profile()`), and a role gate for every `(app)` route that runs before loads and actions.
- Routes: `(public)` landing with Google sign-in and the demo panel, `/auth/callback`, `/auth/demo` (404 without demo mode), `/auth/error`, `/auth/signout`; `(app)` shell with role chip, demo badge, demo-account switcher, viewer banner, one-shot Thai notices; `/onboarding` (PA preselected), `/profile`, `/teach` (my offerings), `/teach/[id]/edit` (403 unless `can_edit_offering`), placeholders for `/courses`, `/cautions`, `/admin`.
- `src/lib/domain/accounts.ts`, `curriculum.ts`.
- `npm run seed` (P1 part): catalog from `data/`, semesters, `demo_accounts`, `staff_directory`, 10 demo users (Admin API), profiles through `ensure_profile()` run as each user, 14 offerings of 2/2569 with 16 sections, 19 instructor assignments, 16 meetings (`fixtures/people.json`, `fixtures/offerings.json`). Every offering is `not_started` until P2 seeds syllabi.
- Playwright (`npm run test:e2e`: build, then two preview servers, demo mode on and off), `npm run test:db` (real project).

**Passed:**
- Unit (68 total): AC 1 (cohort/curriculum), AC 2 (regex table, and the TS patterns equal the SQL hook's), catalog mapping, fixture sanity (14 offerings, `.test` addresses only, no instructor double-booked).
- AC 3 (hook table): PGlite, from P0.
- E2E, Chromium + WebKit + iPhone 13 (17 passed, 1 skipped by design): AC 4 (home routes; student redirected from `/teach`, `/cautions`, `/admin` with a Thai notice and no such menu items; natthida opens 2404429, gets 403 for 2404324; staff opens all 14 editors), demo switcher, AC 5 (directory → staff → removed → viewer with banner → restored; Chromium only, it changes shared data), AC 6 (no demo panel; `/auth/demo` GET and POST → 404). No console errors.
- `test:db` on the shared project (4 passed): AC 7 (creditGPAX-style student → `student` profile; `put_plan` and `grade_state` refuse a demo staff token), spec 02 AC 9 (Admin API delete with note, extraction, section assignment; creditGPAX's `delete_my_account()` with a profile and note; notes keep an empty author). Test accounts removed afterwards.
- Seed AC (spec 08 AC 1, P1 part): second `npm run seed` → "nothing to change".
- Build + `check:secrets`: OK.

**Known gaps:**
- Google sign-in can't be automated (needs a real Chula Google account). Kim: sign in once at http://localhost:5173 with your PolSci student account, and once in creditGPAX to confirm it still works (spec 03 setup step 2).
- AC 5 in the UI (`/admin/people`) comes with P6; the trigger and the per-request role are tested now.

## P2 — student pages and seed syllabi (spec 04, spec 08)

**Built:**
- 18 fictional syllabi authored compactly in `fixtures/syllabi/src/*.ts` (real readings; `year: null` where unsure), expanded by `npm run make:syllabi` into `fixtures/syllabi/<semester>/<code>.json`. 2/2569: 10 published, 1 draft (2404318: weeks 1–12, weights 90), 3 not started; 2/2568: 2404324 and 2404429 by `@thanakrit`; 1/2569: five lighter syllabi. All planted overlaps from spec 08 are in place; year-3 week 12 adds up to 65%.
- `npm run seed` now saves and publishes each syllabus through `save_syllabus` / `publish_offering` as the coordinator, then sets plausible fixed "edited/published" dates per semester. Second run: "nothing to change".
- Migration 0005 `offering_listing(semester)`: course code and status of every offering, so the list can grey out unpublished courses and a draft URL shows "ยังไม่เผยแพร่" (applied to the shared project; `public` unchanged).
- `/courses` (semester switcher, combinable filters, cards with badges, evaluation bar, compare toggle, sticky compare tray in localStorage), `/courses/[code]` (redirect), `/courses/[code]/[semesterId]` (at-a-glance card, the nine sections with a sticky section nav, related courses from the catalog only, past versions), `/courses/[code]/versions/[versionId]` (read-only snapshot), `/compare` (aligned rows, shared topics and readings, time clashes, workload heatmap with table view), `/curriculum` (PLO matrix ● / ◐ with footers; PA requirements by curriculum).
- Pure domain modules with unit tests: `curriculum.ts` (badges), `workload.ts`, `weeks.ts`, `compare.ts`, `people.ts`.

**Passed:**
- Unit (104): spec 08 AC 2 (every published seed syllabus passes strict; the 2404318 draft fails only on the total), JSON fixtures up to date, instructors in plans teach that offering, badges (spec 04 AC 1), workload, weeks, compare helpers, `offering_listing` on PGlite.
- E2E, Chromium + WebKit + iPhone 13 (50 passed, 1 skipped by design): spec 04 AC 1, 2, 3, 4, 5, 6, 9, the compare tray, compare (shared Dye, shared policy-cycle topics, heavy week 12, using 2404429's 2/2568 version until P4), past versions, curriculum map; AC 8: no horizontal overflow at 390 × 844 in WebKit (measured against the visual viewport) on `/courses`, course pages, compare and the curriculum map; no console errors anywhere.
- Build + `check:secrets`: OK. Snapshot `pre-0005` vs `post-0005`: identical.

**Known gaps:**
- AC 7 with the 2/2569 upload of 2404429 runs after P4.
- creditGPAX's old hook `public.hook_before_user_created` had its grants changed by the dashboard when the hook was switched (DECISIONS.md). Harmless; left alone because `public` is off limits.

## How to resume

1. `npm install` (node_modules is a symlink to `~/.cache/pa-courseplat/node_modules`, outside OneDrive), then `npm run check && npm run test`.
2. `npm run db:migrate` → "nothing to apply"; `npm run seed` → "nothing to change".
3. `npm run test:e2e` and `npm run test:db` (both use the shared project).
4. Next phase: P3 (spec 05 R1–R10, the manual editor).
