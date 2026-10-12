-- ==============================================================================
-- 20261012111500_enrollments.sql
-- Bagian: BRILLIANT (brilliantgibrann16)
-- Tabel enrollments dengan composite unique key, foreign key, dan RLS
-- Prasyarat: profiles dan courses
-- ==============================================================================

do $$
begin
  if to_regclass('public.profiles') is null
     or to_regclass('public.courses') is null then
    raise exception 'prasyarat belum ada: terapkan migration profiles dan courses terlebih dahulu';
  end if;
end
$$;

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete restrict,
  student_id uuid not null references public.profiles (id) on delete restrict,
  enrolled_at timestamptz not null default now(),
  constraint enrollments_course_student_key unique (course_id, student_id),
  constraint enrollments_id_course_key unique (id, course_id)
);

comment on table public.enrollments is
  'Pendaftaran siswa pada course. Satu siswa satu baris per course. id dan course_id dijadikan unique komposit sebagai target FK lesson_progress.';

create index if not exists enrollments_student_id_idx on public.enrollments (student_id);
create index if not exists enrollments_course_id_idx on public.enrollments (course_id);

-- Row Level Security (RLS)
alter table public.enrollments enable row level security;

-- Helper function pembacaan enrollments
create or replace function public.can_read_enrollment(p_student_id uuid, p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
           select 1 from public.profiles p
           where p.id = auth.uid() and p.role = 'admin'
         )
      or (p_student_id = auth.uid())
      or exists (
           select 1 from public.courses c
           where c.id = p_course_id and c.mentor_id = auth.uid()
         );
$$;

revoke execute on function public.can_read_enrollment(uuid, uuid) from public, anon;
grant execute on function public.can_read_enrollment(uuid, uuid) to authenticated;

drop policy if exists enrollments_select_readable on public.enrollments;
create policy enrollments_select_readable
  on public.enrollments
  for select
  to authenticated
  using (public.can_read_enrollment(student_id, course_id));

-- Direct write dicabut dari authenticated dan anon; penulisan hanya lewat RPC enroll_course
revoke all on table public.enrollments from anon, authenticated;
grant select on table public.enrollments to authenticated;
