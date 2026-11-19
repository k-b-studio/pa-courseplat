# Progress

| Phase | Status | Notes |
|---|---|---|
| P0 Scaffold | **Done** | Migrations on the shared project; AC 1 passes there; dashboard steps done and checked |
| P1 Auth + roles | **Done** (Musts) | AC 1–7 pass; Google sign-in needs one manual check by Kim (below) |
| P2 Student pages | next | |
| P3 Editor | not started | |
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

## How to resume

1. `npm install` (node_modules is a symlink to `~/.cache/pa-courseplat/node_modules`, outside OneDrive), then `npm run check && npm run test`.
2. `npm run db:migrate` → "nothing to apply"; `npm run seed` → "nothing to change".
3. `npm run test:e2e` and `npm run test:db` (both use the shared project).
4. Next phase: P2 (spec 04 + the syllabi in spec 08).
