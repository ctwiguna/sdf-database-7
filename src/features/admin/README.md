# Fitur admin

Dua layar untuk peran admin: laporan course dan kelola course. Angka laporan berasal dari satu RPC, `admin_course_report`,
yang sudah diterapkan di `supabase/migrations/20261017150000_admin_course_report.sql`.

## Isi folder

1. `types.ts` Bentuk baris laporan, ringkasan lintas course, dan tipe kelola course.
2. `lib/admin.ts` Pemanggil RPC, penerjemah pesan error, dan penghitung ringkasan. Tidak mengimpor klien Supabase langsung supaya bisa diuji dengan klien tiruan.
3. `screens/AdminReportScreen.tsx` Layar laporan: daftar course, ringkasan pendaftar, dan agregat progres per course.
4. `screens/AdminCourseScreen.tsx` Layar kelola course: buat dan ubah draf, pasang mentor, atur kapasitas, dan terbitkan lewat RPC `publish_course`.

## Kontrak RPC

`admin_course_report(p_course_id uuid default null)` mengembalikan satu baris per course:

| Kolom | Arti |
| --- | --- |
| `course_id` | Pengenal course. |
| `course_title` | Judul course. |
| `mentor_name` | Nama tampilan mentor, atau teks pengganti bila belum ada mentor. |
| `status` | `draft` atau `published`. |
| `total_lessons` | Jumlah lesson pada course tersebut. |
| `total_participants` | Jumlah baris enrollment. |
| `average_progress` | Rerata progres seluruh peserta dalam persen, satu angka di belakang koma. |
| `completed_participants` | Jumlah peserta yang seluruh lessonnya selesai. |

Tanpa argumen, seluruh course dilaporkan termasuk draft dan course tanpa mentor. RPC memakai
`security definer` dengan `set search_path = ''`, memeriksa `auth.uid()` dan peran `profiles.role = 'admin'`,
lalu menolak pemanggil lain dengan kode `not_authenticated` atau `not_admin`.
Course tanpa lesson atau tanpa peserta menghasilkan nilai nol, bukan error bagi nol.

## Alur terbit course

Draf course dan pengaturan mentor serta kapasitas ditulis langsung ke tabel `courses` dengan
kebijakan RLS admin. Penerbitan memakai RPC `publish_course`
(`supabase/migrations/20261012130000_course_seed_publish_rls.sql`), yang menolak pemanggil
bukan admin, course yang bukan draf, dan course tanpa materi.
