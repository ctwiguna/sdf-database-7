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
- [X] Migration katalog: `courses`, `course_modules`, dan `lessons`.
- [X] Editor silabus mentor & RPC `publish_course` untuk admin.
- [X] Constraints dan RLS proteksi kurikulum course draft vs published.
- [X] Kurasi video unlisted berizin untuk empat course percontohan, total 44 lesson.
- [ ] Verifikasi izin penggunaan 44 video di docs/izin-video.md; semua status saat ini belum diverifikasi.
- [ ] Koordinasi review konten praktisi lapangan.
- [X] Menyelaraskan catatan izin video dengan nama course dan judul lesson terbaru.

## 3. Chandra Tabligh | `ctwiguna` (Mobile App Lead & Progres)
- [x] Setup proyek React Native dengan Expo dan TypeScript.
- [x] Katalog empat course, detail silabus, dan pemutar video YouTube WebView.
- [x] Migration `lesson_progress` dan RPC `complete_lesson`.
- [x] Test SQL `supabase/tests/lesson_progress.test.sql` (21 pemeriksaan lulus).
- [x] Test unit logika urutan silabus dan progres belajar (91 test lulus di 8 berkas).
- [x] Integrasi Supabase client dengan RPC database di React Native (`enroll_course`, `complete_lesson`, `publish_course`, `admin_course_report`, `mentor_course_report`).
- [x] Build APK Android mandiri via local build (`android/app/build/outputs/apk/release/app-release.apk`).
- [x] Perbaikan sesi `SafeAreaView` agar header dan bottom navigation tidak bertabrakan dengan system bar Android.
- [x] Ikon launcher dan nama aplikasi Future Skill.

## 4. Al Ghifary | `Arelll1204` (Fitur & Layar Mentor)
- [x] Setup folder fitur mentor (`src/features/mentor/`).
- [x] Layar antarmuka mentor untuk kurasi modul/lesson dan pemantauan peserta (`MentorCourseListScreen`, `MentorCourseDetailScreen`, `MentorParticipantsScreen`).
- [x] Query RPC `mentor_course_report` dan `course_progress` (`src/features/mentor/lib/report.ts`).
- [x] Pengujian akses mentor, urutan silabus, dan isolasi progres lintas course (`src/__tests__/mentor.test.ts`, `mentorReport.test.ts`).

## 5. NAWWAF | `AeternalSym` (Fitur Admin, QA & Deliverables)
- [x] Layar antarmuka admin untuk publikasi course dan laporan (`AdminCourseScreen`, `AdminReportScreen`).
- [x] Query RPC `admin_course_report` dengan agregasi CTE (`src/features/admin/lib/admin.ts`).
- [x] Script benchmark index performa `lesson_progress(course_id, completed_at DESC)` (`scripts/benchmark_lesson_progress_index.sql`).
- [ ] Penyusunan pitch deck startup format PDF (Problem, Solution, Monetisation).
- [ ] Backup video demo aplikasi 2-3 menit.
