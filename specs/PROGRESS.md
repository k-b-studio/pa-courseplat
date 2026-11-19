# Progress

| Phase | Status | Notes |
|---|---|---|
| P0 Scaffold | **Done** | Migrations on the shared project; AC 1 passes there; dashboard steps done and checked |
| P1 Auth + roles | **Done** (Musts) | AC 1–7 pass; Google sign-in needs one manual check by Kim (below) |
| P2 Student pages | **Done** (Musts + the curriculum-map Should) | AC 1–6, 8, 9 pass; AC 7 needs the P4 upload (mechanism tested now) |
| P3 Editor | **Done** (R1–R10, incl. the diff Should) | AC 5, 6, 7, 8, 11 pass; AC 4's manual half passes; caution parts come with P5 |
| P4 AI import | **Done** (R11–R17) | Offline AC 3, 4, 9, 10, 12 (mocked), 13 pass; online fixtures recorded with gemini-3.6-flash; AC 1's 60 s target not yet shown online (see below) |
| P5 Content Caution | **Done** (R1–R9, incl. the dashboard and editor integration) | AC 1–11 pass (AC 4 offline; online wording recorded with openthaigpt); `THAILLM_MODEL=openthaigpt` from `eval:judge` |
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

## P3 — instructor workspace and manual editor (spec 05 R1–R10)

**Built:**
- `/teach`: my offerings in the upcoming and active semesters (staff: all, with a search), status, last edited, syllabus due date with days left.
- `/teach/[id]/edit`: the four start options for a not-started course (upload and paste lead to the P4 import page; copy from a past semester; blank form); the nine sections as collapsible cards (`SyllabusForm`, reusable for the P4 review screen) with every field behaviour in R4 (PLO chips with the curriculum's suggestions ★, method chips, weekly plan with "เติม 16 สัปดาห์", instructor and reading pickers, live evaluation total and donut, citation splitter, work items linked to evaluation, key dates); autosave 1.5 s after the last change with "กำลังบันทึก… / บันทึกแล้ว HH:MM"; the revision-conflict dialog listing the differing sections, with โหลดฉบับล่าสุด / บันทึกทับ (second confirmation); the readiness checklist (strict schema, links to fields; sticky on desktop, bottom sheet on a phone) gating เผยแพร่; the server re-validates strict before `publish_offering`; "ดูตัวอย่างแบบนิสิต" with the student blocks; sidebar with handover notes (new ones flagged, add a note), history with a field-level diff and "คัดลอกมาเป็นฉบับร่าง", and a cautions tab (filled in P5); section note and meeting times for the instructors of that section.
- `src/lib/domain/diff.ts`, `citation.ts` (unit-tested). Seed: the 2/2568 handover note on 2404429.

**Passed:**
- Unit (111): diff (AC 11: week 12 and the weight changes between 2404324's 2/2568 and 2/2569), citation splitter.
- E2E, Chromium + WebKit (16 editor tests; whole suite 66 passed, 1 skipped by design): R2 start options + AC 8 (the handover note shows before starting); AC 7 (copy from 2/2568 clears key-date dates and weekly instructors, `cloned_from` set); AC 5 (30/30/35 → "รวม 95% — ต้องครบ 100%", publish disabled, 100 enables it, autosave reaches the database); AC 4's manual half (an objective without a PLO blocks publishing); AC 6 (two tabs → conflict dialog → load latest); AC 11 in the history panel; R7 preview; R9 section note. Editor tests reset 2404429 to not started before and after, so nothing is published.
- Seed still idempotent; check, build and `check:secrets` OK.

**Known gaps:**
- Upload / paste (P4); caution counts on `/teach`, the cautions tab and the caution run after publishing (P5).

## P4 — AI import (spec 05 R11–R17)

**Built:**
- `npm run make:samples`: the fictional 2404429 upload as .docx, a 2-page image-only "scanned" PDF, .txt, and `injection-test.docx`; `fixtures/samples/index.json` (sha256 → fixture).
- `/teach/[id]/import`: file and paste tabs, `.doc` refused, 15 MB and 60,000-character limits, photos downscaled to 2,000 px in the browser, upload to `syllabus-uploads/{offering}/{uuid}.{ext}` with the user's session, honest progress steps with elapsed time, free-tier data notice (`AI_TIER=free`), offline banner.
- `POST /api/extract`: `can_edit_offering` with the user's JWT, magic-byte sniffing, PDF ≤ 30 pages, per-user hourly cap from `ai_calls`, offline fixtures (2.5 s) or Gemini (`responseJsonSchema`, low thinking, 2-minute timeout) with the ThaiLLM four-slice fallback for text inputs, post-processing (ids, instructor matching, defaults, weight and injection warnings), every call logged; the row always ends `succeeded` or `failed`.
- `/teach/[id]/review/[extractionId]`: the original (PDF via signed URL, sanitised .docx HTML, image, text) beside the pre-filled `SyllabusForm`, confidence chips with evidence, low/not-found sections outlined, PLO suggestions applied and marked "ข้อเสนอจาก AI", section hints with one-click apply, accept → replace all or fill only empty sections → editor (the editor keeps the AI markers). `/teach` shows running imports and a review link.

**Recorded online (`npm run fixtures:record`, 2026-11-19):** `gemini-flash-latest` answers HTTP 404; `gemini-3.6-flash` did all three calls. .docx: 16 weeks, weights 100, Dye, policy brief due week 11, evaluation and weekly plan confidence high, 4 PLO suggestions (AC 1 content); scanned PDF: the same structure, 16 weeks and 5 evaluation items (AC 2); injection sample: 30/30/40 plus the warning (AC 9). **Pin `AI_MODEL=gemini-3.6-flash`** (now in `.env`, `.env.example` and the default).

**Passed:** unit (131): sniffing, .docx → text, offline lookup (all three inputs, whitespace-tolerant), post-processing, AI flags, fill-empty merge, quota message with the Bangkok reset time, AC 12 mocked (PDF → quota + two `rate_limited` calls, .docx → ThaiLLM in four calls with confidence ≤ medium, both failing → error). E2E Chromium + WebKit (14 import tests): AC 3 (three inputs in ~2.5 s, unknown file → 503 message + manual form, row `failed`), AC 4 (accept → draft, AI markers in the editor, touching removes one), AC 9 offline, AC 10 (403 on the API and on the storage folder), AC 13 (notice on free, none on paid).

**Known gaps:**
- AC 1's "under 60 s": the recorded .docx call took 643 s (the PDF 40 s, the injection test 25 s), and a timing re-check got Gemini HTTP 503 after retries. Extraction now uses low thinking and a 2-minute request timeout; re-check the timing once before the presentation (spec 08 AC 4 rehearsal).

## P5 — Content Caution (spec 06)

**Built:**
- Items in TypeScript (`itemsFromDoc`, same refs and MD5 hashes as `rebuild_syllabus_items`); normalisation and concept tags; Stage 1 rules (shared reading identifiers; identical topic text except course-admin weeks); Stage 2a candidates (concept tags + trigrams, top 40, deterministic); Stage 2b judge (ThaiLLM per pair, 3 in flight, 4 per second; Gemini corpus comparison when more than half fail; offline fixture keyed by both items' hashes); Stage 3 (relation adjustment by level/prerequisite, severity table, due-week note, pair keys); upsert with reopen on hash change and auto-dismiss (R5–R7). Every call logged in `ai_calls`, every run in `caution_runs`.
- `POST /api/cautions/run` (`can_edit_offering` with the user's JWT, writes with the secret key). The editor runs it after publishing, after accepting an import (`?run=import`) and from "ตรวจความทับซ้อน", shows "กำลังตรวจความทับซ้อน… / ตรวจเสร็จ พบ n รายการ", markers on the week, work and reading rows, the cautions tab with the drawer, and "ตรวจด้วย AI ไม่สำเร็จ แสดงเฉพาะผลการตรวจพื้นฐาน" after a failed AI part.
- `/cautions`: scope line, tiles, severity/status/kind/semester filters in the URL, the course × course matrix, kind bars, วิชาของฉัน cards, the list, and the drawer with both sides, resolution (intentional / coordinating with a thread / dismissed with a required note, relation relabel) and comments. `/teach` shows open high/medium counts per offering linking to `/cautions?offering=…`; instructors get the menu badge for cautions someone else's run created or reopened (R9).
- Seed step 10: the six cautions of spec 08 (second run: nothing to change). `npm run eval:judge` (`fixtures/eval/`), `npm run fixtures:record -- --part caution [--no-ai]`.

**Recorded online (2026-11-19):** `eval:judge` over 6 positives + 12 negatives for typhoon, pathumma and openthaigpt → **pin `THAILLM_MODEL=openthaigpt`** (now in `.env` and `.env.example`; details in DECISIONS). The 2404429 caution fixture's wording comes from openthaigpt for 4 of 5 pairs.

**Passed:** unit (138): AC 1, 2, 10, the generic-topic rule, clip, dashboard numbers (AC 3), items parity with the SQL function on PGlite. DB tests on the shared project (`npm run test:db`, 6 passed): AC 8 with ThaiLLM mocked down → Gemini corpus finds the policy-brief pair; both failing → Stage 1 kept, earlier AI cautions kept open, run `failed` with the error. E2E Chromium + WebKit + iPhone 13 (94 passed, 2 skipped by design, 16.6 min): AC 3, AC 9 + AC 4 (empty state, then 1 high with "ไม่เกิน 1 สัปดาห์", 4 medium incl. Dye, 1 info; วิชาของฉัน links to the editor), AC 5 (badge, scope, coordination thread reaches natthida), AC 6 (week 2 change → auto-dismissed; the seeded intentional caution unchanged), AC 7 (student on iPhone too, and a viewer: menu absent, redirect + toast, no rows through the publishable key, crawl of student routes finds no caution text or labels), AC 8 in the editor.

## Fixes

- 2026-11-19 · Editor sidebar overflowed the page when the ข้อควรระวัง tab was open (every width; 1765 px at 1140): the sidebar grid's implicit `auto` column grew to a nowrap caution reason. Fixed with `minmax(0,1fr)` tracks, a 22rem sidebar, `min-w-0`, `wrap-anywhere`/`line-clamp` and a segmented tab bar; the same pattern fixed in the caution drawer, `/cautions` list, readiness panel and bottom sheet, and the diff list. Regression test `tests/e2e/layout.spec.ts` (5 widths × WebKit + Chromium, worst-case caution with a long Thai sentence and URL). Layout rule in DECISIONS.
- 2026-11-19 · Deploy prep for kbstudio.space/pa-courseplat: base path `/pa-courseplat` with `appPath()` for every in-app URL, trailing slash on every page and endpoint, kbstudio.space as a trusted origin, OAuth return to the browser's origin, cookies scoped to `/pa-courseplat/`. `check:secrets` had been failing since P4 on supabase-js's own `sb_secret_` prefix check (no key present); it now matches the key shape. Pushed to GitHub `k-b-studio/pa-courseplat` after a full-history secret scan (no key in any blob or commit message).

## How to resume

1. `npm install` (node_modules is a symlink to `~/.cache/pa-courseplat/node_modules`, outside OneDrive), then `npm run check && npm run test`.
2. `npm run db:migrate` → "nothing to apply"; `npm run seed` → "nothing to change".
3. `npm run test:e2e` and `npm run test:db` (both use the shared project).
4. Next phase: P6 (spec 07, staff dashboard, including `/admin/people`).
