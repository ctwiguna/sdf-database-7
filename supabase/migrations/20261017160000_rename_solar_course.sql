-- Rapikan nama course dan lesson Solar Panel supaya cocok dengan isi videonya.
-- Kedua video berasal dari seri SolarFunda kanal Sun_Soul, yaitu Basics of Solar Energy
-- dan Waaree Solar Panel Datasheet. Isinya dasar energi surya dan komponen sistem PV,
-- bukan instalasi atau maintenance, sehingga judul lama menjanjikan materi yang tidak ada.
-- Keputusan tim: judul yang diganti, videonya tetap.
-- Id course, id lesson, modul, dan baris progres tidak disentuh, jadi pendaftaran dan
-- progres siswa yang sudah ada tetap utuh.
-- Prasyarat: migration 20261016230000_replace_course_catalog dan 20261017120000_tidy_catalog_lessons.

begin;

alter table public.courses disable trigger protect_published_course;
alter table public.course_modules disable trigger protect_published_module;
alter table public.lessons disable trigger protect_published_lesson;

update public.courses
set title = 'Dasar Sistem Solar Panel',
    description = 'Pengenalan energi surya, komponen sistem PV, dan datasheet panel surya.',
    updated_at = now()
where title = 'Instalasi dan Maintenance Solar Panel';

update public.lessons l
set title = v.judul_baru
from (values
  ('YP34klaxl6A', 'Pengenalan energi surya dan sistem PV'),
  ('xQzpGlhTgVU', 'Komponen sistem PV dan datasheet panel')
) as v(youtube_video_id, judul_baru)
where l.youtube_video_id = v.youtube_video_id;

-- Pastikan hasilnya sesuai sebelum transaksi ditutup.
do $$
declare
  v_lesson int;
begin
  if (select count(*) from public.courses where title = 'Dasar Sistem Solar Panel') <> 1 then
    raise exception 'judul course solar tidak sesuai';
  end if;

  select count(*) into v_lesson
  from public.lessons l
  join public.courses c on c.id = l.course_id
  where c.title = 'Dasar Sistem Solar Panel';

  if v_lesson <> 2 then
    raise exception 'jumlah lesson solar tidak sesuai: %', v_lesson;
  end if;

  if not exists (
    select 1
    from public.lessons l
    join public.courses c on c.id = l.course_id
    where c.title = 'Dasar Sistem Solar Panel'
      and l.position = 1
      and l.title = 'Pengenalan energi surya dan sistem PV'
      and l.youtube_video_id = 'YP34klaxl6A'
  ) then
    raise exception 'lesson solar posisi 1 tidak sesuai';
  end if;

  if not exists (
    select 1
    from public.lessons l
    join public.courses c on c.id = l.course_id
    where c.title = 'Dasar Sistem Solar Panel'
      and l.position = 2
      and l.title = 'Komponen sistem PV dan datasheet panel'
      and l.youtube_video_id = 'xQzpGlhTgVU'
  ) then
    raise exception 'lesson solar posisi 2 tidak sesuai';
  end if;
end
$$;

alter table public.lessons enable trigger protect_published_lesson;
alter table public.course_modules enable trigger protect_published_module;
alter table public.courses enable trigger protect_published_course;

commit;
