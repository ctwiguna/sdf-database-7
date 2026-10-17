# Bukti Performa Index lesson_progress

Dokumen ini melengkapi bukti performa IK301 pada PRD, yaitu minimal satu index
disertai bukti bahwa index tersebut membantu. Seluruh angka di bawah adalah hasil
eksekusi nyata, bukan perkiraan.

Berkas pengujian: `scripts/benchmark_lesson_progress_index.sql`

## Object yang diuji

Nama index: `lesson_progress_course_completed_at_idx`

```sql
create index lesson_progress_course_completed_at_idx
  on public.lesson_progress (course_id, completed_at desc);
```

Index ini melayani query progres terbaru pada satu course, misalnya daftar aktivitas
terakhir peserta pada halaman laporan mentor dan admin.

## Query yang diuji

```sql
select lp.id, lp.lesson_id, lp.completed_at
from public.lesson_progress lp
where lp.course_id = $1
order by lp.completed_at desc
limit 50;
```

Query dijalankan lima kali dengan index dan lima kali tanpa index. Nilai yang dipakai
adalah nilai tengah dari lima eksekusi. Planner tidak dipaksa dan tidak diarahkan.

## Data uji

Data sintetis dibangkitkan di dalam transaksi lalu dihapus kembali dengan ROLLBACK,
jadi database tidak berubah setelah pengujian.

| Bagian | Jumlah |
| :---- | :---- |
| Course | 50 |
| Siswa | 50 |
| Lesson | 200, yaitu 4 lesson per course |
| Pendaftaran | 2.500 |
| Baris lesson_progress | 10.000 |

Satu course berisi 200 baris progres, yaitu 2 persen dari seluruh tabel. Sebaran ini
dipilih supaya penyaringan satu course benar benar menyaring data, karena bila satu
course mencakup seluruh tabel maka sequential scan memang pilihan yang tepat dan
index tidak akan pernah dipakai.

Statistik planner diperbarui dengan `ANALYZE` pada `lesson_progress`, `enrollments`,
dan `lessons` sebelum pengukuran.

## Lingkungan pengujian

| Bagian | Nilai |
| :---- | :---- |
| Database | PostgreSQL 17.11 |
| Mesin | Apple M1 Pro, 8 core |
| Wadah | Supabase lokal, Docker |
| shared_buffers | 128MB |
| random_page_cost | 4 |

## Cara menjalankan

```bash
docker exec -i supabase_db_sdf-database-7 psql -U postgres -d postgres \
  -v ON_ERROR_STOP=1 -f /dev/stdin < scripts/benchmark_lesson_progress_index.sql
```

Pada database lain:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/benchmark_lesson_progress_index.sql
```

## Hasil

Ringkasan lima eksekusi per fase:

| Fase | Waktu tercepat | Nilai tengah | Waktu terlama | Simpul rencana | Shared hit | Shared read |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| Tanpa index | 0,354 ms | 0,381 ms | 0,527 ms | Sort | 124 | 0 |
| Dengan index | 0,019 ms | 0,020 ms | 0,032 ms | Index Scan | 36 | 0 |

Rincian setiap eksekusi:

| Fase | Eksekusi 1 | Eksekusi 2 | Eksekusi 3 | Eksekusi 4 | Eksekusi 5 |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Tanpa index | 0,527 ms | 0,381 ms | 0,355 ms | 0,354 ms | 0,443 ms |
| Dengan index | 0,032 ms | 0,027 ms | 0,020 ms | 0,019 ms | 0,019 ms |

Nilai tengah turun dari 0,381 ms menjadi 0,020 ms, sekitar 19 kali lebih cepat. Blok
yang dibaca turun dari 124 menjadi 36.

## Perubahan rencana query

Sebelum index, planner membaca seluruh tabel lalu mengurutkannya:

```text
Limit  (actual time=0.401..0.407 rows=50)
  ->  Sort  (actual time=0.400..0.403 rows=50)
        Sort Key: lp.completed_at DESC
        Sort Method: top-N heapsort  Memory: 30kB
        ->  Seq Scan on lesson_progress lp  (actual time=0.007..0.375 rows=200)
              Filter: (course_id = (InitPlan 1).col1)
              Rows Removed by Filter: 9800
              Buffers: shared hit=124
Execution Time: 0.416 ms
```

Sesudah index, planner langsung mengambil 50 baris teratas tanpa membaca seluruh tabel
dan tanpa langkah sort:

```text
Limit  (actual time=0.010..0.022 rows=50)
  ->  Index Scan using lesson_progress_course_completed_at_idx on lesson_progress lp  (actual time=0.009..0.018 rows=50)
        Index Cond: (course_id = (InitPlan 1).col1)
        Buffers: shared hit=36
Execution Time: 0.030 ms
```

Bukti pendukung yang paling jelas ada pada baris `Rows Removed by Filter: 9800`. Tanpa
index, 9.800 baris dibaca lalu dibuang hanya untuk menyisakan 50 baris. Dengan index,
pembacaan berhenti setelah 50 baris didapat karena urutan `completed_at desc` sudah
tersedia di dalam index.

## Catatan kejujuran

1. Pengukuran dilakukan sebagai pemilik tabel sehingga Row Level Security tidak aktif.
   Tujuannya supaya perbandingan mengukur pengaruh index saja, bukan pengaruh
   pemeriksaan policy per baris. Pada pemakaian nyata, admin memang membaca seluruh
   baris sehingga perbandingannya setara.
2. Angka absolut di bawah satu milidetik karena tabelnya hanya 10.000 baris dan seluruh
   data sudah ada di memori. Yang dibuktikan di sini adalah perubahan bentuk rencana
   query dan penurunan jumlah blok yang dibaca, bukan angka absolut pada server produksi.
3. Pengukuran memakai konfigurasi planner bawaan. Tidak ada `enable_seqscan = off` dan
   tidak ada petunjuk index, sehingga pilihan rencana sepenuhnya dari planner.
