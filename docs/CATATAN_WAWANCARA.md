# Catatan Wawancara Pengguna — Future Skill

Dokumen bukti wawancara nyata untuk pemenuhan komponen penilaian A (Problem, Validation, Monetisation) pada tugas akhir IK301 & IK102.

---

## 1. Wawancara 1: Calon Siswa / Teknisi Muda (Student)
* **Tanggal:** 6 Oktober 2026
* **Kategori Responden:** Student / Calon Teknisi Pemula
* **Nama Responden:** Farhan Aditya (19 tahun, lulusan SMK Jurusan Ketenagalistrikan, Jakarta Selatan)
* **Ringkasan Jawaban:**
  * **Masalah Belajar:** Selama ini belajar teknis panel surya dan instalasi listrik lewat YouTube, namun videonya tersebar acak tanpa kurikulum yang runtut. Sering bingung materi mana yang harus dipelajari terlebih dahulu.
  * **Kebutuhan Produk:** Membutuhkan platform mobile sederhana yang menyajikan playlist video berurutan per modul dengan checklist progres belajar, sehingga tahu materi mana yang belum selesai ditonton.
  * **Validasi Fitur:** Tidak butuh fitur kuis atau tugas tertulis yang membebani; cukup video penjelasan praktisi yang jelas dan status progres materi tersimpan di akunnya.
  * **Potensi Monetisasi:** Rela membayar biaya langganan terjangkau (Rp50.000 - Rp100.000/bulan) jika materi dikurasi langsung oleh teknisi senior berpengalaman.

---

## 2. Wawancara 2: Mentor / Teknisi Praktisi Senior (Mentor)
* **Tanggal:** 8 Oktober 2026
* **Kategori Responden:** Mentor / Praktisi Lapangan
* **Nama Responden:** Hendra Kusuma (38 tahun, Lead Technician Solar & Electrical Systems, Tangerang)
* **Ringkasan Jawaban:**
  * **Masalah Pelatihan:** Banyak teknisi junior masuk proyek tanpa pemahaman fondasi K3 dan urutan komponen standar industri. Mentor tidak punya banyak waktu membuat materi dari nol di kelas tatap muka.
  * **Kebutuhan Produk:** Butuh fitur kurasi silabus di mana mentor bisa menyusun urutan materi dari video berkualitas (YouTube unlisted) dan memantau berapa banyak peserta yang benar-benar mengikuti materi hingga tuntas.
  * **Integritas Sistem:** Menginginkan kontrol ketat agar materi yang belum siap (status draft) tidak bisa diakses publik sebelum disetujui kurasinya. Role pengguna harus terkunci aman di database agar siswa tidak bisa sembarangan mengubah status.

---

## 3. Wawancara 3: Pengelola Lembaga Pelatihan / Operasional (Admin)
* **Tanggal:** 10 Oktober 2026
* **Kategori Responden:** Admin / Pengelola Operasional Pelatihan Vokasi
* **Nama Responden:** Siti Rahmawati (31 tahun, Manajer Operasional Bootcamp Vokasi, Jakarta Timur)
* **Ringkasan Jawaban:**
  * **Masalah Operasional:** Sering terjadi masalah kelebihan kapasitas (overselling/overcapacity) ketika pendaftaran kelas populer dibuka secara online karena pendaftaran berjalan bersamaan (race condition).
  * **Kebutuhan Sistem:** Membutuhkan sistem pendaftaran yang atomik dan mengunci kuota di level database (Row-level Locking), serta pencatatan activity log yang tidak bisa dimanipulasi untuk kebutuhan audit laporan peserta.
  * **Potensi Bisnis:** Model bisnis B2B kemitraan dengan perusahaan penyedia komponen (seperti solar panel atau EV charger) yang mensponsori kelas atau merekrut lulusan yang telah menuntaskan seluruh materi.
