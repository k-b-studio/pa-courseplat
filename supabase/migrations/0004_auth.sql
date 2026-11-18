-- PA CoursePlat — 0004 sign-up hook, profiles on first sign-in, directory → role sync (spec 03).
--
-- The project is shared with creditGPAX, whose hook public.hook_before_user_created stays in place,
-- unchanged and unused. public.shared_before_user_created is the ONLY object PA CoursePlat adds to
-- public (spec 02 rule 3). It allows the union of both apps:
--   Google + PolSci student address   (creditGPAX's rule unchanged, and PA CoursePlat students)
--   Google + @chula.ac.th             (PA CoursePlat staff)
--   Email provider + courseplat.demo_accounts
-- The refusal message keeps the word "PolSci", which creditGPAX's return page looks for.

set local search_path = courseplat, pg_temp;

create or replace function public.shared_before_user_created(event jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_email text := lower(coalesce(event -> 'user' ->> 'email', ''));
  v_provider text := coalesce(event -> 'user' -> 'app_metadata' ->> 'provider', '');
begin
  if v_provider = 'google'
     and (v_email ~ '^[0-9]{8}24@student\.chula\.ac\.th$' or v_email ~ '^[a-z0-9._%+-]+@chula\.ac\.th$') then
    return '{}'::jsonb;
  end if;
  if v_provider = 'email'
     and exists (select 1 from courseplat.demo_accounts d where d.email = v_email) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'Accounts are for Chula PolSci students and Chula staff only'
    )
  );
end;
$$;

grant execute on function public.shared_before_user_created(jsonb) to supabase_auth_admin;
revoke execute on function public.shared_before_user_created(jsonb) from authenticated, anon, public;

-- the hook runs as supabase_auth_admin and reads only demo_accounts
grant usage on schema courseplat to supabase_auth_admin;
grant select on courseplat.demo_accounts to supabase_auth_admin;
create policy demo_accounts_auth_admin on courseplat.demo_accounts for select to supabase_auth_admin using (true);

-- profiles on first sign-in (no trigger on auth.users: spec 02 rule 4) ---------------------------
create or replace function courseplat.ensure_profile() returns courseplat.profiles
language plpgsql security definer set search_path = courseplat, pg_temp as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  p courseplat.profiles;
  d courseplat.demo_accounts;
  s courseplat.staff_directory;
  v_role courseplat.user_role;
  v_cohort smallint;
  v_major courseplat.major_code;
  v_demo boolean := false;
  v_title text; v_name_th text; v_name_en text;
begin
  if v_uid is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;

  select * into p from courseplat.profiles where id = v_uid;
  if found then
    return p;
  end if;

  if v_email = '' then
    select lower(u.email) into v_email from auth.users u where u.id = v_uid;
  end if;

  select * into d from courseplat.demo_accounts where email = v_email;
  select * into s from courseplat.staff_directory where email = v_email;

  if s.email is not null then
    v_role := s.role; v_title := s.title_th; v_name_th := s.name_th; v_name_en := s.name_en;
    v_demo := d.email is not null;
  elsif d.email is not null then
    v_role := d.role; v_cohort := d.cohort; v_major := d.major; v_demo := true; v_name_th := d.label_th;
  elsif v_email ~ '^[0-9]{8}24@student\.chula\.ac\.th$' then
    v_role := 'student'; v_cohort := substr(v_email, 1, 2)::smallint;
  elsif v_email ~ '^[a-z0-9._%+-]+@chula\.ac\.th$' then
    v_role := 'viewer';
  else
    raise exception 'not_allowed' using errcode = '42501';
  end if;

  if d.email is not null and v_role = 'student' then
    v_cohort := d.cohort; v_major := d.major; v_name_th := coalesce(v_name_th, d.label_th);
  end if;

  insert into courseplat.profiles (id, email, role, cohort, major, title_th, name_th, name_en, is_demo)
  values (v_uid, v_email, v_role, v_cohort, v_major, v_title, v_name_th, v_name_en, v_demo)
  on conflict (id) do nothing;

  -- link section assignments made before this person first signed in (spec 07 R9)
  update courseplat.section_instructors
     set profile_id = v_uid, pending_email = null
   where pending_email = v_email;

  select * into p from courseplat.profiles where id = v_uid;
  return p;
end $$;

revoke execute on function courseplat.ensure_profile() from public, anon;
grant execute on function courseplat.ensure_profile() to authenticated;

-- directory changes apply to existing profiles at once (spec 03 R4) ------------------------------
create or replace function courseplat.sync_staff_role() returns trigger
language plpgsql security definer set search_path = courseplat, pg_temp as $$
begin
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.email <> new.email) then
    update courseplat.profiles set role = 'viewer'
     where email = old.email and role in ('instructor', 'staff');
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    update courseplat.profiles
       set role = new.role,
           title_th = coalesce(new.title_th, title_th),
           name_th = coalesce(new.name_th, name_th),
           name_en = coalesce(new.name_en, name_en)
     where email = new.email and role <> 'student';
    return new;
  end if;
  return old;
end $$;

revoke execute on function courseplat.sync_staff_role() from public, anon, authenticated;

create trigger staff_directory_sync
  after insert or update or delete on courseplat.staff_directory
  for each row execute function courseplat.sync_staff_role();
