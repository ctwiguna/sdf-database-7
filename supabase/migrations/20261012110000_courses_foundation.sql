-- ==============================================================================
-- 20261012110000_courses_foundation.sql
-- Skema courses, course_modules, dan lessons (PRD Bagian 5.1)
-- ==============================================================================

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  category text,
  capacity int not null check (capacity > 0),
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_status_idx on public.courses (status);
create index if not exists courses_mentor_id_idx on public.courses (mentor_id);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  position int not null check (position > 0),
  constraint course_modules_course_position_key unique (course_id, position),
  constraint course_modules_id_course_key unique (id, course_id)
);

create index if not exists course_modules_course_id_idx on public.course_modules (course_id);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null,
  course_id uuid not null,
  title text not null,
  position int not null check (position > 0),
  youtube_video_id text not null check (length(youtube_video_id) = 11),
  constraint lessons_module_position_key unique (module_id, position),
  constraint lessons_id_course_key unique (id, course_id),
  constraint lessons_module_course_fkey foreign key (module_id, course_id)
    references public.course_modules(id, course_id) on delete cascade
);

create index if not exists lessons_course_id_idx on public.lessons (course_id);
create index if not exists lessons_module_id_idx on public.lessons (module_id);

-- RLS Courses
alter table public.courses enable row level security;

drop policy if exists courses_select_published on public.courses;
create policy courses_select_published
  on public.courses
  for select
  to authenticated, anon
  using (status = 'published');

drop policy if exists courses_select_mentor_admin on public.courses;
create policy courses_select_mentor_admin
  on public.courses
  for select
  to authenticated
  using (
    mentor_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- RLS Modules & Lessons
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;

drop policy if exists course_modules_select_published on public.course_modules;
create policy course_modules_select_published
  on public.course_modules
  for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.courses
      where courses.id = course_modules.course_id and courses.status = 'published'
    ) or
    exists (
      select 1 from public.courses
      where courses.id = course_modules.course_id and courses.mentor_id = auth.uid()
    ) or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

drop policy if exists lessons_select_readable on public.lessons;
create policy lessons_select_readable
  on public.lessons
  for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.courses
      where courses.id = lessons.course_id and courses.status = 'published'
    ) or
    exists (
      select 1 from public.courses
      where courses.id = lessons.course_id and courses.mentor_id = auth.uid()
    ) or
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

grant select on table public.courses to anon, authenticated;
grant select on table public.course_modules to anon, authenticated;
grant select on table public.lessons to anon, authenticated;
