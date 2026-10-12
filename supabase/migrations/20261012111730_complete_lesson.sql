-- complete_lesson menandai satu lesson selesai untuk siswa yang terdaftar.
-- Semua pemeriksaan berjalan di database: auth.uid(), role student, kepemilikan
-- enrollment, lesson berada di course yang sama, dan course masih published.
-- Idempoten: pemanggilan ulang tidak membuat baris atau log baru.
-- Jika insert log gagal, seluruh transaksi ikut rollback.
-- Prasyarat: lesson_progress dan activity_logs.

create or replace function public.complete_lesson(p_lesson_id uuid)
returns public.lesson_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_course_id uuid;
  v_enrollment_id uuid;
  v_progress public.lesson_progress;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select p.role into v_role from public.profiles p where p.id = v_uid;
  if v_role is distinct from 'student' then
    raise exception 'role_not_allowed' using errcode = '42501';
  end if;

  select l.course_id into v_course_id
  from public.lessons l
  where l.id = p_lesson_id;

  if not found then
    raise exception 'lesson_not_found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.courses c
    where c.id = v_course_id and c.status = 'published'
  ) then
    raise exception 'course_not_published' using errcode = '55000';
  end if;

  select e.id into v_enrollment_id
  from public.enrollments e
  where e.student_id = v_uid and e.course_id = v_course_id;

  if not found then
    raise exception 'not_enrolled' using errcode = '42501';
  end if;

  insert into public.lesson_progress (enrollment_id, lesson_id, course_id)
  values (v_enrollment_id, p_lesson_id, v_course_id)
  on conflict (enrollment_id, lesson_id) do nothing
  returning * into v_progress;

  if v_progress.id is null then
    -- sudah pernah ditandai selesai: kembalikan baris lama tanpa log baru
    select lp.* into v_progress
    from public.lesson_progress lp
    where lp.enrollment_id = v_enrollment_id and lp.lesson_id = p_lesson_id;
  else
    insert into public.activity_logs (actor_id, enrollment_id, lesson_progress_id, action)
    values (v_uid, v_enrollment_id, v_progress.id, 'lesson_completed');
  end if;

  return v_progress;
end;
$$;

comment on function public.complete_lesson(uuid) is
  'Menandai lesson selesai untuk siswa yang terdaftar. Idempoten dan menulis log lesson_completed hanya saat baris progres baru dibuat.';

revoke execute on function public.complete_lesson(uuid) from public, anon;
grant execute on function public.complete_lesson(uuid) to authenticated;
