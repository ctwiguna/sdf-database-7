-- Ganti katalog MVP ke empat playlist yang dipilih tim.
-- Course lama dipetakan berdasarkan urutan seed agar enrollment dan progres tetap tersambung.
-- Status published tetap dipertahankan. Trigger perlindungan dimatikan selama perubahan katalog.
begin;

alter table public.courses disable trigger protect_published_course;
alter table public.course_modules disable trigger protect_published_module;
alter table public.lessons disable trigger protect_published_lesson;

update public.courses set title = 'Instalasi dan Maintenance Solar Panel', description = 'Dasar komponen, keselamatan, instalasi, dan maintenance solar panel.', category = 'Energi' where title = 'Instalasi dan Maintenance Solar Panel';
update public.courses set title = 'EV Battery Management System', description = 'Kursus bertahap tentang baterai kendaraan listrik, BMS, motor, controller, dan teknologi EV.', category = 'Kendaraan Listrik' where title = 'Plumbing';
update public.courses set title = 'PEST Control Course', description = 'Pengenalan pest prevention, integrated pest management, pengendalian tikus, serangga, dan keselamatan penggunaan pestisida.', category = 'Pest Control' where title = 'Instalasi dan Maintenance EV Charging Station';
update public.courses set title = 'Mechanical Electrical Plumbing Course', description = 'Pengenalan sistem mekanikal, elektrikal, plumbing, HVAC, proteksi kebakaran, dan utilitas bangunan tinggi.', category = 'MEP' where title = 'Maintenance Mobil dan Motor Listrik';

update public.course_modules m set title = case c.title when 'Instalasi dan Maintenance Solar Panel' then 'Dasar Solar Panel' when 'EV Battery Management System' then 'EV Battery Management System' when 'PEST Control Course' then 'PEST Control Course' when 'Mechanical Electrical Plumbing Course' then 'Mechanical Electrical Plumbing' end from public.courses c where c.id = m.course_id;

with catalog(course_title, lesson_position, lesson_title, youtube_video_id) as (values
  ('Instalasi dan Maintenance Solar Panel', 1, 'Komponen sistem dan keselamatan', 'YP34klaxl6A'),
  ('Instalasi dan Maintenance Solar Panel', 2, 'Gambaran instalasi dan maintenance', 'xQzpGlhTgVU'),
  ('EV Battery Management System', 1, 'Battery Thermal Management System (BTMS) Explained | BMS, Thermal Runaway |', 'yrqvEKzqz4k'),
  ('EV Battery Management System', 2, 'Inside EV Batteries: The Anatomy of Power, Thermal Realities & BMS Logic', '0mIVDbKl9-w'),
  ('EV Battery Management System', 3, 'Two Wheeler Electric Vehicle Technician Training | EV Repair & Maintenance | Skill-Based Course', 'OD3hF8kUg_Y'),
  ('EV Battery Management System', 4, 'Electric Vehicle Controller Part 03 | Motor Control Techniques Explained | PWM & PID for EVs', 'xEeJbmxpHaU'),
  ('EV Battery Management System', 5, 'Electric Vehicle Controller Part 02 | MCU | EV Course|', 'QclOmZNFYn8'),
  ('EV Battery Management System', 6, 'Electric Vehicle Controller | Functions, Working Principle & Types Explained', 'J_lo4Jg9wsg'),
  ('EV Battery Management System', 7, 'Axial Flux and Reluctance Motors | Electric vehicle Course|', 'jgFYWbukDT4'),
  ('EV Battery Management System', 8, 'Permanent Magnet Synchronous Motor (PMSM): Construction, Working, Types & Control Explained', 'j-r6mYBgCro'),
  ('EV Battery Management System', 9, 'Induction and Synchronous Motor | Working and principle Explained| Electric vehicle course', 'dso8BRlN_IM'),
  ('EV Battery Management System', 10, 'What is Hall Effect |The Science Behind Hall Sensors and Their Applications| EV course 09|', 'a5GnYYknh3U'),
  ('EV Battery Management System', 11, 'BLDC motor explained| Electric Vehicle course Lecture 08| Motor Torque|', '_1PTFD2SLyo'),
  ('EV Battery Management System', 12, 'Introduction to Motors: Types, Functionality & Applications| Electric vehicle course lecture 07|', 'w_q4_JRzVTM'),
  ('EV Battery Management System', 13, 'Battery Management System (BMS) for Electric Vehicles: SOH, SOC| Electric vehicle course lecture 06', 'kgsh0px09r8'),
  ('EV Battery Management System', 14, 'What is Battery Management System | Electric vehicle course lecture 05|', 'rgxpRyRuKwc'),
  ('EV Battery Management System', 15, 'Battery Pack designing and Calculations| EV Battery Pack| Electric Vehicle course lecture 04|', 'NyP3-CX6Nnc'),
  ('EV Battery Management System', 16, 'Introduction to battery Technology| Lithium ion batteries| Electric Vehicle course lecture 03|', 'RBbjU9MBSfQ'),
  ('EV Battery Management System', 17, 'Introduction to EV battery and cell chemistry| Electric Vehicle course lecture 02|', 'NGPzanhjld8'),
  ('EV Battery Management System', 18, 'Electric Vehicle Training Course Announcement| #electricvehicle #electricvehiclecourse #evcourse', 'lwkpDItjRgc'),
  ('EV Battery Management System', 19, 'Fundamentals of Electric Vehicle|Electric Vehicle Course 01|', 'MfBWvlY4_iU'),
  ('PEST Control Course', 1, 'Pest Prevention in School Buildings', 'zGKiWheRQFU'),
  ('PEST Control Course', 2, 'IPM in Schools - IPM for Cockroaches in Schools', 'jAleqzAmsXI'),
  ('PEST Control Course', 3, 'Cockroaches Finally Meet Their Match (Yep, It Includes IPM)', '8_XTHIWtcT4'),
  ('PEST Control Course', 4, 'Rodent Management II: Signs of a Rodent Infestation', 'kP9Pi4W1ewc'),
  ('PEST Control Course', 5, 'Rodent Management III: Trap Selection and Placement', 'gHXn7QwL-Ag'),
  ('PEST Control Course', 6, 'Rodent Management IV: How to Keep Them Out', 'gXJwW5Iarn0'),
  ('PEST Control Course', 7, 'The Pink Panther in "Pink Pest Control"', 'RAcNZo7-f0g'),
  ('PEST Control Course', 8, 'Where to Look for Signs of Pests - Orkin for Your Business', 'vEm7hmF6tyE'),
  ('PEST Control Course', 9, 'Orkin''s Environmental Pest Control & LEED Certification Tips', 'Mjvpm1lX6fk'),
  ('PEST Control Course', 10, 'Termite Information : How to Check for Termites', 'PLBXpFB-qAo'),
  ('PEST Control Course', 11, 'How to Get Rid of Rats and Mice Guaranteed- 4 Easy Steps', 'eVaTGUlL6Qk'),
  ('PEST Control Course', 12, 'Pest Control VA - A Typical Mice Pest Control Visit In Virginia', 'Cr3vgH_AK5o'),
  ('PEST Control Course', 13, 'How To Turn Around A Customer Who Already Has A Pest Control Service', 'bQwVBS1XIoQ'),
  ('PEST Control Course', 14, 'A1 Apprentice Training Video', 'HwgsLlaC1ik'),
  ('PEST Control Course', 15, 'Understanding Pesticides Part I', 'xuSZFRf0EpY'),
  ('PEST Control Course', 16, 'Understanding Pesticides Part II', 'Fny3q2UCwdQ'),
  ('PEST Control Course', 17, 'Georgia commercial applicator general standards pesticide part 1', '5h8VMxTR-q8'),
  ('PEST Control Course', 18, 'DA0406MoetiMaumbi', 'kZlEqAyS0nQ'),
  ('PEST Control Course', 19, 'A Day in Pest Control -  Buildings, Grocery, Supermarkets, Feb 5', '4Lcj57AK6is'),
  ('PEST Control Course', 20, 'Pest Control Technician - A Typical Day in Pest Control', 'QxXTRKIbmBY'),
  ('PEST Control Course', 21, 'How To Get Rid of Mice | EVERYTHING You NEED to Know', '_sNtgcjkkl0'),
  ('Mechanical Electrical Plumbing Course', 1, 'Utility / MEP (Mechanical Electrical Plumbing) Systems in High-Rise Building Design', '15rdZkulUqk'),
  ('Mechanical Electrical Plumbing Course', 2, 'Clean Water Systems in High-Rise Buildings - plumbing', 'ds36utOlVXw'),
  ('Mechanical Electrical Plumbing Course', 3, 'Rainwater Systems & Infiltration Wells (Vertical Drainage) in High-Rise Buildings', 'PrMbBGZsYDE'),
  ('Mechanical Electrical Plumbing Course', 4, 'Split AC Systems in High-Rise Buildings - Building HVAC Systems', 'cT29vwbpyJ0'),
  ('Mechanical Electrical Plumbing Course', 5, 'Electronic Systems in High-Rise Buildings - Extra-Low Voltage (ELV)', 'pGb0pQA4Xlk'),
  ('Mechanical Electrical Plumbing Course', 6, 'Pengelolaan Sampah pada Bangunan Tinggi - Waste Management', '4N2LIY6yp70'),
  ('Mechanical Electrical Plumbing Course', 7, 'Sistem MEP (Mekanikal Elektrikal Plambing) pada Bangunan Tinggi | Ulas Buku Deepublish', 'ZcSLb4B1AYM'),
  ('Mechanical Electrical Plumbing Course', 8, 'SISTEM MEP (MEKANIKAL ELEKTRIKAL PLUMBING) PADA BANGUNAN TINGGI | ULAS BUKU DEEPUBLISH', 'Sj3q4i1dLyA')
), updated as (
  update public.lessons l set title = x.lesson_title, youtube_video_id = x.youtube_video_id
  from catalog x join public.courses c on c.title = x.course_title
  where l.course_id = c.id and l.position = x.lesson_position returning l.id
), inserted as (
  insert into public.lessons (module_id, course_id, title, position, youtube_video_id)
  select m.id, c.id, x.lesson_title, x.lesson_position, x.youtube_video_id
  from catalog x join public.courses c on c.title = x.course_title
  join public.course_modules m on m.course_id = c.id and m.position = 1
  where not exists (select 1 from public.lessons l where l.course_id = c.id and l.position = x.lesson_position)
  returning id
), counts as (select (select count(*) from updated) + (select count(*) from inserted) as total)
select total from counts;
do $$
declare total integer;
begin
  select count(*) into total from public.lessons l join public.courses c on c.id = l.course_id
  where c.title in ('Instalasi dan Maintenance Solar Panel', 'EV Battery Management System', 'PEST Control Course', 'Mechanical Electrical Plumbing Course');
  if total <> 50 then raise exception 'Catalog lesson count mismatch: %', total; end if;
end $$;

alter table public.lessons enable trigger protect_published_lesson;
alter table public.course_modules enable trigger protect_published_module;
alter table public.courses enable trigger protect_published_course;

commit;
