# PA CoursePlat

Demo of a central syllabus platform for the Public Administration department (Faculty of Political Science, Chulalongkorn University): structured semester syllabi, AI import from .docx/PDF/images, overlap warnings across courses ("Content Caution"), and student-facing course pages. Built to be presented to the department, so it must work end to end, reliably.

## Start here

1. Read `specs/README.md`, then specs 01–08 in order. They are the full context; there is no other design document.
2. Build in the phase order in `specs/README.md`. Run each phase's acceptance criteria before moving on.
3. Log any decision the specs leave open in `specs/DECISIONS.md` (append-only).

## Stack

SvelteKit 2 + Svelte 5 runes, TypeScript strict, Tailwind CSS 4, `@sveltejs/adapter-vercel`, Supabase (Auth, Postgres + RLS, Storage) via `@supabase/supabase-js` and `@supabase/ssr`, Zod 4, `@google/genai` (server only; Gemini API free tier, default model `gemini-flash-latest`) and `openai` pointed at ThaiLLM (server only; default model `typhoon`); see spec 02 "AI providers" for which does what, `mammoth`, Vitest, Playwright (WebKit and Chromium). Fonts: Prompt (headings), Sarabun (body) via `@fontsource`.

Kim's related project `~/Library/CloudStorage/OneDrive-Personal/Project/Local/creditgpax` uses the same stack. Copy components or SQL patterns from it when a spec says so; never import across repos.

## Commands

- `npm run dev` — local app on http://localhost:5173
- `npm run check` — svelte-check (TypeScript strict)
- `npm run test` — Vitest unit tests, including migrations/RLS/functions on PGlite (`tests/support/supabase-shim.sql`)
- `npm run build && npm run check:secrets` — no secret in client assets; `.env`, `api.md`, `thaillm-api.md` untracked
- `npm run db:snapshot -- --label before|after`, `npm run db:snapshot -- --compare before after` — creditGPAX's `public` objects, read-only
- `npm run db:migrate` — apply `supabase/migrations/*.sql` through `courseplat.schema_migrations`. **Never `supabase db push` / `supabase db reset` against the shared project.** Refuses a non-local target until `.snapshots/public-before.json` exists.
- Expected later: `npm run test:e2e`, `npm run make:samples`, `npm run seed`, `npm run demo:reset`, `npm run fixtures:record`, `npm run eval:judge`.

## Conventions

- The syllabus schema (`src/lib/schema/syllabus.ts`) is the single source of truth. Draft and strict variants come from one factory.
- Secrets (`SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`, `THAILLM_API_KEY`, `DEMO_ACCOUNT_PASSWORD`) live only under `src/lib/server/**` and `scripts/**`. Never in client code, never committed. Keep `.env.example` current.
- `api.md` and `thaillm-api.md` in the project root hold Kim's Gemini and ThaiLLM keys in plain text. Before the first commit: put the keys in `.env` as `GEMINI_API_KEY` and `THAILLM_API_KEY`, add `.env`, `api.md` and `thaillm-api.md` to `.gitignore`, and never print a key in logs, test output or messages. Call ThaiLLM over HTTPS (spec 02).
- The Supabase project is shared with Kim's creditGPAX app. Everything of ours lives in schema `courseplat`; never create or change anything in `public` except `public.shared_before_user_created`; never run `supabase db push` or `supabase db reset` against it (use `npm run db:migrate`); scripts touch only `courseplat`, the `syllabus-uploads` bucket and demo users. Rules in spec 02, "Shared Supabase project".
- Permission checks belong in Postgres (RLS and `security definer` functions), and the server re-checks; the UI hiding a button is never the check.
- All UI copy is Thai, kept in `src/lib/i18n/th.ts`; the nine section titles show Thai first with the English name from the brief.
- Never render AI output or uploaded-document HTML with `{@html}` unless it has been sanitised.
- `AI_OFFLINE=true` must make every demo path work without network access (fixtures in `fixtures/`).
- WebKit compatibility is required: Kim audits in Safari's Web Inspector. Test student pages at 390 × 844.

## Data honesty

`data/` holds real catalog data (see `data/README.md` for provenance). Every person, syllabus, section, note and caution in `fixtures/` is fictional. Do not use the names of real faculty members. In demo mode, pages with fictional content show "ข้อมูลตัวอย่างเพื่อการสาธิต", and the footer says this is a prototype, not an official university system. Do not use Chulalongkorn's emblem or official marks.
