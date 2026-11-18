-- PA CoursePlat — 0003 privileges and row-level security (spec 02).
-- Grants follow Supabase's custom-schema guide; RLS decides rows. Functions run for authenticated only.

set local search_path = courseplat, pg_temp;

-- schema and table privileges --------------------------------------------------------------
grant usage on schema courseplat to anon, authenticated, service_role;
grant all on all tables in schema courseplat to anon, authenticated, service_role;
grant all on all sequences in schema courseplat to anon, authenticated, service_role;
alter default privileges for role postgres in schema courseplat grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema courseplat grant all on sequences to anon, authenticated, service_role;

-- functions: nobody by default, then authenticated (and the server role) explicitly
revoke execute on all functions in schema courseplat from public, anon;
alter default privileges for role postgres in schema courseplat revoke execute on functions from public;
grant execute on all functions in schema courseplat to authenticated, service_role;
-- internal helpers are not part of the API
revoke execute on function courseplat.rebuild_syllabus_items(uuid) from authenticated;

-- the working syllabus column is not selectable directly: students read published snapshots
-- (offering_versions); editors read drafts through get_offering_syllabi()
revoke select on courseplat.offerings from anon, authenticated;
grant select (id, course_code, semester_id, status, revision, coordinator_id, cloned_from,
              updated_by, updated_at, published_at, published_revision)
  on courseplat.offerings to anon, authenticated;
-- updates go through functions; staff may only set the coordinator directly
revoke update on courseplat.offerings from anon, authenticated;
grant update (coordinator_id) on courseplat.offerings to authenticated;

-- enable RLS everywhere ------------------------------------------------------------------------
alter table courseplat.profiles            enable row level security;
alter table courseplat.staff_directory     enable row level security;
alter table courseplat.demo_accounts       enable row level security;
alter table courseplat.curricula           enable row level security;
alter table courseplat.plos                enable row level security;
alter table courseplat.courses             enable row level security;
alter table courseplat.curriculum_courses  enable row level security;
alter table courseplat.course_plos         enable row level security;
alter table courseplat.semesters           enable row level security;
alter table courseplat.offerings           enable row level security;
alter table courseplat.offering_versions   enable row level security;
alter table courseplat.sections            enable row level security;
alter table courseplat.section_instructors enable row level security;
alter table courseplat.section_meetings    enable row level security;
alter table courseplat.syllabus_items      enable row level security;
alter table courseplat.extractions         enable row level security;
alter table courseplat.caution_runs        enable row level security;
alter table courseplat.content_cautions    enable row level security;
alter table courseplat.caution_comments    enable row level security;
alter table courseplat.caution_events      enable row level security;
alter table courseplat.course_notes        enable row level security;
alter table courseplat.course_visits       enable row level security;
alter table courseplat.ai_calls            enable row level security;

-- profiles: self; staff all; anyone signed in sees instructor/staff rows. Student rows never leak.
create policy profiles_select on courseplat.profiles for select to authenticated
  using (id = auth.uid() or courseplat.is_staff() or role in ('instructor','staff'));
create policy profiles_staff_update on courseplat.profiles for update to authenticated
  using (courseplat.is_staff()) with check (courseplat.is_staff());

-- staff directory: staff only
create policy staff_directory_all on courseplat.staff_directory for all to authenticated
  using (courseplat.is_staff()) with check (courseplat.is_staff());

-- demo_accounts: nobody through the API (scripts use the secret key; the sign-up hook reads it)

-- catalog and semesters: read for any signed-in user, write for staff
create policy curricula_select on courseplat.curricula for select to authenticated using (true);
create policy curricula_write on courseplat.curricula for all to authenticated using (courseplat.is_staff()) with check (courseplat.is_staff());
create policy plos_select on courseplat.plos for select to authenticated using (true);
create policy plos_write on courseplat.plos for all to authenticated using (courseplat.is_staff()) with check (courseplat.is_staff());
create policy courses_select on courseplat.courses for select to authenticated using (true);
create policy courses_write on courseplat.courses for all to authenticated using (courseplat.is_staff()) with check (courseplat.is_staff());
create policy curriculum_courses_select on courseplat.curriculum_courses for select to authenticated using (true);
create policy curriculum_courses_write on courseplat.curriculum_courses for all to authenticated using (courseplat.is_staff()) with check (courseplat.is_staff());
create policy course_plos_select on courseplat.course_plos for select to authenticated using (true);
create policy course_plos_write on courseplat.course_plos for all to authenticated using (courseplat.is_staff()) with check (courseplat.is_staff());
create policy semesters_select on courseplat.semesters for select to authenticated using (true);
create policy semesters_write on courseplat.semesters for all to authenticated using (courseplat.is_staff()) with check (courseplat.is_staff());

-- offerings
create policy offerings_select on courseplat.offerings for select to authenticated
  using (courseplat.can_view_offering(id));
create policy offerings_insert on courseplat.offerings for insert to authenticated
  with check (courseplat.is_staff());
create policy offerings_update on courseplat.offerings for update to authenticated
  using (courseplat.is_staff()) with check (courseplat.is_staff());
create policy offerings_delete on courseplat.offerings for delete to authenticated
  using (courseplat.is_staff());

-- published snapshots
create policy offering_versions_select on courseplat.offering_versions for select to authenticated using (true);

-- sections, instructors, meetings
create policy sections_select on courseplat.sections for select to authenticated
  using (courseplat.can_view_offering(offering_id));
create policy sections_write on courseplat.sections for all to authenticated
  using (courseplat.is_staff()) with check (courseplat.is_staff());
create policy section_instructors_select on courseplat.section_instructors for select to authenticated
  using (courseplat.can_view_offering((select s.offering_id from courseplat.sections s where s.id = section_id)));
create policy section_instructors_write on courseplat.section_instructors for all to authenticated
  using (courseplat.is_staff()) with check (courseplat.is_staff());
create policy section_meetings_select on courseplat.section_meetings for select to authenticated
  using (courseplat.can_view_offering((select s.offering_id from courseplat.sections s where s.id = section_id)));
create policy section_meetings_write on courseplat.section_meetings for all to authenticated
  using (courseplat.is_staff()) with check (courseplat.is_staff());

-- derived items: professors and staff only
create policy syllabus_items_select on courseplat.syllabus_items for select to authenticated
  using (courseplat.is_teacher());

-- AI imports
create policy extractions_select on courseplat.extractions for select to authenticated
  using (created_by = auth.uid() or courseplat.is_staff());
create policy extractions_insert on courseplat.extractions for insert to authenticated
  with check (created_by = auth.uid() and courseplat.can_edit_offering(offering_id));
create policy extractions_update on courseplat.extractions for update to authenticated
  using (created_by = auth.uid() and courseplat.can_edit_offering(offering_id))
  with check (created_by = auth.uid() and courseplat.can_edit_offering(offering_id));

-- Content Caution: staff, or an instructor who can edit either side. Writes: server (secret key).
create policy caution_runs_select on courseplat.caution_runs for select to authenticated
  using (courseplat.is_staff() or courseplat.can_edit_offering(offering_id));
create policy content_cautions_select on courseplat.content_cautions for select to authenticated
  using (courseplat.is_staff() or courseplat.can_edit_offering(a_offering_id) or courseplat.can_edit_offering(b_offering_id));
create policy caution_comments_select on courseplat.caution_comments for select to authenticated
  using (exists (select 1 from courseplat.content_cautions c where c.id = caution_id
                 and (courseplat.is_staff() or courseplat.can_edit_offering(c.a_offering_id) or courseplat.can_edit_offering(c.b_offering_id))));
create policy caution_comments_insert on courseplat.caution_comments for insert to authenticated
  with check (author_id = auth.uid() and exists (select 1 from courseplat.content_cautions c where c.id = caution_id
                 and (courseplat.is_staff() or courseplat.can_edit_offering(c.a_offering_id) or courseplat.can_edit_offering(c.b_offering_id))));
create policy caution_events_select on courseplat.caution_events for select to authenticated
  using (exists (select 1 from courseplat.content_cautions c where c.id = caution_id
                 and (courseplat.is_staff() or courseplat.can_edit_offering(c.a_offering_id) or courseplat.can_edit_offering(c.b_offering_id))));

-- handover notes: professors and staff
create policy course_notes_select on courseplat.course_notes for select to authenticated
  using (courseplat.is_teacher());
create policy course_notes_insert on courseplat.course_notes for insert to authenticated
  with check (courseplat.is_teacher() and author_id = auth.uid());
create policy course_notes_delete on courseplat.course_notes for delete to authenticated
  using (author_id = auth.uid());

create policy course_visits_own on courseplat.course_visits for select to authenticated
  using (profile_id = auth.uid());

-- AI usage: staff see all; a user can count their own rows. Inserts: server (secret key).
create policy ai_calls_select on courseplat.ai_calls for select to authenticated
  using (courseplat.is_staff() or created_by = auth.uid());

-- Storage: private bucket for uploads, path {offering_id}/{uuid}.{ext} -------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('syllabus-uploads', 'syllabus-uploads', false, 15728640, array[
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy courseplat_uploads_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'syllabus-uploads' and courseplat.can_edit_upload_path(name));
create policy courseplat_uploads_select on storage.objects for select to authenticated
  using (bucket_id = 'syllabus-uploads' and courseplat.can_edit_upload_path(name));
