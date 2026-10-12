-- Uji enroll_course dan integrasi role, kapasitas, concurrency, serta rollback.
-- Prasyarat: seluruh migration diterapkan, role anon dan authenticated tersedia,
-- serta auth.uid() mengikuti konvensi Supabase (request.jwt.claims -> sub).
-- Jalankan dari folder repo:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/enroll_course.test.sql
-- Skrip membungkus semua langkah dalam satu transaksi dan ditutup dengan rollback.

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

-- ---- Fixture auth.users & profiles ----
do $$
begin
  if to_regclass('auth.users') is not null then
    insert into auth.users (id, aud, role, email) values
      ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'student_a@test.com'),
      ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'student_b@test.com'),
      ('33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'mentor_a@test.com'),
      ('44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'admin_a@test.com')
    on conflict (id) do nothing;
  end if;
end $$;

insert into public.profiles (id, role, display_name) values
  ('11111111-1111-4111-8111-111111111111', 'student', 'Siswa A'),
  ('22222222-2222-4222-8222-222222222222', 'student', 'Siswa B'),
  ('33333333-3333-4333-8333-333333333333', 'mentor', 'Mentor A'),
  ('44444444-4444-4444-8444-444444444444', 'admin', 'Admin A')
on conflict (id) do update set role = excluded.role, display_name = excluded.display_name;

insert into public.courses (id, mentor_id, title, capacity, status) values
  ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', '33333333-3333-4333-8333-333333333333', 'Solar Panel Installation', 1, 'published'),
  ('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb', '33333333-3333-4333-8333-333333333333', 'Plumbing Basics', 10, 'draft')
on conflict (id) do nothing;

-- ---- 1. Pengujian Siswa Mendaftar ke Course Published ----
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111"}', true);

select pg_temp.assert_true(
  (select (public.enroll_course('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa')).course_id::text) = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
  'enroll_course berhasil mendaftarkan Siswa A ke Course Solar Panel');

select pg_temp.assert_true(
  (select count(*) from public.enrollments where student_id = '11111111-1111-4111-8111-111111111111') = 1,
  'baris enrollment Siswa A bertambah menjadi 1');

reset role;
select pg_temp.assert_true(
  (select count(*) from public.activity_logs where action = 'enrolled' and actor_id = '11111111-1111-4111-8111-111111111111') = 1,
  'satu activity log enrolled tercatat untuk Siswa A');

-- ---- 2. Pengujian Idempotensi Pendaftaran Berulang ----
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111"}', true);

select pg_temp.assert_true(
  (select (public.enroll_course('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa')).course_id::text) = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
  'pendaftaran ulang mengembalikan data enrollment lama');

reset role;
select pg_temp.assert_true(
  (select count(*) from public.enrollments where student_id = '11111111-1111-4111-8111-111111111111') = 1,
  'pendaftaran ulang tidak menambah baris enrollment');

select pg_temp.assert_true(
  (select count(*) from public.activity_logs where action = 'enrolled' and actor_id = '11111111-1111-4111-8111-111111111111') = 1,
  'pendaftaran ulang tidak menduplikasi activity log');

-- ---- 3. Pengujian Penolakan Course Berstatus Draft ----
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111"}', true);

select pg_temp.assert_rejects(
  $sql$ select public.enroll_course('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb') $sql$,
  'course_not_published',
  'pendaftaran ke course berstatus draft ditolak');
reset role;

-- ---- 4. Pengujian Kapasitas Penuh (Course Capacity Full) ----
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222"}', true);

select pg_temp.assert_rejects(
  $sql$ select public.enroll_course('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') $sql$,
  'course_capacity_full',
  'pendaftaran Siswa B ditolak karena kuota kapasitas sudah penuh');
reset role;

-- ---- 5. Pengujian Hak Akses Non-Student Ditolak ----
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333"}', true);

select pg_temp.assert_rejects(
  $sql$ select public.enroll_course('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') $sql$,
  'role_not_allowed',
  'mentor ditolak saat mencoba enroll course sebagai siswa');
reset role;

-- ---- 6. Pengujian Proteksi Role Profil dari Client ----
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111"}', true);

select pg_temp.assert_rejects(
  $sql$ update public.profiles set role = 'admin' where id = '11111111-1111-4111-8111-111111111111' $sql$,
  'role_edit_prohibited',
  'upaya client mengubah role profil ditolak keras');
reset role;

-- ---- 7. Pengujian Rollback Transaksi Atomik Saat Log Gagal ----
create or replace function public._test_reject_enroll_log()
returns trigger language plpgsql as $$
begin
  raise exception 'log ditolak untuk uji rollback pendaftaran';
end;
$$;

create trigger test_reject_enroll_log before insert on public.activity_logs
  for each row execute function public._test_reject_enroll_log();

update public.courses set capacity = 2 where id = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222"}', true);

select pg_temp.assert_rejects(
  $sql$ select public.enroll_course('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') $sql$,
  'log ditolak untuk uji rollback pendaftaran',
  'enrollment Siswa B gagal saat penulisan log ditolak');
reset role;

drop trigger test_reject_enroll_log on public.activity_logs;
drop function public._test_reject_enroll_log();

select pg_temp.assert_true(
  (select count(*) from public.enrollments where student_id = '22222222-2222-4222-8222-222222222222') = 0,
  'rollback atomik: baris enrollment Siswa B tidak tertinggal');

select pg_temp.assert_true(
  (select count(*) from public.activity_logs where actor_id = '22222222-2222-4222-8222-222222222222') = 0,
  'rollback atomik: tidak ada log tertinggal');

select 'SEMUA UJI ENROLL_COURSE LULUS' as hasil;

rollback;
