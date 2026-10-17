-- Benchmark index lesson_progress (course_id, completed_at desc).
-- Bukti performa IK301: query yang sama dijalankan lima kali dengan index dan lima
-- kali tanpa index, lalu diambil nilai tengahnya.
--
-- Cara pakai pada database lokal:
--   docker exec -i supabase_db_sdf-database-7 psql -U postgres -d postgres \
--     -v ON_ERROR_STOP=1 -f /dev/stdin < scripts/benchmark_lesson_progress_index.sql
--
-- Cara pakai pada database lain:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/benchmark_lesson_progress_index.sql
--
-- Seluruh data sintetis dan perubahan schema berada dalam satu transaksi dan
-- di-ROLLBACK pada akhir skrip, jadi database tidak ikut berubah.
-- Planner tidak dipaksa dan tidak diarahkan. Perbandingan memakai konfigurasi planner
-- bawaan supaya hasilnya menggambarkan pilihan planner yang sebenarnya.

\set ON_ERROR_STOP on
begin;

do $$
begin
  if to_regclass('public.lesson_progress') is null then
    raise exception 'prasyarat belum ada: terapkan seluruh migration dulu';
  end if;
end
$$;

-- 1. Data sintetis: 50 course, 50 siswa, 4 lesson per course.
--    Total 2.500 pendaftaran dikali 4 lesson menghasilkan 10.000 baris progres,
--    sehingga satu course hanya mencakup 2 persen tabel dan index benar benar berfungsi.
create temp table bench_course as
select i as n, ('9a000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid as id
from generate_series(1, 50) as i;

create temp table bench_student as
select i as n, ('9f000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid as id
from generate_series(1, 50) as i;

create temp table bench_module as
select c.n as n,
       c.id as course_id,
       ('9b000000-0000-4000-8000-' || lpad(c.n::text, 12, '0'))::uuid as id
from bench_course c;

create temp table bench_lesson as
select l.n as n,
       m.course_id as course_id,
       m.id as module_id,
       ('9d000000-0000-4000-8000-' || lpad(l.n::text, 12, '0'))::uuid as id,
       ((l.n - 1) % 4) + 1 as position
from generate_series(1, 200) as l(n)
join bench_module m on m.n = ((l.n - 1) / 4) + 1;

create temp table bench_enrollment as
select e.n as n,
       c.id as course_id,
       s.id as student_id,
       ('9e000000-0000-4000-8000-' || lpad(e.n::text, 12, '0'))::uuid as id
from generate_series(1, 2500) as e(n)
join bench_course c on c.n = ((e.n - 1) / 50) + 1
join bench_student s on s.n = ((e.n - 1) % 50) + 1;

-- auth.users memicu trigger handle_new_user yang membuat baris profiles.
do $$
begin
  if to_regclass('auth.users') is not null then
    insert into auth.users (id, aud, role, email)
    select s.id, 'authenticated', 'authenticated', 'bench-' || s.id || '@test.local'
    from bench_student s
    on conflict (id) do nothing;
  else
    insert into public.profiles (id, role, display_name)
    select s.id, 'student', 'Bench ' || s.id
    from bench_student s
    on conflict (id) do nothing;
  end if;
end
$$;

insert into public.courses (id, mentor_id, title, description, category, capacity, status)
select c.id, null, 'Bench Course ' || lpad(c.n::text, 3, '0'), 'Data sintetis benchmark index', 'Bench', 100, 'draft'
from bench_course c
on conflict (id) do nothing;

insert into public.course_modules (id, course_id, title, position)
select m.id, m.course_id, 'Bench Module', 1
from bench_module m
on conflict (id) do nothing;

insert into public.lessons (id, module_id, course_id, title, position, youtube_video_id)
select l.id, l.module_id, l.course_id, 'Bench Lesson ' || l.position, l.position,
       'bench' || lpad(l.n::text, 6, '0')
from bench_lesson l
on conflict (id) do nothing;

insert into public.enrollments (id, course_id, student_id)
select e.id, e.course_id, e.student_id
from bench_enrollment e
on conflict (id) do nothing;

insert into public.lesson_progress (enrollment_id, lesson_id, course_id, completed_at)
select e.id, l.id, l.course_id,
       now() - (random() * interval '365 days')
from bench_enrollment e
join bench_lesson l on l.course_id = e.course_id
on conflict (enrollment_id, lesson_id) do nothing;

-- Statistik planner harus diperbarui dulu, kalau tidak planner menebak dari tabel kosong.
analyze public.lesson_progress;
analyze public.enrollments;
analyze public.lessons;

select count(*) as baris_progres,
       (select count(*) from bench_course) as jumlah_course,
       (select count(*) from bench_enrollment) as jumlah_pendaftaran
from public.lesson_progress;

-- 2. Wadah hasil.
create temp table bench_hasil (
  fase text not null,
  run int not null,
  waktu_ms numeric not null,
  simpul_plan text,
  shared_hit bigint,
  shared_read bigint
);

create or replace function pg_temp.bench_lima_kali(p_fase text, p_course_id uuid)
returns void language plpgsql as $$
declare
  v_query text;
  v_plan json;
  i int;
begin
  v_query := format(
    'select lp.id, lp.lesson_id, lp.completed_at from public.lesson_progress lp where lp.course_id = %L order by lp.completed_at desc limit 50',
    p_course_id
  );

  for i in 1..5 loop
    execute 'explain (analyze, buffers, format json) ' || v_query into v_plan;
    insert into bench_hasil (fase, run, waktu_ms, simpul_plan, shared_hit, shared_read)
    values (
      p_fase,
      i,
      (v_plan->0->>'Execution Time')::numeric,
      coalesce(
        v_plan->0->'Plan'->'Plans'->0->>'Node Type',
        v_plan->0->'Plan'->>'Node Type'
      ),
      coalesce((v_plan->0->'Plan'->>'Shared Hit Blocks')::bigint, 0),
      coalesce((v_plan->0->'Plan'->>'Shared Read Blocks')::bigint, 0)
    );
  end loop;
end;
$$;

-- 3. Fase pertama: index aktif.
\echo '=== FASE 1: DENGAN INDEX lesson_progress_course_completed_at_idx ==='
select pg_temp.bench_lima_kali('dengan index', (select id from bench_course where n = 1));
explain (analyze, buffers)
select lp.id, lp.lesson_id, lp.completed_at
from public.lesson_progress lp
where lp.course_id = (select id from bench_course where n = 1)
order by lp.completed_at desc
limit 50;

-- 4. Fase kedua: index dihapus pada transaksi yang sama, lalu dijalankan ulang.
\echo '=== FASE 2: TANPA INDEX ==='
drop index public.lesson_progress_course_completed_at_idx;

select pg_temp.bench_lima_kali('tanpa index', (select id from bench_course where n = 1));
explain (analyze, buffers)
select lp.id, lp.lesson_id, lp.completed_at
from public.lesson_progress lp
where lp.course_id = (select id from bench_course where n = 1)
order by lp.completed_at desc
limit 50;

-- 5. Ringkasan nilai tengah.
\echo '=== RINGKASAN NILAI TENGAH DARI LIMA EKSEKUSI ==='
select fase as fase,
       min(waktu_ms) as min_ms,
       percentile_cont(0.5) within group (order by waktu_ms) as median_ms,
       max(waktu_ms) as max_ms,
       max(simpul_plan) as simpul_plan,
       max(shared_hit) as shared_hit,
       max(shared_read) as shared_read
from bench_hasil
group by fase
order by median_ms desc;

select run, fase, round(waktu_ms, 3) as waktu_ms, simpul_plan
from bench_hasil
order by fase, run;

rollback;
