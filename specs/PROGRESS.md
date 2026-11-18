# Progress

| Phase | Status | Notes |
|---|---|---|
| P0 Scaffold | **Code done; local criteria pass. Shared-project steps waiting for credentials.** | See below |
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

**Waiting on:**
- `SUPABASE_SECRET_KEY` and `SUPABASE_DB_URL` in `.env` (Kim).
- Then: `npm run db:snapshot -- --label before` → Kim confirms → `npm run db:migrate` → `npm run db:snapshot -- --label after` → `npm run db:snapshot -- --compare before after` (AC 1 on the shared project), and the dashboard steps (expose `courseplat`, switch the hook, Email provider on, redirect URLs).
- AC 9's creditGPAX half (`delete_my_account()` for a test student) runs against the shared project in P1.

## How to resume

1. `npm install`, then `npm run check && npm run test`.
2. If `.env` has `SUPABASE_DB_URL`: follow "Waiting on" above, in order.
3. Next phase: P1 (spec 03).
