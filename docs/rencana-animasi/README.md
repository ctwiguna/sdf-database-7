# Rencana Eksekusi Gerak Antarmuka

Folder ini hasil penyusunan rencana memakai skill `improve-animations` dari repo `emilkowalski/skills`. Tiap berkas ditulis untuk pelaksana yang tidak punya konteks percakapan penyusunnya, jadi semua nilai, kutipan kode, dan batas kerja ditulis lengkap. Sifatnya hanya baca terhadap kode aplikasi: tidak ada perubahan kode di folder ini.

Commit saat rencana disusun: `f57fa9e`. Kalau kode sudah bergerak dari commit itu, baca ulang kutipan kode sebelum mengerjakan.

## Daftar rencana

| Nomor | Judul | Tingkat | Status | Bergantung pada |
| --- | --- | --- | --- | --- |
| 001 | Prasarana gerak: token dan hook reduce motion | LOW | TODO | tidak ada |
| 002 | Umpan balik tekanan pada tombol dan kartu | MEDIUM | TODO | 001 |
| 003 | Gerak masuk dan keluar toast | MEDIUM | TODO | 001 |
| 004 | Umpan balik saat materi selesai | LOW | TODO | 001 |
| 005 | Gerak modal yang sesuai posisi | MEDIUM | TODO | 001 |

## Urutan pengerjaan yang disarankan

1. Kerjakan rencana 001 lebih dulu. Empat rencana lain memakai token dan hook yang ditambahkan di sana. Tanpa 001, pelaksana akan menulis angka kurva sendiri dan nilainya bisa melenceng antar berkas.
2. Rencana 002 dan 003 boleh jalan paralel karena menyentuh bagian berkas yang berbeda.
3. Rencana 002 dan 004 sama sama menyentuh `App.tsx:245`. Jangan dikerjakan bersamaan oleh dua orang. Selesaikan 002 dulu, lalu 004.
4. Rencana 005 menyentuh tiga berkas modal dan tidak bersinggungan dengan yang lain. Kalau waktu mepet sebelum batas submit, rencana ini yang paling aman ditunda karena modalnya sudah beranimasi, hanya jenis geraknya yang belum tepat.

## Kandidat yang belum direncanakan

1. Gerak daftar mentor setelah simpan atau hapus modul dan materi. Perbaikannya satu baris di tiga titik: `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` sebelum `await loadCourse()` di `MentorCourseDetailScreen.tsx:133`, `183`, dan `210`. Ini masuk daftar peluang nomor 4 di berkas audit dan bisa dikerjakan kapan saja.
2. Penanda saat course terakhir selesai. Ini masuk daftar peluang nomor 5 di berkas audit, dan butuh keputusan produk lebih dulu karena geraknya memakai anggaran delight. Geraknya harus satu beat saja, tanpa konfeti.

## Cara memakai folder ini

1. Satu rencana dikerjakan oleh satu orang atau satu agen, tanpa mencampur berkas dari rencana lain dalam satu commit.
2. Ubah kolom Status di tabel atas dan baris Status di berkas rencana menjadi DONE hanya setelah langkah verifikasi dijalankan, bukan setelah kode ditulis.
3. Kalau ada langkah yang tidak cocok dengan kode yang ditemukan, berhenti dan laporkan. Jangan menambal sendiri.
