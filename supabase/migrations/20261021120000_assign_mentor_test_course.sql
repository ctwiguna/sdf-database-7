-- ==============================================================================
-- Course draft untuk menguji alur mentor
--
-- Masalah: akun uji uji.mentor@futureskill.id berperan mentor, tetapi tidak
-- ditugaskan ke course mana pun. Menu "Kelola" pada aplikasi karena itu
-- menampilkan "Belum Ada Course", sehingga kurasi silabus dan pemantauan
-- peserta tidak dapat didemonstrasikan.
--
-- Mengapa bukan sekadar memindahkan mentor_id salah satu course published:
--   1. trigger protect_published_course menolak setiap UPDATE pada course
--      berstatus published, jadi perubahan itu memerlukan disable trigger.
--   2. Memindahkan mentor_id akan menggeser mentor asli yang sudah tercatat
--      pada course tersebut, sehingga data katalog demo ikut berubah.
--
-- Karena itu migrasi ini menambahkan satu course DRAFT baru yang hanya dipakai
-- untuk pengujian alur mentor. Katalog published tidak tersentuh, laporan admin
-- tetap memakai empat course yang sudah ada.
--
-- Prasyarat: migrasi profiles, courses, course_modules, lessons.
-- ==============================================================================

begin;

do $$
declare
  v_mentor_id uuid;
  v_course_id uuid;
  v_module_id uuid;
  v_course_title constant text := 'Course Uji Mentor (Draft)';
begin
  -- Hanya akun uji yang berperan mentor yang boleh dipakai.
  select id
    into v_mentor_id
    from public.profiles
   where role = 'mentor'
     and display_name = 'Uji Mentor'
   limit 1;

  if v_mentor_id is null then
    raise notice 'Akun uji mentor tidak ditemukan, course uji dilewati.';
    return;
  end if;

  -- Idempoten: pakai ulang course bila migrasi pernah dijalankan.
  select id
    into v_course_id
    from public.courses
   where title = v_course_title
   limit 1;

  if v_course_id is null then
    insert into public.courses (title, description, category, status, capacity, mentor_id)
    values (
      v_course_title,
      'Course draft untuk menguji alur kurasi silabus dan pemantauan peserta oleh mentor.',
      'Uji Internal',
      'draft',
      30,
      v_mentor_id
    )
    returning id into v_course_id;
  else
    -- Course sudah ada: pastikan tetap milik akun uji dan tetap draft.
    -- Course draft tidak dilindungi trigger, jadi UPDATE ini aman.
    update public.courses
       set mentor_id = v_mentor_id,
           status = 'draft',
           updated_at = now()
     where id = v_course_id;
  end if;

  -- Modul pertama, hanya bila belum ada.
  select id
    into v_module_id
    from public.course_modules
   where course_id = v_course_id
   order by position
   limit 1;

  if v_module_id is null then
    insert into public.course_modules (course_id, title, position)
    values (v_course_id, 'Modul Uji', 1)
    returning id into v_module_id;

    insert into public.lessons (course_id, module_id, title, position, youtube_video_id)
    values
      (v_course_id, v_module_id, 'Materi Uji 1', 1, 'YP34klaxl6A'),
      (v_course_id, v_module_id, 'Materi Uji 2', 2, 'xQzpGlhTgVU');
  end if;

  raise notice 'Course uji mentor siap: % (mentor %)', v_course_id, v_mentor_id;
end;
$$;

commit;
