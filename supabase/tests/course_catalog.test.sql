-- Test RLS katalog course, hak akses mentor, dan RPC publish_course.
-- Jalankan setelah seluruh migration diterapkan pada database TEST/disposable:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/course_catalog.test.sql
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
      ('33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'mentor_a_catalog@test.com'),
      ('55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'mentor_b_catalog@test.com'),
      ('44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'admin_catalog@test.com')
    on conflict (id) do nothing;
  end if;
end $$;

insert into public.profiles (id, role, display_name) values
  ('33333333-3333-4333-8333-333333333333', 'mentor', 'Mentor Catalog A'),
  ('55555555-5555-4555-8555-555555555555', 'mentor', 'Mentor Catalog B'),
  ('44444444-4444-4444-8444-444444444444', 'admin', 'Admin Catalog')
on conflict (id) do update
set role = excluded.role, display_name = excluded.display_name;

-- Course fixture terpisah dari fixture enroll_course.test.sql.
insert into public.courses (id, mentor_id, title, description, category, capacity, status) values
  ('caaaaaaa-1111-4111-8111-aaaaaaaaaaa1', '33333333-3333-4333-8333-333333333333', 'Catalog A Draft', 'Draft milik mentor A', 'Test', 10, 'draft'),
  ('cbbbbbbb-2222-4222-8222-bbbbbbbbbbb2', '55555555-5555-4555-8555-555555555555', 'Catalog B Draft', 'Draft milik mentor B', 'Test', 10, 'draft'),
  ('cccccccc-3333-4333-8333-ccccccccccc3', '33333333-3333-4333-8333-333333333333', 'Catalog Published', 'Course published fixture', 'Test', 10, 'published'),
  ('cddddddd-4444-4444-8444-ddddddddddd4', '33333333-3333-4333-8333-333333333333', 'Catalog Ready To Publish', 'Draft untuk RPC admin', 'Test', 10, 'draft'),
  ('ceeeeeee-5555-4555-8555-eeeeeeeeeee5', '33333333-3333-4333-8333-333333333333', 'Catalog Empty Draft', 'Draft tanpa lesson', 'Test', 10, 'draft')
on conflict (id) do nothing;

insert into public.course_modules (id, course_id, title, position) values
  ('daaaaaaa-1111-4111-8111-aaaaaaaaaaa1', 'caaaaaaa-1111-4111-8111-aaaaaaaaaaa1', 'Module A', 1),
  ('dbbbbbbb-2222-4222-8222-bbbbbbbbbbb2', 'cbbbbbbb-2222-4222-8222-bbbbbbbbbbb2', 'Module B', 1),
  ('dccccccc-3333-4333-8333-ccccccccccc3', 'cccccccc-3333-4333-8333-ccccccccccc3', 'Module Published', 1),
  ('dddddddd-4444-4444-8444-ddddddddddd4', 'cddddddd-4444-4444-8444-ddddddddddd4', 'Module Publish', 1)
on conflict (id) do nothing;

insert into public.lessons (id, module_id, course_id, title, position, youtube_video_id) values
  ('eaaaaaaa-1111-4111-8111-aaaaaaaaaaa1', 'daaaaaaa-1111-4111-8111-aaaaaaaaaaa1', 'caaaaaaa-1111-4111-8111-aaaaaaaaaaa1', 'Lesson A', 1, 'W2vMc3ENiz8'),
  ('ebbbbbbb-2222-4222-8222-bbbbbbbbbbb2', 'dbbbbbbb-2222-4222-8222-bbbbbbbbbbb2', 'cbbbbbbb-2222-4222-8222-bbbbbbbbbbb2', 'Lesson B', 1, '8jxRn-T_LCs'),
  ('eccccccc-3333-4333-8333-ccccccccccc3', 'dccccccc-3333-4333-8333-ccccccccccc3', 'cccccccc-3333-4333-8333-ccccccccccc3', 'Lesson Published', 1, 'PnX1JSVPaTE'),
  ('eddddddd-4444-4444-8444-ddddddddddd4', 'dddddddd-4444-4444-8444-ddddddddddd4', 'cddddddd-4444-4444-8444-ddddddddddd4', 'Lesson Publish', 1, 'IlAOzS9xnik')
on conflict (id) do nothing;

-- 1. Mentor A dapat mengubah module dan lesson pada draft miliknya.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333"}', true);

update public.course_modules
set title = 'Module A edited by owner'
where id = 'daaaaaaa-1111-4111-8111-aaaaaaaaaaa1';

update public.lessons
set title = 'Lesson A edited by owner'
where id = 'eaaaaaaa-1111-4111-8111-aaaaaaaaaaa1';

reset role;
select pg_temp.assert_true(
  (select title = 'Module A edited by owner' from public.course_modules where id = 'daaaaaaa-1111-4111-8111-aaaaaaaaaaa1'),
  'mentor dapat mengubah module draft miliknya'
);
select pg_temp.assert_true(
  (select title = 'Lesson A edited by owner' from public.lessons where id = 'eaaaaaaa-1111-4111-8111-aaaaaaaaaaa1'),
  'mentor dapat mengubah lesson draft miliknya'
);

-- 2. Mentor A tidak dapat mengubah draft milik Mentor B (RLS menargetkan 0 baris).
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333"}', true);

update public.course_modules
set title = 'UNAUTHORIZED MODULE CHANGE'
where id = 'dbbbbbbb-2222-4222-8222-bbbbbbbbbbb2';

update public.lessons
set title = 'UNAUTHORIZED LESSON CHANGE'
where id = 'ebbbbbbb-2222-4222-8222-bbbbbbbbbbb2';

reset role;
select pg_temp.assert_true(
  (select title = 'Module B' from public.course_modules where id = 'dbbbbbbb-2222-4222-8222-bbbbbbbbbbb2'),
  'mentor tidak dapat mengubah module milik mentor lain'
);
select pg_temp.assert_true(
  (select title = 'Lesson B' from public.lessons where id = 'ebbbbbbb-2222-4222-8222-bbbbbbbbbbb2'),
  'mentor tidak dapat mengubah lesson milik mentor lain'
);

-- 3. Mentor tidak dapat mengubah konten course published.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333"}', true);

update public.course_modules
set title = 'UNAUTHORIZED PUBLISHED MODULE CHANGE'
where id = 'dccccccc-3333-4333-8333-ccccccccccc3';

update public.lessons
set title = 'UNAUTHORIZED PUBLISHED LESSON CHANGE'
where id = 'eccccccc-3333-4333-8333-ccccccccccc3';

reset role;
select pg_temp.assert_true(
  (select title = 'Module Published' from public.course_modules where id = 'dccccccc-3333-4333-8333-ccccccccccc3'),
  'mentor tidak dapat mengubah module course published'
);
select pg_temp.assert_true(
  (select title = 'Lesson Published' from public.lessons where id = 'eccccccc-3333-4333-8333-ccccccccccc3'),
  'mentor tidak dapat mengubah lesson course published'
);

-- 4. Hanya admin dapat publish; course harus memiliki minimal satu lesson.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333"}', true);

select pg_temp.assert_rejects(
  $sql$ select public.publish_course('cddddddd-4444-4444-8444-ddddddddddd4') $sql$,
  'Only admins can publish courses',
  'mentor tidak dapat memanggil RPC publish_course untuk memublikasikan course'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444"}', true);

select public.publish_course('cddddddd-4444-4444-8444-ddddddddddd4');

reset role;
select pg_temp.assert_true(
  (select status = 'published' from public.courses where id = 'cddddddd-4444-4444-8444-ddddddddddd4'),
  'admin berhasil memublikasikan course yang memiliki lesson'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444"}', true);
select pg_temp.assert_rejects(
  $sql$ select public.publish_course('ceeeeeee-5555-4555-8555-eeeeeeeeeee5') $sql$,
  'Cannot publish a course without lessons',
  'admin tidak dapat memublikasikan course tanpa lesson'
);
reset role;

select 'SEMUA UJI COURSE CATALOG LULUS' as hasil;
rollback;
