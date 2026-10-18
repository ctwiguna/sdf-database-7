-- Test alur admin menerbitkan course dari nol: buat draf, pasang mentor, atur kapasitas,
-- tambah modul dan materi, lalu panggil RPC publish_course.
-- Melengkapi course_catalog.test.sql dengan rantai penuh yang dipakai layar admin.
-- Jalankan setelah seluruh migration diterapkan pada database TEST/disposable:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/admin_publish_flow.test.sql
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

-- Fixture pengguna mengikuti pola yang dipakai course_catalog.test.sql.
do $$
begin
  if to_regclass('auth.users') is not null then
    insert into auth.users (id, aud, role, email) values
      ('99999999-aaaa-4aaa-8aaa-999999999999', 'authenticated', 'authenticated', 'admin_flow@test.com'),
      ('99999999-bbbb-4bbb-8bbb-999999999999', 'authenticated', 'authenticated', 'mentor_flow@test.com')
    on conflict (id) do nothing;
  end if;
end $$;

insert into public.profiles (id, role, display_name) values
  ('99999999-aaaa-4aaa-8aaa-999999999999', 'admin', 'Admin Flow'),
  ('99999999-bbbb-4bbb-8bbb-999999999999', 'mentor', 'Mentor Flow')
on conflict (id) do update
  set role = excluded.role, display_name = excluded.display_name;

-- 1. Admin membuat draf course dengan mentor dan kapasitas (meniru formulir kelola course).
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"99999999-aaaa-4aaa-8aaa-999999999999"}', true);

insert into public.courses (id, title, description, category, capacity, mentor_id)
values (
  'c1111111-9999-4999-8999-c1111111c111',
  'Course Alur Admin',
  'Dibuat dari alur layar admin',
  'Energi',
  12,
  '99999999-bbbb-4bbb-8bbb-999999999999'
);

select pg_temp.assert_true(
  (select status = 'draft' and capacity = 12 and mentor_id = '99999999-bbbb-4bbb-8bbb-999999999999'
   from public.courses where id = 'c1111111-9999-4999-8999-c1111111c111'),
  'admin membuat draf course dengan mentor dan kapasitas yang benar'
);

-- 2. Penerbitan tanpa materi harus ditolak oleh RPC.
select pg_temp.assert_rejects(
  $sql$ select public.publish_course('c1111111-9999-4999-8999-c1111111c111') $sql$,
  'Cannot publish a course without lessons',
  'penerbitan ditolak saat course belum punya materi'
);

-- 3. Admin membaca daftar lengkap termasuk draf (kueri layar kelola course).
select pg_temp.assert_true(
  (select count(*) from public.courses) >= 1,
  'admin membaca daftar course termasuk draf'
);

-- 4. Tambah modul dan satu materi supaya course memenuhi syarat terbit.
insert into public.course_modules (id, course_id, title, position)
values (
  'c2222222-9999-4999-8999-c2222222c222',
  'c1111111-9999-4999-8999-c1111111c111',
  'Modul Perkenalan',
  1
);

insert into public.lessons (id, module_id, course_id, title, position, youtube_video_id)
values (
  'c3333333-9999-4999-8999-c3333333c333',
  'c2222222-9999-4999-8999-c2222222c222',
  'c1111111-9999-4999-8999-c1111111c111',
  'Materi Perkenalan',
  1,
  'abcdefghijk'
);

-- 5. Mentor tetap tidak boleh menerbitkan, hanya admin.
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"99999999-bbbb-4bbb-8bbb-999999999999"}', true);

select pg_temp.assert_rejects(
  $sql$ select public.publish_course('c1111111-9999-4999-8999-c1111111c111') $sql$,
  'Only admins can publish courses',
  'mentor tidak dapat menerbitkan course'
);

-- 6. Admin menerbitkan lewat RPC dan status berubah menjadi published.
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"99999999-aaaa-4aaa-8aaa-999999999999"}', true);

select public.publish_course('c1111111-9999-4999-8999-c1111111c111');

reset role;
select pg_temp.assert_true(
  (select status = 'published' from public.courses where id = 'c1111111-9999-4999-8999-c1111111c111'),
  'admin menerbitkan course lewat alur penuh sampai status published'
);

-- 7. Draf yang sudah terbit tidak bisa diterbitkan ulang.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"99999999-aaaa-4aaa-8aaa-999999999999"}', true);
select pg_temp.assert_rejects(
  $sql$ select public.publish_course('c1111111-9999-4999-8999-c1111111c111') $sql$,
  'Course not found or not in draft status',
  'course yang sudah terbit tidak dapat diterbitkan ulang'
);
reset role;

select 'SEMUA UJI ALUR TERBIT ADMIN LULUS' as hasil;
rollback;
