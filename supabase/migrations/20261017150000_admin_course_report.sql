-- admin_course_report (kontrak: issue #4, bukti analitik IK301).
-- Satu baris per course berisi jumlah lesson, jumlah peserta, rerata progres, dan
-- jumlah peserta yang seluruh lessonnya selesai. Angka dihitung saat query dipanggil.
-- SECURITY DEFINER melewati RLS, jadi hak akses diperiksa manual lewat auth.uid().
-- Prasyarat: profiles, courses, course_modules, lessons, enrollments, lesson_progress.

create or replace function public.admin_course_report(p_course_id uuid default null)
returns table (
  course_id uuid,
  course_title text,
  mentor_name text,
  status text,
  total_lessons int,
  total_participants int,
  average_progress numeric,
  completed_participants int
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
    from public.profiles p
    where p.id = v_uid and p.role = 'admin'
  ) then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  return query
  with lesson_total as (
    select l.course_id as cid, count(*)::int as t
    from public.lessons l
    group by l.course_id
  ),
  per_enrollment as (
    select lp.course_id as cid, lp.enrollment_id as eid, count(*)::int as done
    from public.lesson_progress lp
    group by lp.course_id, lp.enrollment_id
  ),
  per_course as (
    select e.course_id as cid,
           count(*)::int as participants,
           coalesce(sum(pe.done), 0)::int as total_done,
           count(*) filter (
             where coalesce(lt.t, 0) > 0 and coalesce(pe.done, 0) >= coalesce(lt.t, 0)
           )::int as completed
    from public.enrollments e
    left join per_enrollment pe on pe.eid = e.id
    left join lesson_total lt on lt.cid = e.course_id
    group by e.course_id
  )
  select c.id,
         c.title,
         coalesce(mp.display_name, 'Belum ada mentor'),
         c.status,
         coalesce(lt.t, 0),
         coalesce(pc.participants, 0),
         case
           when coalesce(lt.t, 0) = 0 or coalesce(pc.participants, 0) = 0 then 0::numeric
           else round(
             coalesce(pc.total_done, 0) * 100.0
               / (coalesce(lt.t, 0)::numeric * coalesce(pc.participants, 0)),
             1
           )
         end,
         coalesce(pc.completed, 0)
  from public.courses c
  left join public.profiles mp on mp.id = c.mentor_id
  left join lesson_total lt on lt.cid = c.id
  left join per_course pc on pc.cid = c.id
  where p_course_id is null or c.id = p_course_id
  order by c.title, c.id;
end;
$$;

comment on function public.admin_course_report(uuid) is
  'Laporan seluruh course untuk admin: jumlah lesson, jumlah peserta, rerata progres seluruh peserta, dan jumlah peserta yang selesai penuh. average_progress bernilai 0 bila course belum punya lesson atau belum punya peserta, bukan error bagi nol. Tanpa p_course_id, seluruh course dilaporkan termasuk draft dan course tanpa mentor.';

revoke execute on function public.admin_course_report(uuid) from public, anon;
grant execute on function public.admin_course_report(uuid) to authenticated;
