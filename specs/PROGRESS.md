# Progress

| Phase | Status | Notes |
|---|---|---|
| P0 Scaffold | **Done except the four dashboard steps (Kim).** Migrations on the shared project; AC 1 passes there. | See below |
| P1 Auth + roles | not started | |
| P2 Student pages | not started | |
| P3 Editor | not started | |
| P4 AI import | not started | |
| P5 Content Caution | not started | |
| P6 Staff dashboard | not started | |
| P7 Demo hardening | not started | |

## P0 — scaffold (spec 02)

**Built:** SvelteKit 2 / Svelte 5 / TS strict / Tailwind 4 / adapter-vercel (sin1), Prompt + Sarabun, app shell with the prototype footer; `src/lib/i18n/th.ts`; `src/lib/schema/syllabus.ts` (draft/strict factory, Thai messages) and `extraction.ts`; AI layer (`generateJson`, Gemini provider with the free-tier 429 policy, ThaiLLM provider with format fallback, JSON-reply parser, rate limiter, `toGeminiSchema`, `redactContacts`); migrations 0001–0004 in schema `courseplat` (+ the one shared hook in `public`); `scripts/migrate.ts` (own ledger), `scripts/db-snapshot.ts`, `scripts/check-secrets.ts`; `.env.example`.

**Passed:**
- `npm run check`: 0 errors.
- `npm run test`: 51 tests. AC 2 (schema), AC 7 (Gemini schema subset, redaction), AC 8 (ThaiLLM parsing, 400 → json_object, ≤ 4 starts per second), and on PGlite: AC 1 (second run applies nothing; only `public.shared_before_user_created` added), AC 3 (forbidden save, revision conflict, student RLS), AC 4 (15/5/2/4 items), AC 5 (one version with sections snapshot), rule 5 deletion (local part of AC 9), spec 03 AC 3 (hook table).
- AC 6: `npm run build && npm run check:secrets` finds no secret in client assets; `.env`, `api.md`, `thaillm-api.md` untracked.
- ThaiLLM HTTPS probe: HTTP 200.

**Shared project (2026-11-19):**
- `.env` has all six names; `SUPABASE_DB_URL` is the direct connection (DECISIONS.md).
- `before` snapshot taken (Kim confirmed) → migrations 0001–0004 present and verified identical to the files, recorded in the ledger (DECISIONS.md: they had been applied by hand) → `db:migrate` applies nothing → `after` snapshot → `--compare before after`: **OK**, only `public.shared_before_user_created`, schema `courseplat`, bucket `syllabus-uploads` and the two `courseplat_uploads_*` storage policies added. AC 1 passes on the shared project.

**Waiting on (Kim, dashboard):**
1. Data API → Exposed schemas: add `courseplat` (today only `public`, `graphql_public`: REST answers PGRST106).
2. Auth Hooks → Before User Created: switch to `public.shared_before_user_created`.
3. Auth Providers → Email: enable (today only Google is on).
4. URL Configuration → Redirect URLs: add `http://localhost:5173/auth/callback` (Vercel domain in P7).
- Check after: REST with `Accept-Profile: courseplat` answers 200; a sign-up with a non-demo email is refused with "Accounts are for Chula PolSci students and Chula staff only" (our hook's message, not creditGPAX's).
- AC 9's creditGPAX half (`delete_my_account()` for a test student) runs against the shared project in P1.

## How to resume

1. `npm install` (node_modules is a symlink to `~/.cache/pa-courseplat/node_modules`, outside OneDrive), then `npm run check && npm run test`.
2. `npm run db:migrate` should say "nothing to apply"; if the dashboard steps above aren't done, do them first.
3. Next phase: P1 (spec 03).
