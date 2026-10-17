-- Test RPC admin_course_report: hak akses, hitungan agregasi, course tanpa peserta,
-- dan course tanpa lesson.
-- Jalankan setelah seluruh migration diterapkan pada database TEST/disposable:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/admin_course_report.test.sql
-- Seluruh fixture berada dalam transaksi dan di-ROLLBACK pada akhir skrip.
-- Catatan: gunakan database test, bukan production.

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

create or replace function pg_temp.assert_rejects(
  p_statement text,
  p_expected text,
  p_message text
)
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

-- Fixture pengguna mengikuti pola yang dipakai di enroll_course.test.sql.
do $$
begin
  if to_regclass('auth.users') is not null then
    insert into auth.users (id, aud, role, email) values
      ('9aaaaaaa-0001-4001-8001-aaaaaaaaaaa1', 'authenticated', 'authenticated', 'admin_report@test.com'),
      ('9bbbbbbb-0002-4002-8002-bbbbbbbbbbb2', 'authenticated', 'authenticated', 'mentor_report_a@test.com'),
      ('9ccccccc-0003-4003-8003-ccccccccccc3', 'authenticated', 'authenticated', 'mentor_report_b@test.com'),
      ('9ddddddd-0004-4004-8004-ddddddddddd4', 'authenticated', 'authenticated', 'siswa_report_a@test.com'),
      ('9eeeeeee-0005-4005-8005-eeeeeeeeeee5', 'authenticated', 'authenticated', 'siswa_report_b@test.com')
    on conflict (id) do nothing;
  end if;
end $$;

insert into public.profiles (id, role, display_name) values
  ('9aaaaaaa-0001-4001-8001-aaaaaaaaaaa1', 'admin', 'Admin Report'),
  ('9bbbbbbb-0002-4002-8002-bbbbbbbbbbb2', 'mentor', 'Mentor Report A'),
  ('9ccccccc-0003-4003-8003-ccccccccccc3', 'mentor', 'Mentor Report B'),
  ('9ddddddd-0004-4004-8004-ddddddddddd4', 'student', 'Siswa Report A'),
  ('9eeeeeee-0005-4005-8005-eeeeeeeeeee5', 'student', 'Siswa Report B')
on conflict (id) do update
set role = excluded.role, display_name = excluded.display_name;

-- Empat course uji: penuh, tanpa peserta, tanpa lesson, dan tanpa mentor.
insert into public.courses (id, mentor_id, title, description, category, capacity, status) values
  ('9a000001-1111-4111-8111-aaaaaaaaaaa1', '9bbbbbbb-0002-4002-8002-bbbbbbbbbbb2', 'Admin Report Full', 'Punya peserta dan lesson', 'Test', 10, 'published'),
  ('9a000002-2222-4222-8222-aaaaaaaaaaa2', '9ccccccc-0003-4003-8003-ccccccccccc3', 'Admin Report No Participants', 'Punya lesson tanpa peserta', 'Test', 10, 'draft'),
  ('9a000003-3333-4333-8333-aaaaaaaaaaa3', '9bbbbbbb-0002-4002-8002-bbbbbbbbbbb2', 'Admin Report No Lessons', 'Punya peserta tanpa lesson', 'Test', 10, 'published'),
  ('9a000004-4444-4444-8444-aaaaaaaaaaa4', null, 'Admin Report No Mentor', 'Draft tanpa mentor', 'Test', 10, 'draft')
on conflict (id) do nothing;

insert into public.course_modules (id, course_id, title, position) values
  ('9b000001-1111-4111-8111-aaaaaaaaaaa1', '9a000001-1111-4111-8111-aaaaaaaaaaa1', 'Module Full', 1),
  ('9b000002-2222-4222-8222-aaaaaaaaaaa2', '9a000002-2222-4222-8222-aaaaaaaaaaa2', 'Module No Participants', 1)
on conflict (id) do nothing;

insert into public.lessons (id, module_id, course_id, title, position, youtube_video_id) values
  ('9d000001-1111-4111-8111-aaaaaaaaaaa1', '9b000001-1111-4111-8111-aaaaaaaaaaa1', '9a000001-1111-4111-8111-aaaaaaaaaaa1', 'Lesson Full 1', 1, 'benchFull01'),
  ('9d000002-2222-4222-8222-aaaaaaaaaaa2', '9b000001-1111-4111-8111-aaaaaaaaaaa1', '9a000001-1111-4111-8111-aaaaaaaaaaa1', 'Lesson Full 2', 2, 'benchFull02'),
  ('9d000003-3333-4333-8333-aaaaaaaaaaa3', '9b000001-1111-4111-8111-aaaaaaaaaaa1', '9a000001-1111-4111-8111-aaaaaaaaaaa1', 'Lesson Full 3', 3, 'benchFull03'),
  ('9d000004-4444-4444-8444-aaaaaaaaaaa4', '9b000002-2222-4222-8222-aaaaaaaaaaa2', '9a000002-2222-4222-8222-aaaaaaaaaaa2', 'Lesson No Part 1', 1, 'benchNone01'),
  ('9d000005-5555-4555-8555-aaaaaaaaaaa5', '9b000002-2222-4222-8222-aaaaaaaaaaa2', '9a000002-2222-4222-8222-aaaaaaaaaaa2', 'Lesson No Part 2', 2, 'benchNone02')
on conflict (id) do nothing;

insert into public.enrollments (id, course_id, student_id) values
  ('9e000001-1111-4111-8111-aaaaaaaaaaa1', '9a000001-1111-4111-8111-aaaaaaaaaaa1', '9ddddddd-0004-4004-8004-ddddddddddd4'),
  ('9e000002-2222-4222-8222-aaaaaaaaaaa2', '9a000001-1111-4111-8111-aaaaaaaaaaa1', '9eeeeeee-0005-4005-8005-eeeeeeeeeee5'),
  ('9e000003-3333-4333-8333-aaaaaaaaaaa3', '9a000003-3333-4333-8333-aaaaaaaaaaa3', '9ddddddd-0004-4004-8004-ddddddddddd4')
on conflict (id) do nothing;

-- Peserta 1 menyelesaikan seluruh 3 lesson, peserta 2 baru 1 lesson.
insert into public.lesson_progress (enrollment_id, lesson_id, course_id, completed_at) values
  ('9e000001-1111-4111-8111-aaaaaaaaaaa1', '9d000001-1111-4111-8111-aaaaaaaaaaa1', '9a000001-1111-4111-8111-aaaaaaaaaaa1', now() - interval '3 days'),
  ('9e000001-1111-4111-8111-aaaaaaaaaaa1', '9d000002-2222-4222-8222-aaaaaaaaaaa2', '9a000001-1111-4111-8111-aaaaaaaaaaa1', now() - interval '2 days'),
  ('9e000001-1111-4111-8111-aaaaaaaaaaa1', '9d000003-3333-4333-8333-aaaaaaaaaaa3', '9a000001-1111-4111-8111-aaaaaaaaaaa1', now() - interval '1 day'),
  ('9e000002-2222-4222-8222-aaaaaaaaaaa2', '9d000001-1111-4111-8111-aaaaaaaaaaa1', '9a000001-1111-4111-8111-aaaaaaaaaaa1', now() - interval '1 day')
on conflict (enrollment_id, lesson_id) do nothing;

-- 0. Tanpa sesi, RPC harus menolak sebelum menyentuh data.
set local role authenticated;
select pg_temp.assert_rejects(
  $sql$ select count(*) from public.admin_course_report() $sql$,
  'not_authenticated',
  'RPC laporan admin menolak pemanggil tanpa sesi'
);

-- 1. Admin mendapat baris untuk seluruh course fixture.
select set_config('request.jwt.claims', '{"sub":"9aaaaaaa-0001-4001-8001-aaaaaaaaaaa1"}', true);

select pg_temp.assert_true(
  (select count(*) = 4
   from public.admin_course_report() r
   where r.course_id in (
     '9a000001-1111-4111-8111-aaaaaaaaaaa1',
     '9a000002-2222-4222-8222-aaaaaaaaaaa2',
     '9a000003-3333-4333-8333-aaaaaaaaaaa3',
     '9a000004-4444-4444-8444-aaaaaaaaaaa4'
   )),
  'admin melihat keempat course fixture pada laporan'
);

select pg_temp.assert_true(
  (select r.total_participants = 0 and r.total_lessons = 0
   from public.admin_course_report() r
   where r.course_id = '9a000004-4444-4444-8444-aaaaaaaaaaa4'),
  'course draft tanpa mentor dan tanpa lesson tetap muncul dengan nilai nol'
);

-- 2. Hitungan agregasi course penuh. Dua peserta, tiga lesson, empat lesson selesai.
select pg_temp.assert_true(
  (select r.course_title = 'Admin Report Full'
          and r.mentor_name = 'Mentor Report A'
          and r.status = 'published'
          and r.total_lessons = 3
          and r.total_participants = 2
          and r.average_progress = 66.7
          and r.completed_participants = 1
   from public.admin_course_report() r
   where r.course_id = '9a000001-1111-4111-8111-aaaaaaaaaaa1'),
  'hitungan course penuh sesuai: 3 lesson, 2 peserta, rerata 66.7, 1 peserta selesai'
);

-- Lesson milik course lain tidak ikut terhitung. Course tanpa peserta tetap punya
-- jumlah lesson sendiri, bukan jumlah lesson seluruh tabel.
select pg_temp.assert_true(
  (select r.total_lessons = 2
   from public.admin_course_report() r
   where r.course_id = '9a000002-2222-4222-8222-aaaaaaaaaaa2'),
  'lesson course lain tidak ikut terhitung pada course tanpa peserta'
);

-- 3. Course tanpa peserta menghasilkan nol, bukan error.
select pg_temp.assert_true(
  (select r.total_lessons = 2
          and r.total_participants = 0
          and r.average_progress = 0
          and r.completed_participants = 0
   from public.admin_course_report() r
   where r.course_id = '9a000002-2222-4222-8222-aaaaaaaaaaa2'),
  'course tanpa peserta melaporkan nol tanpa error bagi nol'
);

-- 4. Course tanpa lesson menghasilkan rerata nol meski ada peserta.
select pg_temp.assert_true(
  (select r.total_lessons = 0
          and r.total_participants = 1
          and r.average_progress = 0
          and r.completed_participants = 0
   from public.admin_course_report() r
   where r.course_id = '9a000003-3333-4333-8333-aaaaaaaaaaa3'),
  'course tanpa lesson melaporkan rerata nol tanpa error bagi nol'
);

-- 5. Filter course tunggal.
select pg_temp.assert_true(
  (select count(*) = 1
   from public.admin_course_report('9a000001-1111-4111-8111-aaaaaaaaaaa1') r),
  'filter satu course mengembalikan tepat satu baris'
);

select pg_temp.assert_true(
  (select r.course_id = '9a000001-1111-4111-8111-aaaaaaaaaaa1'
   from public.admin_course_report('9a000001-1111-4111-8111-aaaaaaaaaaa1') r),
  'filter satu course mengembalikan course yang diminta'
);

-- 6. Mentor ditolak meski course itu miliknya.
select set_config('request.jwt.claims', '{"sub":"9bbbbbbb-0002-4002-8002-bbbbbbbbbbb2"}', true);
select pg_temp.assert_rejects(
  $sql$ select count(*) from public.admin_course_report() $sql$,
  'not_admin',
  'mentor ditolak dari laporan admin'
);

-- 7. Siswa ditolak.
select set_config('request.jwt.claims', '{"sub":"9ddddddd-0004-4004-8004-ddddddddddd4"}', true);
select pg_temp.assert_rejects(
  $sql$ select count(*) from public.admin_course_report() $sql$,
  'not_admin',
  'siswa ditolak dari laporan admin'
);

reset role;

select 'SEMUA UJI ADMIN COURSE REPORT LULUS' as hasil;
rollback;
