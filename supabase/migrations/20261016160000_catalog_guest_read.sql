-- Perbaikan baca katalog untuk tamu.
-- Policy course_modules_select_published dan lessons_select_readable sebelumnya
-- memakai subquery langsung ke public.profiles untuk cabang admin. Peran anon
-- tidak punya hak pada tabel profiles, sehingga setiap kueri katalog dari tamu
-- ditolak dengan "permission denied for table profiles" dan aplikasi jatuh ke
-- data contoh. Cabang published dipisah ke policy sendiri agar tamu tidak lagi
-- menyentuh tabel profiles, sedangkan cabang pemilik draft dan admin tetap
-- hanya berlaku untuk pengguna yang masuk.

begin;

-- Module: course published dapat dibaca tamu dan pengguna masuk.
drop policy if exists course_modules_select_published on public.course_modules;
create policy course_modules_select_published
  on public.course_modules
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.courses
      where courses.id = course_modules.course_id and courses.status = 'published'
    )
  );

-- Module: pemilik draft dan admin, hanya untuk pengguna yang masuk.
drop policy if exists course_modules_select_mentor_admin on public.course_modules;
create policy course_modules_select_mentor_admin
  on public.course_modules
  for select
  to authenticated
  using (
    exists (
      select 1 from public.courses
      where courses.id = course_modules.course_id and courses.mentor_id = (select auth.uid())
    )
    or exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    )
  );

-- Materi: course published dapat dibaca tamu dan pengguna masuk.
drop policy if exists lessons_select_readable on public.lessons;
drop policy if exists lessons_select_published on public.lessons;
create policy lessons_select_published
  on public.lessons
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.courses
      where courses.id = lessons.course_id and courses.status = 'published'
    )
  );

-- Materi: pemilik draft dan admin, hanya untuk pengguna yang masuk.
drop policy if exists lessons_select_mentor_admin on public.lessons;
create policy lessons_select_mentor_admin
  on public.lessons
  for select
  to authenticated
  using (
    exists (
      select 1 from public.courses
      where courses.id = lessons.course_id and courses.mentor_id = (select auth.uid())
    )
    or exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.role = 'admin'
    )
  );

commit;
