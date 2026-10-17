-- Bersihkan lesson yang tidak layak dan rapikan urutan silabus.
-- Enam lesson dihapus karena bukan materi ajar: pengumuman kursus, kartun,
-- materi penjualan, judul tanpa informasi, dan dua ulasan buku.
-- Urutan EV Battery Management System disusun ulang mengikuti nomor lecture
-- pada judul video, supaya materi dasar tidak lagi berada di akhir course.
-- Preferensi tim: lesson bermasalah dihapus, bukan diganti video lain.

begin;

alter table public.courses disable trigger protect_published_course;
alter table public.course_modules disable trigger protect_published_module;
alter table public.lessons disable trigger protect_published_lesson;

-- 1. Hapus lesson yang tidak layak sebagai materi ajar.
delete from public.lessons l
using public.courses c
where l.course_id = c.id
  and l.youtube_video_id in (
    'lwkpDItjRgc',
    'RAcNZo7-f0g',
    'bQwVBS1XIoQ',
    'kZlEqAyS0nQ',
    'ZcSLb4B1AYM',
    'Sj3q4i1dLyA'
  );

-- 2. Geser posisi ke rentang aman supaya unique (module_id, position) tidak bentrok.
update public.lessons l
set position = l.position + 1000
from public.courses c
where c.id = l.course_id
  and c.title in (
      'Instalasi dan Maintenance Solar Panel',
      'EV Battery Management System',
      'PEST Control Course',
      'Mechanical Electrical Plumbing Course'
  );

-- 3. Tulis ulang posisi dan judul sesuai urutan final.
with target(course_title, position, lesson_title, youtube_video_id) as (
  values
      ('Instalasi dan Maintenance Solar Panel', 1, 'Komponen sistem dan keselamatan', 'YP34klaxl6A'),      ('Instalasi dan Maintenance Solar Panel', 2, 'Gambaran instalasi dan maintenance', 'xQzpGlhTgVU'),      ('EV Battery Management System', 1, 'Dasar kendaraan listrik', 'MfBWvlY4_iU'),      ('EV Battery Management System', 2, 'Kimia sel dan baterai EV', 'NGPzanhjld8'),      ('EV Battery Management System', 3, 'Teknologi baterai lithium ion', 'RBbjU9MBSfQ'),      ('EV Battery Management System', 4, 'Perancangan dan perhitungan battery pack', 'NyP3-CX6Nnc'),      ('EV Battery Management System', 5, 'Pengenalan Battery Management System', 'rgxpRyRuKwc'),      ('EV Battery Management System', 6, 'BMS: state of health dan state of charge', 'kgsh0px09r8'),      ('EV Battery Management System', 7, 'Thermal management baterai', 'yrqvEKzqz4k'),      ('EV Battery Management System', 8, 'Anatomi baterai EV', '0mIVDbKl9-w'),      ('EV Battery Management System', 9, 'Pengenalan jenis dan fungsi motor', 'w_q4_JRzVTM'),      ('EV Battery Management System', 10, 'Motor BLDC dan torsi', '_1PTFD2SLyo'),      ('EV Battery Management System', 11, 'Efek Hall dan sensor Hall', 'a5GnYYknh3U'),      ('EV Battery Management System', 12, 'Motor induksi dan motor sinkron', 'dso8BRlN_IM'),      ('EV Battery Management System', 13, 'Permanent Magnet Synchronous Motor', 'j-r6mYBgCro'),      ('EV Battery Management System', 14, 'Motor axial flux dan reluctance', 'jgFYWbukDT4'),      ('EV Battery Management System', 15, 'Controller EV: fungsi dan jenis', 'J_lo4Jg9wsg'),      ('EV Battery Management System', 16, 'Controller EV bagian 2: MCU', 'QclOmZNFYn8'),      ('EV Battery Management System', 17, 'Controller EV bagian 3: teknik kontrol motor', 'xEeJbmxpHaU'),      ('EV Battery Management System', 18, 'Pelatihan teknisi kendaraan listrik roda dua', 'OD3hF8kUg_Y'),      ('PEST Control Course', 1, 'Pencegahan hama di gedung sekolah', 'zGKiWheRQFU'),      ('PEST Control Course', 2, 'Integrated pest management untuk kecoa di sekolah', 'jAleqzAmsXI'),      ('PEST Control Course', 3, 'Pengendalian kecoa dengan IPM', '8_XTHIWtcT4'),      ('PEST Control Course', 4, 'Manajemen tikus bagian 2: tanda serangan hama', 'kP9Pi4W1ewc'),      ('PEST Control Course', 5, 'Manajemen tikus bagian 3: pemilihan dan penempatan perangkap', 'gHXn7QwL-Ag'),      ('PEST Control Course', 6, 'Manajemen tikus bagian 4: cara mencegah masuk', 'gXJwW5Iarn0'),      ('PEST Control Course', 7, 'Mencari tanda keberadaan hama', 'vEm7hmF6tyE'),      ('PEST Control Course', 8, 'Pest control ramah lingkungan dan sertifikasi LEED', 'Mjvpm1lX6fk'),      ('PEST Control Course', 9, 'Cara memeriksa rayap', 'PLBXpFB-qAo'),      ('PEST Control Course', 10, 'Cara mengendalikan tikus dan mencit', 'eVaTGUlL6Qk'),      ('PEST Control Course', 11, 'Kunjungan pengendalian mencit', 'Cr3vgH_AK5o'),      ('PEST Control Course', 12, 'Pelatihan dasar teknisi pest control', 'HwgsLlaC1ik'),      ('PEST Control Course', 13, 'Dasar pestisida bagian 1', 'xuSZFRf0EpY'),      ('PEST Control Course', 14, 'Dasar pestisida bagian 2', 'Fny3q2UCwdQ'),      ('PEST Control Course', 15, 'Standar umum aplikator pestisida komersial', '5h8VMxTR-q8'),      ('PEST Control Course', 16, 'Aktivitas harian teknisi pest control di gedung dan ritel', '4Lcj57AK6is'),      ('PEST Control Course', 17, 'Teknisi pest control: rutinitas harian', 'QxXTRKIbmBY'),      ('PEST Control Course', 18, 'Cara mengendalikan mencit secara tuntas', '_sNtgcjkkl0'),      ('Mechanical Electrical Plumbing Course', 1, 'Pengenalan sistem MEP bangunan tinggi', '15rdZkulUqk'),      ('Mechanical Electrical Plumbing Course', 2, 'Sistem air bersih bangunan tinggi', 'ds36utOlVXw'),      ('Mechanical Electrical Plumbing Course', 3, 'Sistem air hujan dan sumur resapan', 'PrMbBGZsYDE'),      ('Mechanical Electrical Plumbing Course', 4, 'Sistem AC split bangunan tinggi', 'cT29vwbpyJ0'),      ('Mechanical Electrical Plumbing Course', 5, 'Sistem elektronik dan extra low voltage', 'pGb0pQA4Xlk'),      ('Mechanical Electrical Plumbing Course', 6, 'Pengelolaan sampah bangunan tinggi', '4N2LIY6yp70')
)
update public.lessons l
set position = t.position,
    title = t.lesson_title
from target t
join public.courses c on c.title = t.course_title
where l.course_id = c.id
  and l.youtube_video_id = t.youtube_video_id;

-- 4. Pastikan jumlah dan kerapatan posisi sesuai.
do $$
declare
  v_total int;
  r record;
begin
  select count(*) into v_total
  from public.lessons l
  join public.courses c on c.id = l.course_id
  where c.title in (
      'Instalasi dan Maintenance Solar Panel',
      'EV Battery Management System',
      'PEST Control Course',
      'Mechanical Electrical Plumbing Course'
  );

  if v_total <> 44 then
    raise exception 'jumlah lesson tidak sesuai: %', v_total;
  end if;

  for r in
    select c.title, count(*) as n, max(l.position) as mx, min(l.position) as mn
    from public.lessons l
    join public.courses c on c.id = l.course_id
    where c.title in (
      'Instalasi dan Maintenance Solar Panel',
      'EV Battery Management System',
      'PEST Control Course',
      'Mechanical Electrical Plumbing Course'
    )
    group by c.title
  loop
    if r.mn <> 1 or r.mx <> r.n then
      raise exception 'posisi tidak rapat pada %: min %, max %, jumlah %', r.title, r.mn, r.mx, r.n;
    end if;
  end loop;
end $$;

alter table public.lessons enable trigger protect_published_lesson;
alter table public.course_modules enable trigger protect_published_module;
alter table public.courses enable trigger protect_published_course;

commit;
