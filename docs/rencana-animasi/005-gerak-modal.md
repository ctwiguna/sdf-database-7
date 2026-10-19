# 005 Gerak modal yang sesuai posisi

Status: TODO
Commit: f57fa9e
Tingkat: MEDIUM
Kategori: Physicality & origin
Perkiraan lingkup: 1 berkas baru, 3 berkas yang diubah

## Masalah

Ketiga modal di aplikasi ini adalah kartu yang muncul di tengah layar, tapi dua di antaranya dianimasikan seolah olah naik dari tepi bawah layar. Kartu yang muncul di tengah tidak datang dari bawah, jadi geraknya bercerita arah yang salah. Modal ketiga memudar tanpa perubahan bentuk sama sekali.

```tsx
// ModuleFormModal.tsx:78, kartu tengah, tapi gerak masuknya slide dari bawah
<Modal visible={visible} transparent animationType="slide">

// LessonFormModal.tsx:96, sama
<Modal visible={visible} transparent animationType="slide">

// ConfirmDeleteModal.tsx:33, kartu tengah, memudar tanpa perubahan bentuk
<Modal visible={visible} transparent animationType="fade">
```

```tsx
// ModuleFormModal.tsx:167 sampai 181, ketiga berkas memakai pola backdrop yang sama
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
```

Dua masalah lain ikut di sini. Pertama, animasi bawaan `Modal` tidak bisa diatur durasi dan kurvanya. Kedua, animasi bawaan itu tidak membaca setelan reduce motion, jadi pengguna yang mematikan gerak tetap melihat kartunya meluncur dari bawah.

## Sasaran

Semua modal memakai `animationType="none"` dan menggerakkan isinya sendiri. Latar gelap memudar dari 0 ke 1 dalam 200ms, dan kartunya ikut memudar sambil tumbuh dari scale 0.96 ke 1. Karena kartu berada di dalam latar gelap, satu nilai `progress` menggerakkan keduanya tanpa pemudaran ganda.

```ts
// src/lib/useDialogTransition.ts, berkas baru
import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { motion } from '../theme';

export function useDialogTransition(visible: boolean) {
  const [rendered, setRendered] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: motion.duration.base,
        easing: motion.easing.out,
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.timing(progress, {
      toValue: 0,
      duration: motion.duration.fast,
      easing: motion.easing.out,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setRendered(false);
    });
  }, [visible, progress]);

  return { rendered, progress };
}
```

Nilai `rendered` dipakai sebagai pengganti `visible` di prop `Modal`, supaya modalnya tetap terpasang selama animasi keluar berjalan. Tanpa itu, modalnya dilepas lebih dulu dan animasi keluarnya tidak terlihat.

```tsx
// ketiga berkas modal, pola pemakaian
  const { rendered, progress } = useDialogTransition(visible);
  const reduceMotion = useReduceMotion();
  const cardScale = reduceMotion ? null : { transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] };
```

```tsx
// ketiga berkas modal, pengganti pembuka Modal
  <Modal visible={rendered} transparent animationType="none">
    <Animated.View style={[styles.backdrop, { opacity: progress }]}>
      <Animated.View style={[styles.card, cardScale]}>
```

## Konvensi repo yang harus diikuti

1. Token gerak dibaca dari `src/theme.ts`, hasil rencana 001: `motion.duration.base` (200ms) untuk masuk dan `motion.duration.fast` (160ms) untuk keluar. Durasi modal masuk dan keluar boleh lebih panjang dari gerak tekan, karena modal termasuk golongan occasional.
2. Hook reduce motion dibaca dari `src/lib/useReduceMotion.ts`, hasil rencana 001.
3. Ketiga modal sudah memakai pola gaya yang sama: `backdrop` dengan latar `rgba(0, 0, 0, 0.5)` dan `card` dengan `borderRadius: radius.card`. Pertahankan nilainya.
4. Contoh modal yang sudah punya gerak masuk ada di `src/features/mentor/components/ConfirmDeleteModal.tsx:33`.

## Langkah

1. Buat berkas baru `src/lib/useDialogTransition.ts` dengan isi persis seperti blok di atas.
2. Di `src/features/mentor/components/ModuleFormModal.tsx`, ubah `Modal` di baris 78: hapus `animationType="slide"`, ganti jadi `animationType="none"`, dan ganti prop `visible={visible}` jadi `visible={rendered}`. Bungkus `styles.backdrop` dengan `Animated.View` beropasitas `progress`, dan bungkus `styles.card` dengan `Animated.View` bergaya `cardScale`.
3. Kerjakan hal yang sama di `src/features/mentor/components/LessonFormModal.tsx` pada baris 96. Prop `visible` di berkas itu juga memakai nama `visible`.
4. Kerjakan hal yang sama di `src/features/mentor/components/ConfirmDeleteModal.tsx` pada baris 33. Prop `visible` di berkas itu juga memakai nama `visible`.
5. Pastikan ketiga berkas mengimpor `useDialogTransition` dan `useReduceMotion`, dan `Animated` sudah masuk daftar import dari `react-native`.
6. Jalankan `npm run typecheck` dan `npm test`.

## Batas

1. Jangan ubah isi form, tombol, dan teks di dalam modal.
2. Jangan ubah nilai gaya `backdrop` dan `card`: warna latar, radius, padding, dan lebar maksimum harus tetap sama.
3. Jangan tambah `onRequestClose`. Perilaku tombol kembali Android di luar lingkup rencana ini.
4. Jangan ubah `Modal` lain di luar ketiga berkas ini. Layar lain tidak memakai `Modal`.
5. Jangan tambah library animasi apa pun. Jangan pakai Reanimated.
6. Kalau ada langkah yang tidak cocok dengan kode yang ditemukan, berhenti dan laporkan.

## Verifikasi

1. Mekanis: `npm run typecheck` bersih dan `npm test` tetap 91 tes lulus.
2. Feel check di emulator atau perangkat:
   1. Masuk sebagai mentor, buka satu course, lalu buka form Tambah Modul. Kartunya harus memudar dan tumbuh dari tengah. Kartu tidak boleh lagi meluncur naik dari tepi bawah layar.
   2. Latar gelap harus memudar masuk bersamaan, tanpa muncul seketika.
   3. Tutup modal dengan tombol Batal. Latar dan kartu harus memudar keluar dengan arah yang sama seperti masuk, dan modalnya baru hilang setelah animasi selesai.
   4. Ulangi untuk form Tambah Materi dan untuk konfirmasi hapus.
   5. Buka dan tutup modal berulang kali dengan cepat. Tidak boleh ada sisa kartu yang tertinggal di layar.
3. Uji reduce motion: aktifkan reduce motion, lalu buka modal. Kartu tidak boleh tumbuh. Latar dan kartu harus tetap memudar masuk.
4. Selesai bila: ketiga modal muncul dari tengah dengan gerak yang sama, jalur keluarnya kebalikan jalur masuk, dan tidak ada sisa elemen setelah modal ditutup.
