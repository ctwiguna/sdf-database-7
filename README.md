# Future Skill

Future Skill adalah MVP LMS mobile untuk pembelajaran melalui playlist video YouTube unlisted, silabus terurut, dan progres belajar.

## Bagian Chandra

Fondasi React Native dengan Expo, katalog empat course, detail course, playlist terurut, pemutar YouTube, progres lokal untuk fallback demo, design tokens, dan Supabase client berbasis environment.

Fitur tugas, submission, penilaian, chat, pembayaran, sertifikat, dan upload video belum termasuk scope milestone ini.

## Menjalankan aplikasi

Requirements: Node.js 20 atau lebih baru.

```bash
npm install
cp .env.example .env
npm start
```

Aplikasi dapat berjalan menggunakan data demo lokal. Jika environment Supabase diisi, client tersedia untuk integrasi query berikutnya.

## Verifikasi

```bash
npm run typecheck
npm run export
```

Video pada `src/data/mockCourses.ts` adalah placeholder pengembangan. Ganti dengan video milik sendiri atau video yang sudah memperoleh izin sebelum demo.

## AI usage

Bagian ini diperbarui sampai rilis final. Pada milestone ini asisten AI (Hermes Agent) dipakai untuk menyusun struktur proyek, komponen antarmuka, helper progres, dan test unit. Keputusan scope, kurasi materi, data course, dan verifikasi akhir dijalankan tim. Setiap anggota wajib dapat menjelaskan bagian yang ia kerjakan saat Q&A.