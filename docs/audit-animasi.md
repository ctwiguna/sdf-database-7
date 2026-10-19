# Audit Gerak Antarmuka Future Skill LMS

Berkas ini hasil audit memakai skill `find-animation-opportunities` dari repo `emilkowalski/skills`. Sifatnya hanya baca: tidak ada kode aplikasi yang diubah.

Penilaian disusun dari kode pada commit `f57fa9e`. Perilaku gerak belum diuji di perangkat pada sesi ini, jadi setiap usulan menyertakan langkah feel check di berkas rencananya.

## Fakta hasil recon

1. Tidak ada library animasi terpasang: tidak ada Reanimated, gesture handler, maupun haptics.
2. Tidak ada pemakaian `Animated` atau `LayoutAnimation` di kode.
3. `src/theme.ts` hanya memuat colors, spacing, dan radius. Belum ada token gerak.
4. Ada 44 elemen `Pressable`. Tombol aksi utama siswa dan nav bawah belum punya pressed state.
5. Gerak yang sudah ada: `ModuleFormModal.tsx:78` dan `LessonFormModal.tsx:96` memakai `animationType="slide"`, `ConfirmDeleteModal.tsx:33` memakai `"fade"`, dan `ActivityIndicator` pada keadaan memuat.

## Peluang gerak yang lolos gate

| # | Lokasi | Sekarang | Tujuan | Frekuensi | Usulan gerak |
| --- | --- | --- | --- | --- | --- |
| 1 | `App.tsx:213` toast | Muncul dan hilang seketika di atas nav bawah (bottom: 96), tanpa transisi | Preventing a jarring change, Feedback | Occasional | Masuk dari tepi bawah: `translateY` 20 dengan opacity 0 ke 1, `motion.duration.base` (200ms), `motion.easing.out`. Keluar ke tepi yang sama: `motion.duration.fast` (160ms), kurva yang sama, lalu unmount setelah animasi keluar selesai. Timer 4 detik di `App.tsx:101` tetap. Reduced motion: hilangkan `translateY`, sisakan fade singkat |
| 2 | `App.tsx:231` kartu course, `App.tsx:240`, `245`, dan `253` tombol aksi, `App.tsx:254` nav bawah | Kartu turun ke opacity 0.8 seketika, jadi terbaca sebagai kedipan. Tombol aksi utama dan nav bawah tidak memberi respons sama sekali | Feedback | Puluhan kali per sesi | Kartu scale 0.98 dan tombol aksi scale 0.97 saat ditekan. Tekan: `motion.duration.press` (120ms). Lepas: `motion.duration.fast` (160ms). Kurva `motion.easing.out`, `useNativeDriver: true`. Nav bawah dan tombol ikon: cukup pressed state statis tanpa animasi. Reduced motion: lewati scale, sisakan perubahan opacity |
| 3 | `App.tsx:245` tombol Tandai selesai | Ikon dan label bertukar seketika; warna garis tombol berubah langsung | State indication | Sekali per materi | Ikon centang tumbuh dari scale 0.7 ke 1, `motion.duration.fast`, `motion.easing.out`, `useNativeDriver: true`. Label dibiarkan statis supaya teks tidak bergeser. Reduced motion: tukar ikon tanpa scale |
| 4 | `MentorCourseDetailScreen.tsx:133`, `183`, dan `210` | Daftar diganti hasil fetch baru, jadi baris baru muncul dan baris terhapus hilang seketika | Preventing a jarring change | Occasional, alat mentor | `LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)` sebelum perubahan state. Arsitektur baru sudah aktif (`newArchEnabled: true`), jadi tidak perlu flag Android lama. Lewati saat reduce motion aktif |
| 5 | `App.tsx:245` saat materi terakhir sebuah course | Tidak ada penanda khusus. Tombol hanya berubah jadi Lihat progres dan angka di halaman course jadi 100 persen | Delight, anggaran langka | Rare, sekali per course | Satu beat saja: ikon centang tumbuh sedikit lebih besar, scale 0.7 ke 1 dengan overshoot ringan, 260ms, dan label tombol jadi Course selesai. Tanpa konfeti. Reduced motion: cukup perubahan label |

Semua nilai kurva di tabel ini memakai kosakata gerak repo ini: `motion.easing.out` sama dengan `Easing.bezier(0.23, 1, 0.32, 1)`, yaitu kurva `ease-out` yang ditambahkan di rencana 001. Katalog skill menaruh kurva itu untuk elemen yang masuk maupun keluar, jadi toast keluar memakai kurva yang sama supaya jalurnya persis kebalikan jalur masuk.

## Kandidat yang ditolak

1. Perpindahan tab di nav bawah (`App.tsx:213` dan `254`). Gate frekuensi: navigasi inti, puluhan sampai ratusan kali per hari. Animasinya ditolak, dan respons seketika justru terasa paling cepat.
2. Penyaringan katalog saat mengetik (`App.tsx:222` dan `224`). Gate frekuensi: kartu berganti tiap ketikan. Geraknya akan berkedip dan menambah jeda pada aksi yang paling sering diulang.
3. Batang progres di laporan admin (`AdminReportScreen.tsx:114` sampai `119`). Gerak pada data fungsional yang dibaca admin. Animasi justru menghalangi pembacaan angka.
4. Perpindahan layar course ke lesson (`App.tsx:204` dan `205`). Aplikasi belum punya library navigasi. Crossfade per layar berarti menambah pembungkus di `App.tsx` plus jeda tetap di aksi yang paling sering diulang.
5. Modal yang sudah beranimasi. `ModuleFormModal.tsx:78`, `LessonFormModal.tsx:96`, dan `ConfirmDeleteModal.tsx:33` sudah punya gerak masuk. Kualitasnya ditinjau di rencana 005, bukan sebagai usulan baru.

## Putusan

Aplikasi ini butuh gerak yang sedikit. Sebagai alat belajar yang isinya daftar dan tombol, kondisi sekarang hampir benar, dan modal yang sudah beranimasi menunjukkan timnya sudah tahu caranya. Yang kurang dua: belum ada elemen yang bergerak selain modal, dan kontrol yang paling sering disentuh belum memberi respons. Saran dengan leverage paling besar adalah nomor 2, karena empat kontrol utama siswa belum bereaksi terhadap sentuhan, sementara perbaikannya hanya menyentuh satu berkas dan tidak perlu library baru. Nomor 1 menyusul karena toast adalah satu satunya saluran umpan balik saat gagal, dan sekarang muncul sebagai kejutan di tepi bawah layar.

Berkas rencana eksekusi ada di `docs/rencana-animasi/`.

Semua peluang di tabel atas sudah diterapkan. Dua peluang terakhir yang sempat ditahan, yaitu gerak daftar mentor dan penanda saat course selesai, juga sudah menyusul. Status terbarunya ada di `docs/rencana-animasi/README.md`.
