-- PA CoursePlat — 0001 schema (spec 02). Everything lives in schema courseplat:
-- the Supabase project is shared with creditGPAX, so nothing here touches public.
-- Every foreign key that points at a person is on delete cascade or set null (spec 02 rule 5).

create schema if not exists courseplat;
set local search_path = courseplat, pg_temp;

create type courseplat.user_role        as enum ('student','viewer','instructor','staff');
create type courseplat.major_code       as enum ('GOV','IR','SOC','PA');
create type courseplat.semester_status  as enum ('archived','active','upcoming');
create type courseplat.offering_status  as enum ('not_started','draft','published');
create type courseplat.caution_kind     as enum ('topic','reading','assignment','objective');
create type courseplat.caution_relation as enum ('duplicate','builds_on','related');
create type courseplat.caution_severity as enum ('high','medium','info');
create type courseplat.caution_status   as enum ('open','intentional','coordinating','dismissed');

-- people ---------------------------------------------------------------------------------
create table courseplat.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null unique,
  role courseplat.user_role not null,
  cohort smallint,
  major courseplat.major_code,
  title_th text, name_th text, name_en text,
  office text, office_hours text, contact_note text,
  is_demo boolean not null default false,
  cautions_seen_at timestamptz,                     -- spec 06 R9 badge
  created_at timestamptz not null default now()
);

create table courseplat.staff_directory (
  email text primary key check (email = lower(email)),
  role courseplat.user_role not null check (role in ('instructor','staff')),
  title_th text, name_th text, name_en text,
  added_by uuid references courseplat.profiles on delete set null,
  added_at timestamptz not null default now()
);

create table courseplat.demo_accounts (
  email text primary key check (email = lower(email)),
  role courseplat.user_role not null,
  cohort smallint,
  major courseplat.major_code,
  label_th text not null
);

-- catalog -------------------------------------------------------------------------------
create table courseplat.curricula (
  id text primary key,
  name_th text not null, name_en text,
  cohort_min smallint not null, cohort_max smallint
);

create table courseplat.plos (
  code text primary key,
  curriculum_id text references courseplat.curricula,
  major courseplat.major_code,
  text_th text not null,
  teaching_methods text[] not null default '{}',
  assessment_methods text[] not null default '{}'
);

create table courseplat.courses (
  code char(7) primary key,
  name_th text not null, name_en text not null, short_name_en text,
  credits numeric(3,1) not null, credit_format text not null,
  level smallint not null,
  department text not null,
  prerequisite_text text,
  prerequisite_codes char(7)[] not null default '{}',
  description_th text, description_en text,
  managed_here boolean not null default true
);

create table courseplat.curriculum_courses (
  id bigint generated always as identity primary key,
  curriculum_id text not null references courseplat.curricula,
  course_code char(7) not null references courseplat.courses,
  major courseplat.major_code,
  category text not null check (category in ('faculty_core','major_required','track_elective','required_elective')),
  track text,
  track_name_th text,
  unique nulls not distinct (curriculum_id, course_code, major, category, track)
);

create table courseplat.course_plos (
  course_code char(7) references courseplat.courses,
  plo_code text references courseplat.plos,
  primary key (course_code, plo_code)
);

-- semesters and offerings ----------------------------------------------------------------
create table courseplat.semesters (
  id text primary key check (id ~ '^[0-9]{4}-[123]$'),
  label text not null,
  year_be smallint not null,
  term smallint not null check (term in (1,2,3)),
  starts_on date not null,
  weeks smallint not null default 16 check (weeks between 1 and 30),
  status courseplat.semester_status not null,
  syllabus_due_on date
);
-- one active and one upcoming semester at a time (spec 07 R6)
create unique index semesters_one_active   on courseplat.semesters ((status)) where status = 'active';
create unique index semesters_one_upcoming on courseplat.semesters ((status)) where status = 'upcoming';

create table courseplat.offerings (
  id uuid primary key default gen_random_uuid(),
  course_code char(7) not null references courseplat.courses,
  semester_id text not null references courseplat.semesters,
  status courseplat.offering_status not null default 'not_started',
  syllabus jsonb,                       -- working SyllabusDoc (draft); students read published snapshots
  revision int not null default 0,
  coordinator_id uuid references courseplat.profiles on delete set null,
  cloned_from uuid references courseplat.offerings on delete set null,
  updated_by uuid references courseplat.profiles on delete set null,
  updated_at timestamptz,
  published_at timestamptz,
  published_revision int,
  unique (course_code, semester_id)
);
create index offerings_semester on courseplat.offerings (semester_id);

create table courseplat.offering_versions (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references courseplat.offerings on delete cascade,
  revision int not null,
  syllabus jsonb not null,
  sections_snapshot jsonb not null,
  published_by uuid references courseplat.profiles on delete set null,
  published_at timestamptz not null default now(),
  unique (offering_id, revision)
);

create table courseplat.sections (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references courseplat.offerings on delete cascade,
  section_no smallint not null,
  language text not null default 'th' check (language in ('th','en','th_en')),
  capacity smallint,
  note text not null default '',
  unique (offering_id, section_no)
);

create table courseplat.section_instructors (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references courseplat.sections on delete cascade,
  profile_id uuid references courseplat.profiles on delete cascade,
  guest_name text,
  pending_email text check (pending_email = lower(pending_email)),   -- spec 07 R9
  role text not null default 'lead' check (role in ('lead','co','guest')),
  check (profile_id is not null or guest_name is not null or pending_email is not null)
);
create index section_instructors_profile on courseplat.section_instructors (profile_id);
create index section_instructors_pending on courseplat.section_instructors (pending_email) where pending_email is not null;

create table courseplat.section_meetings (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references courseplat.sections on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  starts_at time not null,
  ends_at time not null check (ends_at > starts_at),
  room text not null default '',
  mode text not null default 'onsite' check (mode in ('onsite','online','hybrid'))
);

-- derived for Content Caution (rebuilt by save_syllabus) ----------------------------------
create table courseplat.syllabus_items (
  id bigint generated always as identity primary key,
  offering_id uuid not null references courseplat.offerings on delete cascade,
  kind courseplat.caution_kind not null,
  ref text not null,
  week smallint,
  text text not null,
  concepts text[] not null default '{}',
  norm_key text,
  content_hash text not null,
  unique (offering_id, ref)
);

-- AI imports -----------------------------------------------------------------------------
create table courseplat.extractions (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references courseplat.offerings on delete cascade,
  created_by uuid references courseplat.profiles on delete set null,
  source_kind text not null check (source_kind in ('docx','pdf','image','text')),
  storage_path text,
  file_sha256 text,
  status text not null check (status in ('running','succeeded','failed')),
  model text,
  offline boolean not null default false,
  result jsonb,
  error text,
  input_tokens int, output_tokens int,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

-- Content Caution --------------------------------------------------------------------------
create table courseplat.caution_runs (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references courseplat.offerings on delete cascade,
  triggered_by uuid references courseplat.profiles on delete set null,
  trigger text not null check (trigger in ('manual','save','publish','import','seed')),
  model text,
  offline boolean not null default false,
  status text not null check (status in ('running','succeeded','failed')),
  compared_offering_ids uuid[] not null default '{}',
  error text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table courseplat.content_cautions (
  id uuid primary key default gen_random_uuid(),
  pair_key text not null unique,
  semester_id text references courseplat.semesters,
  a_offering_id uuid not null references courseplat.offerings on delete cascade,
  a_ref text not null, a_label text not null,
  b_offering_id uuid not null references courseplat.offerings on delete cascade,
  b_ref text not null, b_label text not null,
  kind courseplat.caution_kind not null,
  relation courseplat.caution_relation not null,
  severity courseplat.caution_severity not null,
  similarity numeric(3,2) not null,
  reason_th text not null,
  suggestion_th text not null default '',
  source text not null check (source in ('rule','ai','seed')),
  status courseplat.caution_status not null default 'open',
  resolved_by uuid references courseplat.profiles on delete set null,
  resolved_at timestamptz,
  resolution_note text,
  a_hash text not null, b_hash text not null,
  last_run_id uuid references courseplat.caution_runs on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index content_cautions_a on courseplat.content_cautions (a_offering_id);
create index content_cautions_b on courseplat.content_cautions (b_offering_id);

create table courseplat.caution_comments (
  id uuid primary key default gen_random_uuid(),
  caution_id uuid not null references courseplat.content_cautions on delete cascade,
  author_id uuid references courseplat.profiles on delete set null,
  body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- resolution history shown in the caution drawer (spec 06): who changed status/relation, when, why
create table courseplat.caution_events (
  id bigint generated always as identity primary key,
  caution_id uuid not null references courseplat.content_cautions on delete cascade,
  actor_id uuid references courseplat.profiles on delete set null,
  status courseplat.caution_status not null,
  relation courseplat.caution_relation,
  note text,
  created_at timestamptz not null default now()
);

create table courseplat.course_notes (
  id uuid primary key default gen_random_uuid(),
  course_code char(7) not null references courseplat.courses,
  semester_id text references courseplat.semesters,
  author_id uuid references courseplat.profiles on delete set null,
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

-- when someone last opened a course's editor (spec 07 R12: highlight new handover notes)
create table courseplat.course_visits (
  profile_id uuid not null references courseplat.profiles on delete cascade,
  course_code char(7) not null references courseplat.courses,
  last_opened_at timestamptz not null default now(),
  primary key (profile_id, course_code)
);

-- AI usage (free-tier quota awareness) -----------------------------------------------------
create table courseplat.ai_calls (
  id bigint generated always as identity primary key,
  provider text not null check (provider in ('gemini','thaillm')),
  kind text not null check (kind in ('extract','compare','judge')),
  model text not null,
  model_version text,
  status text not null check (status in ('ok','rate_limited','error','offline')),
  http_status smallint,
  input_tokens int, output_tokens int, latency_ms int,
  created_by uuid references courseplat.profiles on delete set null,
  created_at timestamptz not null default now()
);
create index ai_calls_created on courseplat.ai_calls (created_at);
create index ai_calls_user on courseplat.ai_calls (created_by, created_at);
