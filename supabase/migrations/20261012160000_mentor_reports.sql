-- course_progress dan mentor_course_report (kontrak: issue #4).
-- Persentase dan jumlah selesai dihitung saat query, tidak disimpan.
-- SECURITY DEFINER melewati RLS, jadi hak akses diperiksa manual lewat auth.uid().
-- Prasyarat: profiles, courses, course_modules, lessons, enrollments, lesson_progress.

create or replace function public.course_progress(p_course_id uuid)
returns table (
  module_id uuid,
  module_position int,
  module_title text,
  total_lessons int,
  completed_lessons int
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_enrollment_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select e.id into v_enrollment_id
  from public.enrollments e
  where e.course_id = p_course_id and e.student_id = v_uid;

  if v_enrollment_id is null then
    raise exception 'not_enrolled' using errcode = '42501';
  end if;

  return query
  select m.id,
         m.position,
         m.title,
         count(l.id)::int,
         count(lp.id)::int
  from public.course_modules m
  left join public.lessons l
         on l.module_id = m.id and l.course_id = m.course_id
  left join public.lesson_progress lp
         on lp.lesson_id = l.id and lp.enrollment_id = v_enrollment_id
  where m.course_id = p_course_id
  group by m.id, m.position, m.title
  order by m.position;
end;
$$;

comment on function public.course_progress(uuid) is
  'Progres siswa pemanggil per modul pada satu course: total dan jumlah lesson selesai. Persentase dihitung oleh pemanggil.';

create or replace function public.mentor_course_report(p_course_id uuid)
returns table (
  enrollment_id uuid,
  student_name text,
  total_lessons int,
  completed_lessons int,
  progress_percent numeric,
  is_completed boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.courses c
    join public.profiles pr on pr.id = v_uid
    where c.id = p_course_id
      and c.mentor_id = v_uid
      and pr.role = 'mentor'
  ) then
    raise exception 'not_course_mentor' using errcode = '42501';
  end if;

  return query
  with total as (
    select count(*)::int as t
    from public.lessons l
    where l.course_id = p_course_id
  ),
  done as (
    select lp.enrollment_id as eid, count(*)::int as c
    from public.lesson_progress lp
    where lp.course_id = p_course_id
    group by lp.enrollment_id
  )
  select e.id,
         p.display_name,
         tt.t,
         coalesce(d.c, 0),
         case when tt.t = 0 then 0::numeric
              else round(coalesce(d.c, 0) * 100.0 / tt.t, 1) end,
         (tt.t > 0 and coalesce(d.c, 0) = tt.t)
  from public.enrollments e
  join public.profiles p on p.id = e.student_id
  cross join total tt
  left join done d on d.eid = e.id
  where e.course_id = p_course_id
  order by p.display_name, e.id;
end;
$$;

comment on function public.mentor_course_report(uuid) is
  'Laporan progres per peserta untuk mentor pemilik course. Tanpa skor atau penilaian.';

revoke execute on function public.course_progress(uuid) from public, anon;
revoke execute on function public.mentor_course_report(uuid) from public, anon;
grant execute on function public.course_progress(uuid) to authenticated;
grant execute on function public.mentor_course_report(uuid) to authenticated;
