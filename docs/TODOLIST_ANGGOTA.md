# Pembagian Kerja dan Todolist Anggota Future Skill

Sesuai Product Requirements Document (PRD Bagian 7) dan kesepakatan kelompok:

---

## 1. BRILLIANT | `brilliantgibrann16` (Database & Security)
- [x] Inisialisasi Supabase Project (`lms-course-kelompok`) dan siapkan kredensial aman (URL & Anon Key).
- [x] Migration `profiles`: skema relasi auth, trigger `handle_new_user` (default role student), dan trigger penolakan edit role client.
- [x] Migration `enrollments`: unique constraint komposit, FK restrict, dan policy RLS.
- [x] Migration `activity_logs`: pencatatan audit trail atomik (`enrolled` & `lesson_completed`) dan policy RLS.
- [x] Stored Procedure RPC `enroll_course`: row-level locking (`SELECT ... FOR UPDATE`), verifikasi status `published`, verifikasi kuota, dan transaksi atomik.
- [x] Test SQL komprehensif (`supabase/tests/enroll_course.test.sql`): verifikasi peran, idempotensi, kapasitas, RLS, dan rollback saat log gagal.
- [ ] Catatan tiga wawancara nyata calon pengguna (Student, Mentor, Admin), disimpan tim di luar repo dan disusulkan setelah sesi wawancara.

## 2. Kevin | `KenonymouszzZ` (Katalog & Kurikulum)
- [ ] Migration katalog: `courses`, `course_modules`, dan `lessons`.
- [ ] Editor silabus mentor & RPC `publish_course` untuk admin.
- [ ] Constraints dan RLS proteksi kurikulum course draft vs published.
- [ ] Kurasi delapan video unlisted berizin untuk empat course percontohan.
- [ ] Koordinasi review konten praktisi lapangan.

## 3. Chandra Tabligh | `ctwiguna` (Mobile App Lead & Progres)
- [x] Setup proyek React Native dengan Expo dan TypeScript.
- [x] Katalog empat course, detail silabus, dan pemutar video YouTube WebView.
- [x] Migration `lesson_progress` dan RPC `complete_lesson`.
- [x] Test SQL `supabase/tests/lesson_progress.test.sql` (21 pemeriksaan lulus).
- [x] Test unit logika urutan silabus dan progres belajar (7 test lulus).
- [ ] Integrasi Supabase client dengan RPC database di React Native.
- [ ] Build APK Android mandiri via EAS / local build.

## 4. Al Ghifary | `Arelll1204` (Fitur & Layar Mentor)
- [x] Setup folder fitur mentor (`src/features/mentor/`).
- [ ] Layar antarmuka mentor untuk kurasi modul/lesson dan pemantauan peserta.
- [ ] Query RPC `mentor_course_report` dan `course_progress`.
- [ ] Pengujian akses mentor, urutan silabus, dan isolasi progres lintas course.

## 5. NAWWAF | `AeternalSym` (Fitur Admin, QA & Deliverables)
- [ ] Layar antarmuka admin untuk publikasi course dan laporan.
- [ ] Query RPC `admin_course_report` dengan agregasi CTE.
- [ ] Script benchmark index performa `lesson_progress(course_id, completed_at DESC)`.
- [ ] Penyusunan pitch deck startup format PDF (Problem, Solution, Monetisation).
- [ ] Backup video demo aplikasi 2-3 menit.
