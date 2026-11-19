-- PA CoursePlat — 0005 offering listing for the course list (spec 04 R1, AC 9).
--
-- Students may read only published offerings (RLS, spec 02). The course list still has to show
-- that a course is offered but not yet published ("ยังไม่เผยแพร่ประมวลรายวิชา"), and a guessed URL
-- for a draft must show that state rather than "not found". This returns exactly that and nothing
-- more: which courses have an offering in a semester, and its status. No syllabus, sections or people.

set local search_path = courseplat, pg_temp;

create or replace function courseplat.offering_listing(p_semester text)
returns table (offering_id uuid, course_code char(7), status courseplat.offering_status)
language sql stable security definer set search_path = courseplat, pg_temp as $$
  select o.id, o.course_code, o.status
    from courseplat.offerings o
   where o.semester_id = p_semester and auth.uid() is not null
   order by o.course_code
$$;

revoke execute on function courseplat.offering_listing(text) from public, anon;
grant execute on function courseplat.offering_listing(text) to authenticated, service_role;
