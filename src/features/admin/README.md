# Fitur admin

Layar laporan untuk peran admin. Seluruh angka berasal dari satu RPC, `admin_course_report`,
yang sudah diterapkan di `supabase/migrations/20261017150000_admin_course_report.sql`.

## Isi folder

- `types.ts` Bentuk baris laporan dan ringkasan lintas course.
- `lib/admin.ts` Pemanggil RPC, penerjemah galat, dan penghitung ringkasan. Tidak mengimpor klien Supabase langsung supaya bisa diuji dengan klien tiruan.
- `screens/AdminReportScreen.tsx` Layar laporan: daftar course, ringkasan pendaftar, dan agregat progres per course.

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
Course tanpa lesson atau tanpa peserta menghasilkan nilai nol, bukan galat bagi nol.
