-- ==============================================================================
-- 20261012111720_activity_logs.sql
-- Bagian: BRILLIANT (brilliantgibrann16)
-- Tabel activity_logs untuk audit trail atomik pendaftaran dan progres
-- Prasyarat: profiles, enrollments, lesson_progress
-- ==============================================================================

do $$
begin
  if to_regclass('public.profiles') is null
     or to_regclass('public.enrollments') is null
     or to_regclass('public.lesson_progress') is null then
    raise exception 'prasyarat belum ada: terapkan migration profiles, enrollments, dan lesson_progress terlebih dahulu';
  end if;
end
$$;

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id) on delete restrict,
  enrollment_id uuid not null references public.enrollments (id) on delete restrict,
  lesson_progress_id uuid,
  action text not null check (action in ('enrolled', 'lesson_completed')),
  created_at timestamptz not null default now(),
  constraint activity_logs_action_progress_check check (
    (action = 'enrolled' and lesson_progress_id is null) or
    (action = 'lesson_completed' and lesson_progress_id is not null)
  ),
  constraint activity_logs_progress_fk foreign key (lesson_progress_id, enrollment_id)
    references public.lesson_progress (id, enrollment_id) on delete restrict
);

comment on table public.activity_logs is
  'Audit trail operasi atomik. action enrolled mencatat pendaftaran, action lesson_completed mencatat progres per lesson.';

create unique index if not exists activity_logs_enrolled_uniq_idx
  on public.activity_logs (enrollment_id)
  where action = 'enrolled';

create unique index if not exists activity_logs_lesson_completed_uniq_idx
  on public.activity_logs (lesson_progress_id)
  where action = 'lesson_completed';

create index if not exists activity_logs_actor_created_idx
  on public.activity_logs (actor_id, created_at desc);

-- Row Level Security (RLS)
alter table public.activity_logs enable row level security;

drop policy if exists activity_logs_select_readable on public.activity_logs;
create policy activity_logs_select_readable
  on public.activity_logs
  for select
  to authenticated
  using (
    actor_id = auth.uid() or
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Direct write dicabut dari anon dan authenticated; tulis hanya melalui RPC transaksi
revoke all on table public.activity_logs from anon, authenticated;
grant select on table public.activity_logs to authenticated;
