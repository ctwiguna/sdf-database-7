# Rencana Eksekusi Gerak Antarmuka

Folder ini hasil penyusunan rencana memakai skill `improve-animations` dari repo `emilkowalski/skills`. Tiap berkas ditulis untuk pelaksana yang tidak punya konteks percakapan penyusunnya, jadi semua nilai, kutipan kode, dan batas kerja ditulis lengkap. Sifatnya hanya baca terhadap kode aplikasi: tidak ada perubahan kode di folder ini.

Commit saat rencana disusun: `f57fa9e`. Kalau kode sudah bergerak dari commit itu, baca ulang kutipan kode sebelum mengerjakan.

## Daftar rencana

| Nomor | Judul | Tingkat | Status | Bergantung pada |
| --- | --- | --- | --- | --- |
| 001 | Prasarana gerak: token dan hook reduce motion | LOW | DONE (mekanis) | tidak ada |
| 002 | Umpan balik tekanan pada tombol dan kartu | MEDIUM | DONE (mekanis) | 001 |
| 003 | Gerak masuk dan keluar toast | MEDIUM | DONE (mekanis) | 001 |
| 004 | Umpan balik saat materi selesai | LOW | DONE (mekanis) | 001 |
| 005 | Gerak modal yang sesuai posisi | MEDIUM | DONE (mekanis) | 001 |

Catatan: kelima rencana sudah diterapkan dan diverifikasi secara mekanis (`npm run typecheck` bersih dan `npm test` 91 tes lulus). Feel check di emulator atau perangkat belum dijalankan, jadi status di atas baru mencakup verifikasi mekanis.

## Urutan pengerjaan yang disarankan

1. Kerjakan rencana 001 lebih dulu. Empat rencana lain memakai token dan hook yang ditambahkan di sana. Tanpa 001, pelaksana akan menulis angka kurva sendiri dan nilainya bisa melenceng antar berkas.
2. Rencana 002 dan 003 boleh jalan paralel karena menyentuh bagian berkas yang berbeda.
3. Rencana 002 dan 004 sama sama menyentuh `App.tsx:245`. Jangan dikerjakan bersamaan oleh dua orang. Selesaikan 002 dulu, lalu 004.
4. Rencana 005 menyentuh tiga berkas modal dan tidak bersinggungan dengan yang lain. Kalau waktu mepet sebelum batas submit, rencana ini yang paling aman ditunda karena modalnya sudah beranimasi, hanya jenis geraknya yang belum tepat.

## Tambahan setelah rencana 001 sampai 005

Dua peluang terakhir di berkas audit sudah menyusul, di luar kelima rencana di atas. Keduanya masuk bersama satu penyempurnaan kecil pada ikon materi.

1. Gerak daftar mentor setelah simpan atau hapus modul dan materi. `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` dipanggil sebelum pemuatan ulang daftar di `MentorCourseDetailScreen.tsx`, dan dilewati saat reduce motion aktif. Animasi tata letak sudah aktif di arsitektur baru, jadi tidak ada flag tambahan yang dipasang. Ini menutup peluang nomor 4 di berkas audit.
2. Penanda saat course terakhir selesai. Saat materi terakhir sebuah course ditandai selesai, ikon centang tumbuh dengan overshoot ringan selama 260ms dan label tombolnya jadi Course selesai. Tanpa konfeti. Saat reduce motion aktif, hanya labelnya yang berubah. Ini menutup peluang nomor 5, dan keputusan produknya sudah diambil supaya tidak menggantung. Kalau labelnya tidak diinginkan, cukup kembalikan satu baris di `App.tsx`.
3. Penyempurnaan ikon materi. Ikon centang sekarang hanya tumbuh saat status materi benar benar berubah jadi selesai. Sebelumnya ikon ikut tumbuh saat materi yang sudah selesai dibuka ulang, dan itu tidak sesuai butir 2 di bagian Verifikasi rencana 004.

## Cara memakai folder ini

1. Satu rencana dikerjakan oleh satu orang atau satu agen, tanpa mencampur berkas dari rencana lain dalam satu commit.
2. Ubah kolom Status di tabel atas dan baris Status di berkas rencana menjadi DONE hanya setelah langkah verifikasi dijalankan, bukan setelah kode ditulis.
3. Kalau ada langkah yang tidak cocok dengan kode yang ditemukan, berhenti dan laporkan. Jangan menambal sendiri.
