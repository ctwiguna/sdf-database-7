-- ==============================================================================
-- 20261012111800_enroll_course.sql
-- Bagian: BRILLIANT (brilliantgibrann16)
-- Stored Procedure RPC enroll_course dengan locking FOR UPDATE dan audit log atomik
-- Prasyarat: courses, enrollments, activity_logs
-- ==============================================================================

create or replace function public.enroll_course(p_course_id uuid)
returns public.enrollments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_course public.courses;
  v_enrollment public.enrollments;
  v_current_count int;
begin
  -- 1. Verifikasi autentikasi
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  -- 2. Verifikasi role pemanggil harus student
  select p.role into v_role from public.profiles p where p.id = v_uid;
  if v_role is distinct from 'student' then
    raise exception 'role_not_allowed' using errcode = '42501';
  end if;

  -- 3. Kunci baris course secara eksklusif (ROW-LEVEL LOCK: SELECT FOR UPDATE)
  -- Menjamin isolasi konkurensi agar kursi terakhir tidak diberikan ke dua siswa
  select * into v_course
  from public.courses
  where id = p_course_id
  for update;

  if not found then
    raise exception 'course_not_found' using errcode = 'P0002';
  end if;

  -- 4. Periksa status publikasi course
  if v_course.status is distinct from 'published' then
    raise exception 'course_not_published' using errcode = '55000';
  end if;

  -- 5. Periksa apakah sudah pernah terdaftar (idempoten: kembalikan enrollment lama tanpa log baru)
  select * into v_enrollment
  from public.enrollments
  where course_id = p_course_id and student_id = v_uid;

  if found then
    return v_enrollment;
  end if;

  -- 6. Periksa batas kapasitas kuota
  select count(*) into v_current_count
  from public.enrollments
  where course_id = p_course_id;

  if v_current_count >= v_course.capacity then
    raise exception 'course_capacity_full' using errcode = '54000';
  end if;

  -- 7. Tulis pendaftaran ke tabel enrollments
  insert into public.enrollments (course_id, student_id)
  values (p_course_id, v_uid)
  returning * into v_enrollment;

  -- 8. Tulis activity log dalam satu transaksi yang sama
  insert into public.activity_logs (actor_id, enrollment_id, action)
  values (v_uid, v_enrollment.id, 'enrolled');

  return v_enrollment;
end;
$$;

comment on function public.enroll_course(uuid) is
  'Mendaftarkan siswa ke course berstatus published dengan mengunci baris course (FOR UPDATE), memeriksa kapasitas, dan mencatat activity log enrolled secara atomik.';

revoke execute on function public.enroll_course(uuid) from public, anon;
grant execute on function public.enroll_course(uuid) to authenticated;
