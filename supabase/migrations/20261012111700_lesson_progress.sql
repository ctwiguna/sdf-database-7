-- lesson_progress menyimpan progres belajar siswa per lesson.
-- Satu baris berarti satu lesson sudah ditandai selesai oleh siswa.
-- Tidak ada persentase atau jumlah selesai yang disimpan; semuanya dihitung saat dibaca.
-- Prasyarat: migration profiles, courses, course_modules, lessons, enrollments.

do $$
begin
  if to_regclass('public.enrollments') is null
     or to_regclass('public.lessons') is null then
    raise exception 'prasyarat belum ada: terapkan migration profiles, courses, course_modules, lessons, enrollments dulu';
  end if;
end
$$;

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null,
  lesson_id uuid not null,
  course_id uuid not null,
  completed_at timestamptz not null default now(),
  constraint lesson_progress_enrollment_lesson_key unique (enrollment_id, lesson_id),
  constraint lesson_progress_id_enrollment_key unique (id, enrollment_id),
  constraint lesson_progress_enrollment_course_fkey
    foreign key (enrollment_id, course_id)
    references public.enrollments (id, course_id) on delete restrict,
  constraint lesson_progress_lesson_course_fkey
    foreign key (lesson_id, course_id)
    references public.lessons (id, course_id) on delete restrict
);

comment on table public.lesson_progress is
  'Progres siswa per lesson. Satu baris berarti lesson selesai. course_id sengaja diduplikasi agar foreign key mencegah relasi lintas course.';

-- Index pendukung query progres terbaru per course (bukti performa IK301).
create index if not exists lesson_progress_course_completed_at_idx
  on public.lesson_progress (course_id, completed_at desc);

-- RLS aktif. Penulisan langsung dicabut; tulis hanya lewat RPC complete_lesson.
alter table public.lesson_progress enable row level security;

-- Helper pembacaan: admin, siswa pemilik enrollment, atau mentor course terkait.
-- SECURITY DEFINER agar aman dari rekursi policy tabel lain.
create or replace function public.can_read_lesson_progress(p_enrollment_id uuid, p_course_id uuid)
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
      or exists (
           select 1 from public.enrollments e
           where e.id = p_enrollment_id and e.student_id = auth.uid()
         )
      or exists (
           select 1 from public.courses c
           where c.id = p_course_id and c.mentor_id = auth.uid()
         );
$$;

revoke execute on function public.can_read_lesson_progress(uuid, uuid) from public, anon;
grant execute on function public.can_read_lesson_progress(uuid, uuid) to authenticated;

drop policy if exists lesson_progress_select_readable on public.lesson_progress;
create policy lesson_progress_select_readable
  on public.lesson_progress
  for select
  to authenticated
  using (public.can_read_lesson_progress(enrollment_id, course_id));

revoke all on table public.lesson_progress from anon, authenticated;
grant select on table public.lesson_progress to authenticated;
