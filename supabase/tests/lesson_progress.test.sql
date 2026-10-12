-- Uji lesson_progress dan complete_lesson.
-- Prasyarat: seluruh migration diterapkan, role anon dan authenticated tersedia,
-- serta auth.uid() mengikuti konvensi Supabase (request.jwt.claims -> sub).
-- Jalankan dari folder repo:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/lesson_progress.test.sql
-- Skrip membungkus semua langkah dalam satu transaksi dan ditutup dengan rollback,
-- jadi data kini tidak tertinggal dan skrip aman dijalankan berulang.

\set ON_ERROR_STOP on

begin;

create or replace function pg_temp.assert_true(p_condition boolean, p_message text)
returns void language plpgsql as $$
begin
  if p_condition is distinct from true then
    raise exception 'GAGAL: %', p_message;
  end if;
  raise notice 'OK: %', p_message;
end;
$$;

create or replace function pg_temp.assert_rejects(p_statement text, p_expected text, p_message text)
returns void language plpgsql as $$
declare
  v_matched boolean := false;
begin
  begin
    execute p_statement;
  exception when others then
    v_matched := position(p_expected in sqlerrm) > 0;
    if not v_matched then
      raise exception 'GAGAL: % (pesan aktual: %)', p_message, sqlerrm;
    end if;
  end;
  if not v_matched then
    raise exception 'GAGAL: % (statement tidak ditolak)', p_message;
  end if;
  raise notice 'OK: %', p_message;
end;
$$;

-- ---- fixture ----
-- Sesuaikan bila nama kolom profil berbeda pada migration pemilik tabel.
insert into public.profiles (id, role, display_name) values
  ('11111111-1111-4111-8111-111111111111', 'student', 'Siswa A'),
  ('22222222-2222-4222-8222-222222222222', 'student', 'Siswa B'),
  ('55555555-5555-4555-8555-555555555555', 'student', 'Siswa C'),
  ('33333333-3333-4333-8333-333333333333', 'mentor', 'Mentor A'),
  ('66666666-6666-4666-8666-666666666666', 'mentor', 'Mentor B'),
  ('44444444-4444-4444-8444-444444444444', 'admin', 'Admin A');

insert into public.courses (id, mentor_id, title, capacity, status) values
  ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', '33333333-3333-4333-8333-333333333333', 'Course A', 20, 'published'),
  ('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb', '66666666-6666-4666-8666-666666666666', 'Course B', 20, 'published');

insert into public.course_modules (id, course_id, title, position) values
  ('a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1', 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', 'Modul A', 1),
  ('b1b1b1b1-2222-4222-8222-b1b1b1b1b1b1', 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb', 'Modul B', 1);

insert into public.lessons (id, module_id, course_id, title, position, youtube_video_id) values
  ('a11a11a1-1111-4111-8111-a11a11a1a11a', 'a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1', 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', 'Lesson A1', 1, 'abcdefghijk'),
  ('a22a22a2-1111-4111-8111-a22a22a2a22a', 'a1a1a1a1-1111-4111-8111-a1a1a1a1a1a1', 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', 'Lesson A2', 2, 'lmnopqrstuv'),
  ('b11b11b1-2222-4222-8222-b11b11b1b11b', 'b1b1b1b1-2222-4222-8222-b1b1b1b1b1b1', 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb', 'Lesson B1', 1, 'wxyzabcdefg');

insert into public.enrollments (id, course_id, student_id) values
  ('ea11ea11-1111-4111-8111-ea11ea11ea11', 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111'),
  ('eb22eb22-2222-4222-8222-eb22eb22eb22', 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222'),
  ('ec55ec55-5555-4555-8555-ec55ec55ec55', 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb', '55555555-5555-4555-8555-555555555555');

-- ---- struktur ----
select pg_temp.assert_true(
  to_regclass('public.lesson_progress_course_completed_at_idx') is not null,
  'index lesson_progress(course_id, completed_at desc) ada');

-- ---- siswa A menandai lesson A1 ----
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111"}', true);

select pg_temp.assert_true(
  (select (public.complete_lesson('a11a11a1-1111-4111-8111-a11a11a1a11a')).lesson_id::text) = 'a11a11a1-1111-4111-8111-a11a11a1a11a',
  'complete_lesson mengembalikan baris progres untuk lesson A1');

select pg_temp.assert_true(
  (select count(*) from public.lesson_progress) = 1,
  'siswa A membaca progresnya sendiri dan berjumlah 1');

reset role;
select pg_temp.assert_true(
  (select count(*) from public.activity_logs where action = 'lesson_completed') = 1,
  'satu log lesson_completed tercatat');
select pg_temp.assert_true(
  (select bool_and(actor_id = '11111111-1111-4111-8111-111111111111' and lesson_progress_id is not null)
   from public.activity_logs where action = 'lesson_completed'),
  'log berisi actor siswa A dan id progres');

-- ---- pemanggilan ulang idempoten ----
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111"}', true);
select pg_temp.assert_true(
  (select (public.complete_lesson('a11a11a1-1111-4111-8111-a11a11a1a11a')).lesson_id::text) = 'a11a11a1-1111-4111-8111-a11a11a1a11a',
  'pemanggilan ulang tetap mengembalikan baris yang sama');
reset role;
select pg_temp.assert_true(
  (select count(*) from public.lesson_progress where lesson_id = 'a11a11a1-1111-4111-8111-a11a11a1a11a') = 1,
  'pemanggilan ulang tidak menambah baris progres');
select pg_temp.assert_true(
  (select count(*) from public.activity_logs where action = 'lesson_completed') = 1,
  'pemanggilan ulang tidak menambah log');

-- ---- siswa B menandai lesson A2 pada course yang sama ----
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222"}', true);
select public.complete_lesson('a22a22a2-1111-4111-8111-a22a22a2a22a');
reset role;
select pg_temp.assert_true(
  (select count(*) from public.lesson_progress) = 2,
  'siswa B menandai lesson A2, total progres menjadi 2');

-- ---- siswa C hanya terdaftar di course B ----
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-5555-4555-8555-555555555555"}', true);
select public.complete_lesson('b11b11b1-2222-4222-8222-b11b11b1b11b');
reset role;
select pg_temp.assert_true(
  (select count(*) from public.lesson_progress) = 3,
  'siswa C menandai lesson B1, total progres menjadi 3');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"55555555-5555-4555-8555-555555555555"}', true);
select pg_temp.assert_rejects(
  $sql$ select public.complete_lesson('a11a11a1-1111-4111-8111-a11a11a1a11a') $sql$,
  'not_enrolled',
  'siswa yang tidak terdaftar ditolak');
reset role;

-- ---- tanpa sesi ----
set local role authenticated;
select set_config('request.jwt.claims', '', true);
select pg_temp.assert_rejects(
  $sql$ select public.complete_lesson('a11a11a1-1111-4111-8111-a11a11a1a11a') $sql$,
  'not_authenticated',
  'pemanggilan tanpa sesi ditolak');
reset role;

-- ---- mentor tidak boleh memakai RPC siswa ----
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333"}', true);
select pg_temp.assert_rejects(
  $sql$ select public.complete_lesson('a11a11a1-1111-4111-8111-a11a11a1a11a') $sql$,
  'role_not_allowed',
  'mentor ditolak oleh complete_lesson');
reset role;

-- ---- pengguna tidak bisa menulis langsung ----
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111"}', true);
select pg_temp.assert_rejects(
  $sql$ insert into public.lesson_progress (enrollment_id, lesson_id, course_id)
       values ('ea11ea11-1111-4111-8111-ea11ea11ea11', 'a22a22a2-1111-4111-8111-a22a22a2a22a', 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') $sql$,
  'permission denied',
  'insert langsung ke lesson_progress ditolak');
reset role;

-- ---- integritas lintas course ----
select pg_temp.assert_rejects(
  $sql$ insert into public.lesson_progress (enrollment_id, lesson_id, course_id)
       values ('ea11ea11-1111-4111-8111-ea11ea11ea11', 'b11b11b1-2222-4222-8222-b11b11b1b11b', 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') $sql$,
  'violates foreign key constraint',
  'enrollment course A tidak bisa dipasangkan dengan lesson course B');

-- ---- keterbacaan progres lewat RLS ----
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222"}', true);
select pg_temp.assert_true(
  (select count(*) from public.lesson_progress) = 1
  and (select count(*) from public.lesson_progress where enrollment_id = 'ea11ea11-1111-4111-8111-ea11ea11ea11') = 0,
  'siswa B hanya melihat progresnya sendiri');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333"}', true);
select pg_temp.assert_true(
  (select count(*) from public.lesson_progress) = 2,
  'mentor A hanya melihat progres course yang ia ampu');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444"}', true);
select pg_temp.assert_true(
  (select count(*) from public.lesson_progress) = 3,
  'admin melihat seluruh progres');
reset role;

-- ---- rollback: log gagal, progres ikut batal ----
create or replace function public._test_reject_log()
returns trigger language plpgsql as $$
begin
  raise exception 'log ditolak untuk uji rollback';
end;
$$;

create trigger test_reject_log before insert on public.activity_logs
  for each row execute function public._test_reject_log();

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111"}', true);
select pg_temp.assert_rejects(
  $sql$ select public.complete_lesson('a22a22a2-1111-4111-8111-a22a22a2a22a') $sql$,
  'log ditolak untuk uji rollback',
  'siswa A gagal menandai lesson A2 saat log ditolak');
reset role;

drop trigger test_reject_log on public.activity_logs;
drop function public._test_reject_log();

select pg_temp.assert_true(
  (select count(*) from public.lesson_progress
   where enrollment_id = 'ea11ea11-1111-4111-8111-ea11ea11ea11' and lesson_id = 'a22a22a2-1111-4111-8111-a22a22a2a22a') = 0,
  'rollback: tidak ada progres tersisa saat log gagal');
select pg_temp.assert_true(
  (select count(*) from public.activity_logs) = 3,
  'rollback: jumlah log tidak bertambah');

select 'SEMUA UJI LESSON_PROGRESS LULUS' as hasil;

rollback;
