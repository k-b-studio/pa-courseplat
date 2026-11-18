-- PA CoursePlat — 0002 functions (spec 02). All security definer with a pinned search_path,
-- executable by authenticated only (grants at the end).

set local search_path = courseplat, pg_temp;

-- role helpers ------------------------------------------------------------------------------
create or replace function courseplat.app_role() returns courseplat.user_role
language sql stable security definer set search_path = courseplat, pg_temp as $$
  select role from courseplat.profiles where id = auth.uid()
$$;

create or replace function courseplat.is_staff() returns boolean
language sql stable security definer set search_path = courseplat, pg_temp as $$
  select coalesce((select role = 'staff' from courseplat.profiles where id = auth.uid()), false)
$$;

create or replace function courseplat.is_teacher() returns boolean
language sql stable security definer set search_path = courseplat, pg_temp as $$
  select coalesce((select role in ('instructor','staff') from courseplat.profiles where id = auth.uid()), false)
$$;

create or replace function courseplat.can_edit_offering(p_offering uuid) returns boolean
language sql stable security definer set search_path = courseplat, pg_temp as $$
  select case
    when courseplat.is_staff() then exists (select 1 from courseplat.offerings where id = p_offering)
    when coalesce(courseplat.app_role() = 'instructor', false) then exists (
      select 1 from courseplat.offerings o
      where o.id = p_offering
        and (o.coordinator_id = auth.uid()
             or exists (select 1 from courseplat.sections s
                        join courseplat.section_instructors si on si.section_id = s.id
                        where s.offering_id = o.id and si.profile_id = auth.uid())))
    else false
  end
$$;

create or replace function courseplat.can_view_offering(p_offering uuid) returns boolean
language sql stable security definer set search_path = courseplat, pg_temp as $$
  select exists (select 1 from courseplat.offerings where id = p_offering and status = 'published')
      or courseplat.can_edit_offering(p_offering)
$$;

-- storage paths are {offering_id}/{uuid}.{ext}; a malformed folder is simply refused
create or replace function courseplat.can_edit_upload_path(p_name text) returns boolean
language plpgsql stable security definer set search_path = courseplat, pg_temp as $$
declare v_id uuid;
begin
  begin
    v_id := (string_to_array(p_name, '/'))[1]::uuid;
  exception when others then
    return false;
  end;
  return courseplat.can_edit_offering(v_id);
end $$;

-- text normalisation (mirrors src/lib/domain/normalize.ts) ----------------------------------
create or replace function courseplat.norm_title(p text) returns text
language sql immutable set search_path = courseplat, pg_temp as $$
  select regexp_replace(
           regexp_replace(
             lower(normalize(coalesce(p, ''), NFC)),
             '\([^)]*\m(ed|eds|edition|edn)\M\.?[^)]*\)', '', 'gi'),
           '[^a-z0-9ก-๙]', '', 'g')
$$;

-- reading key: every identifier we have, so a match on any of them counts (spec 06 Stage 1)
create or replace function courseplat.reading_key(p jsonb) returns text
language sql immutable set search_path = courseplat, pg_temp as $$
  select concat_ws('|',
    'isbn:' || nullif(regexp_replace(coalesce(p->>'isbn', ''), '[^0-9Xx]', '', 'g'), ''),
    'doi:' || nullif(lower(trim(coalesce(p->>'doi', ''))), ''),
    't:' || nullif(courseplat.norm_title(coalesce(nullif(p->>'title', ''), p->>'citation')), ''))
$$;

-- syllabus_items (spec 02) --------------------------------------------------------------------
create or replace function courseplat.rebuild_syllabus_items(p_offering uuid) returns void
language plpgsql security definer set search_path = courseplat, pg_temp as $$
declare v_doc jsonb;
begin
  select syllabus into v_doc from courseplat.offerings where id = p_offering;
  delete from courseplat.syllabus_items where offering_id = p_offering;
  if v_doc is null then return; end if;

  insert into courseplat.syllabus_items (offering_id, kind, ref, week, text, concepts, norm_key, content_hash)
  select p_offering, kind, ref, week, text, concepts, norm_key, md5(text || array_to_string(concepts, ','))
  from (
    select 'topic'::courseplat.caution_kind as kind,
           'weeklyPlan:' || (w->>'week') as ref,
           (w->>'week')::smallint as week,
           coalesce(w->>'topic', '') || case when coalesce(w->>'details', '') <> '' then ' — ' || (w->>'details') else '' end as text,
           coalesce(array(select jsonb_array_elements_text(coalesce(w->'concepts', '[]'::jsonb))), '{}') as concepts,
           null::text as norm_key
    from jsonb_array_elements(coalesce(v_doc->'weeklyPlan', '[]'::jsonb)) w
    where coalesce((w->>'noClass')::boolean, false) = false
      and w->>'week' is not null
      and coalesce(w->>'topic', '') <> ''
    union all
    select 'reading', 'readings:' || (r->>'id'), null, coalesce(r->>'citation', ''), '{}', courseplat.reading_key(r)
    from jsonb_array_elements(coalesce(v_doc->'resources'->'readings', '[]'::jsonb)) r
    where coalesce(r->>'citation', r->>'title', '') <> ''
    union all
    select 'assignment', 'work:' || (x->>'id'), nullif(x->>'dueWeek', '')::smallint,
           coalesce(x->>'title', '') || ' — ' || coalesce(x->>'description', '') || ' [' || coalesce(x->>'deliverable', '') || ']',
           '{}', null
    from jsonb_array_elements(coalesce(v_doc->'work', '[]'::jsonb)) x
    union all
    select 'objective', 'objectives:' || (o->>'id'), null, coalesce(o->>'text', ''), '{}', null
    from jsonb_array_elements(coalesce(v_doc->'objectives', '[]'::jsonb)) o
    where coalesce(o->>'text', '') <> ''
  ) items
  on conflict (offering_id, ref) do nothing;   -- a draft may repeat a week number
end $$;

-- save / publish / clone (spec 02 R3–R5) --------------------------------------------------------
create or replace function courseplat.save_syllabus(p_offering uuid, p_doc jsonb, p_expected_revision int)
returns int
language plpgsql security definer set search_path = courseplat, pg_temp as $$
declare v_rev int;
begin
  if not courseplat.can_edit_offering(p_offering) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_doc is null or jsonb_typeof(p_doc) <> 'object' or (p_doc->>'schemaVersion') is distinct from '1' then
    raise exception 'invalid_document' using errcode = '22023';
  end if;
  if octet_length(p_doc::text) > 262144 then
    raise exception 'document_too_large' using errcode = '22023';
  end if;

  update courseplat.offerings
     set syllabus = p_doc,
         revision = revision + 1,
         status = case when status = 'not_started' then 'draft' else status end,
         updated_by = auth.uid(),
         updated_at = now()
   where id = p_offering and revision = p_expected_revision
  returning revision into v_rev;

  if v_rev is null then
    raise exception 'revision_conflict' using errcode = 'P0409',
      detail = (select revision::text from courseplat.offerings where id = p_offering);
  end if;

  perform courseplat.rebuild_syllabus_items(p_offering);
  return v_rev;
end $$;

create or replace function courseplat.sections_snapshot(p_offering uuid) returns jsonb
language sql stable security definer set search_path = courseplat, pg_temp as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', s.id, 'sectionNo', s.section_no, 'language', s.language, 'capacity', s.capacity, 'note', s.note,
      'instructors', coalesce((
        select jsonb_agg(jsonb_build_object(
                 'profileId', si.profile_id, 'role', si.role, 'guestName', si.guest_name,
                 'titleTh', p.title_th, 'nameTh', p.name_th, 'nameEn', p.name_en)
               order by si.role, p.name_th)
        from courseplat.section_instructors si left join courseplat.profiles p on p.id = si.profile_id
        where si.section_id = s.id), '[]'::jsonb),
      'meetings', coalesce((
        select jsonb_agg(jsonb_build_object('weekday', m.weekday, 'startsAt', to_char(m.starts_at, 'HH24:MI'),
                 'endsAt', to_char(m.ends_at, 'HH24:MI'), 'room', m.room, 'mode', m.mode)
               order by m.weekday, m.starts_at)
        from courseplat.section_meetings m where m.section_id = s.id), '[]'::jsonb)
    ) order by s.section_no), '[]'::jsonb)
  from courseplat.sections s where s.offering_id = p_offering
$$;

create or replace function courseplat.publish_offering(p_offering uuid, p_expected_revision int)
returns uuid
language plpgsql security definer set search_path = courseplat, pg_temp as $$
declare
  o courseplat.offerings%rowtype;
  v_sum numeric;
  v_version uuid;
begin
  if not courseplat.can_edit_offering(p_offering) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select * into o from courseplat.offerings where id = p_offering for update;
  if o.revision <> p_expected_revision then
    raise exception 'revision_conflict' using errcode = 'P0409', detail = o.revision::text;
  end if;
  if o.syllabus is null then
    raise exception 'no_syllabus' using errcode = '22023';
  end if;
  if not exists (select 1 from courseplat.sections where offering_id = p_offering) then
    raise exception 'no_sections' using errcode = '22023';
  end if;
  if jsonb_array_length(coalesce(o.syllabus->'objectives', '[]'::jsonb)) = 0 then
    raise exception 'no_objectives' using errcode = '22023';
  end if;
  if coalesce(o.syllabus->'evaluation'->>'gradingScheme', 'letter') = 'letter' then
    select coalesce(sum((i->>'weightPercent')::numeric), 0) into v_sum
      from jsonb_array_elements(coalesce(o.syllabus->'evaluation'->'items', '[]'::jsonb)) i;
    if v_sum <> 100 then
      raise exception 'weights_not_100' using errcode = '22023', detail = v_sum::text;
    end if;
  end if;

  -- already published at this revision: nothing new to snapshot
  select id into v_version from courseplat.offering_versions where offering_id = p_offering and revision = o.revision;
  if v_version is null then
    insert into courseplat.offering_versions (offering_id, revision, syllabus, sections_snapshot, published_by)
    values (p_offering, o.revision, o.syllabus, courseplat.sections_snapshot(p_offering), auth.uid())
    returning id into v_version;
  end if;

  update courseplat.offerings
     set status = 'published', published_at = now(), published_revision = o.revision
   where id = p_offering;
  return v_version;
end $$;

create or replace function courseplat.unpublish_offering(p_offering uuid) returns void
language plpgsql security definer set search_path = courseplat, pg_temp as $$
begin
  if not courseplat.can_edit_offering(p_offering) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update courseplat.offerings set status = 'draft' where id = p_offering and status = 'published';
end $$;

create or replace function courseplat.clone_offering(p_target uuid, p_source_version uuid) returns int
language plpgsql security definer set search_path = courseplat, pg_temp as $$
declare
  v_doc jsonb;
  v_source_offering uuid;
  v_rev int;
begin
  if not courseplat.can_edit_offering(p_target) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select v.syllabus, v.offering_id into v_doc, v_source_offering
    from courseplat.offering_versions v
    join courseplat.offerings src on src.id = v.offering_id
    join courseplat.offerings tgt on tgt.id = p_target
   where v.id = p_source_version and src.course_code = tgt.course_code;
  if v_doc is null then
    raise exception 'source_not_found' using errcode = '22023';
  end if;

  v_doc := jsonb_set(v_doc, '{keyDates}', coalesce(
    (select jsonb_agg(kd || jsonb_build_object('date', null) order by n)
       from jsonb_array_elements(coalesce(v_doc->'keyDates', '[]'::jsonb)) with ordinality t(kd, n)), '[]'::jsonb));
  v_doc := jsonb_set(v_doc, '{weeklyPlan}', coalesce(
    (select jsonb_agg(w || jsonb_build_object('instructorIds', '[]'::jsonb) order by n)
       from jsonb_array_elements(coalesce(v_doc->'weeklyPlan', '[]'::jsonb)) with ordinality t(w, n)), '[]'::jsonb));

  update courseplat.offerings
     set syllabus = v_doc,
         revision = revision + 1,
         status = case when status = 'not_started' then 'draft' else status end,
         cloned_from = v_source_offering,
         updated_by = auth.uid(),
         updated_at = now()
   where id = p_target
  returning revision into v_rev;

  perform courseplat.rebuild_syllabus_items(p_target);
  return v_rev;
end $$;

-- the working document is not readable through plain selects (column privileges in 0003);
-- editors and staff read it here
create or replace function courseplat.get_offering_syllabi(p_ids uuid[])
returns table (id uuid, syllabus jsonb, revision int)
language sql stable security definer set search_path = courseplat, pg_temp as $$
  select o.id, o.syllabus, o.revision from courseplat.offerings o
  where o.id = any(p_ids) and courseplat.can_edit_offering(o.id)
$$;

-- Content Caution resolution (spec 06 R6) -------------------------------------------------------
create or replace function courseplat.resolve_caution(
  p_id uuid, p_status courseplat.caution_status, p_note text default null,
  p_relation courseplat.caution_relation default null)
returns void
language plpgsql security definer set search_path = courseplat, pg_temp as $$
declare c courseplat.content_cautions%rowtype;
begin
  select * into c from courseplat.content_cautions where id = p_id for update;
  if c.id is null then
    raise exception 'not_found' using errcode = '22023';
  end if;
  if not (courseplat.is_staff()
          or courseplat.can_edit_offering(c.a_offering_id)
          or courseplat.can_edit_offering(c.b_offering_id)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_status = 'dismissed' and coalesce(trim(p_note), '') = '' then
    raise exception 'note_required' using errcode = '22023';
  end if;

  update courseplat.content_cautions
     set status = p_status,
         relation = coalesce(p_relation, relation),
         resolved_by = case when p_status = 'open' then null else auth.uid() end,
         resolved_at = case when p_status = 'open' then null else now() end,
         resolution_note = nullif(trim(coalesce(p_note, '')), ''),
         updated_at = now()
   where id = p_id;

  insert into courseplat.caution_events (caution_id, actor_id, status, relation, note)
  values (p_id, auth.uid(), p_status, coalesce(p_relation, c.relation), nullif(trim(coalesce(p_note, '')), ''));
end $$;

-- sections (spec 05 R9) ----------------------------------------------------------------------
create or replace function courseplat.update_section_details(p_section uuid, p_note text, p_meetings jsonb)
returns void
language plpgsql security definer set search_path = courseplat, pg_temp as $$
begin
  if not (courseplat.is_staff() or (courseplat.app_role() = 'instructor' and exists (
            select 1 from courseplat.section_instructors
             where section_id = p_section and profile_id = auth.uid()))) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update courseplat.sections set note = coalesce(p_note, '') where id = p_section;
  if p_meetings is not null then
    delete from courseplat.section_meetings where section_id = p_section;
    insert into courseplat.section_meetings (section_id, weekday, starts_at, ends_at, room, mode)
    select p_section, (m->>'weekday')::smallint, (m->>'startsAt')::time, (m->>'endsAt')::time,
           coalesce(m->>'room', ''), coalesce(m->>'mode', 'onsite')
      from jsonb_array_elements(p_meetings) m;
  end if;
end $$;

-- self-service profile fields (spec 02) --------------------------------------------------------
create or replace function courseplat.update_my_profile(
  p_title_th text, p_name_th text, p_name_en text, p_office text, p_office_hours text,
  p_contact_note text, p_major courseplat.major_code)
returns void
language plpgsql security definer set search_path = courseplat, pg_temp as $$
declare v_role courseplat.user_role := courseplat.app_role();
begin
  if v_role is null then
    raise exception 'no_profile' using errcode = '42501';
  end if;
  if v_role = 'student' then
    update courseplat.profiles set major = p_major where id = auth.uid();
  else
    update courseplat.profiles
       set title_th = p_title_th, name_th = p_name_th, name_en = p_name_en,
           office = p_office, office_hours = p_office_hours, contact_note = p_contact_note
     where id = auth.uid();
  end if;
end $$;

-- the caution badge (spec 06 R9) and editor visits (spec 07 R12)
create or replace function courseplat.mark_cautions_seen() returns void
language sql security definer set search_path = courseplat, pg_temp as $$
  update courseplat.profiles set cautions_seen_at = now() where id = auth.uid()
$$;

create or replace function courseplat.touch_course_visit(p_course char(7)) returns timestamptz
language plpgsql security definer set search_path = courseplat, pg_temp as $$
declare v_prev timestamptz;
begin
  if not courseplat.is_teacher() then return null; end if;
  select last_opened_at into v_prev from courseplat.course_visits
   where profile_id = auth.uid() and course_code = p_course;
  insert into courseplat.course_visits (profile_id, course_code, last_opened_at)
  values (auth.uid(), p_course, now())
  on conflict (profile_id, course_code) do update set last_opened_at = excluded.last_opened_at;
  return v_prev;
end $$;
