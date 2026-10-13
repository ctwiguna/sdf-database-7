# Supabase

Folder ini memuat migration dan test database Future Skill.

## Urutan dependency

Berkas migration dijalankan menurut urutan nama. Urutan dependency yang disepakati:

1. profiles dan trigger profil (BRILLIANT)
2. courses (Kevin)
3. course_modules (Kevin)
4. lessons (Kevin)
5. enrollments (BRILLIANT)
6. lesson_progress (Chandra)
7. activity_logs (BRILLIANT)
8. RPC: enroll_course (BRILLIANT), publish_course (Kevin), complete_lesson (Chandra), course_progress dan laporan (Al Ghifary, NAWWAF)

`complete_lesson` memanggil `activity_logs` saat berjalan, jadi berkasnya diletakkan setelah migration `activity_logs`. Bila stempel waktu pada nama berkas tidak sesuai urutan di atas, ganti nama berkas agar urutannya benar sebelum dijalankan pada database kosong.

## Menjalankan test lesson_progress

Skrip test membungkus semua langkah dalam satu transaksi dan ditutup rollback, jadi tidak meninggalkan data dan aman dijalankan berulang.

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/lesson_progress.test.sql
```

Hasil yang diharapkan: semua baris `OK` tercetak dan baris terakhir `SEMUA UJI LESSON_PROGRESS LULUS`.



# Course catalog: seed and publishing

The existing seed migration targets four draft courses, four modules, and
eight lessons. It does not assign `mentor_id`; the current lesson seed repeats
video IDs, so it does not yet meet an eight-unique-video requirement.

Before publishing:
1. Select a real mentor and use that account's `public.profiles.id`.
2. Assign the mentor UUID to the intended course rows.
3. Verify the topic and availability of each YouTube video; update existing
   lesson rows with distinct, verified video IDs where required.
4. Ensure each course has at least one lesson.
5. As an authenticated admin, call `public.publish_course(course_uuid)`.

Example only; replace with a real UUID and run as admin:

```sql
select public.publish_course('REPLACE-WITH-REAL-COURSE-UUID'::uuid);
```

Do not invent mentor UUIDs or publish lessons before verifying the videos.
