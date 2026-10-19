# 001 Prasarana gerak: token dan hook reduce motion

Status: TODO
Commit: f57fa9e
Tingkat: LOW
Kategori: Cohesion & tokens
Perkiraan lingkup: 1 berkas lama diubah, 1 berkas baru

## Masalah

`src/theme.ts` belum punya token gerak. Empat rencana lain memakai durasi dan kurva yang sama, jadi tanpa token tiap berkas akan menulis angkanya sendiri dan nilainya bisa melenceng sedikit antar komponen. Katalog skill menyebut kasus itu sebagai temuan konsolidasi: beberapa kurva yang hampir sama tapi tidak sama.

Aplikasi juga belum punya cara membaca setelan reduce motion. React Native di proyek ini tidak menyediakan hook bawaan untuk itu, yang tersedia hanya `AccessibilityInfo.isReduceMotionEnabled()`.

```ts
// src/theme.ts, kondisi sekarang
export const colors = { ... };
export const spacing = { ... };
export const radius = { ... };
```

## Sasaran

Dua tambahan berikut dipakai di seluruh rencana lain. Nilainya harus persis.

```ts
// src/theme.ts, tambahan
import { Easing } from 'react-native';

export const motion = {
  duration: {
    press: 120, // umpan balik saat kontrol ditekan
    fast: 160,  // pelepasan tekan, keluar toast, keluar modal
    base: 200,  // masuk toast, masuk kartu modal
  },
  easing: {
    out: Easing.bezier(0.23, 1, 0.32, 1),
  },
} as const;
```

Kurva `Easing.bezier(0.23, 1, 0.32, 1)` adalah kurva `ease-out` yang dipakai di semua rencana. Jangan menggantinya dengan `Easing.out(Easing.quad)` atau easing bawaan lain, karena kurva bawaan terlalu lemah untuk gerak yang disengaja.

```ts
// src/lib/useReduceMotion.ts, berkas baru
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      if (active) setReduceMotion(enabled);
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
```

## Konvensi repo yang harus diikuti

1. Token desain tinggal di `src/theme.ts` dan diimpor dengan pola yang sudah ada, contoh `import { colors, radius, spacing } from '../../../theme';` di `src/features/mentor/components/ConfirmDeleteModal.tsx:11`.
2. Berkas di `src/lib/` memuat logika bersama, contoh `src/lib/session.ts` dan `src/lib/course.ts`. Hook ini ikut pola itu.
3. Komponen dan berkas lain hanya membaca token. Jangan menulis angka durasi langsung di komponen.

## Langkah

1. Buka `src/theme.ts`. Tambahkan `import { Easing } from 'react-native';` di bagian import.
2. Tambahkan ekspor `motion` persis seperti blok di atas, di bawah `radius`.
3. Buat berkas baru `src/lib/useReduceMotion.ts` dengan isi persis seperti blok di atas.
4. Jalankan `npm run typecheck` dan `npm test`.
5. Tidak ada perubahan tampilan di langkah ini. Kalau ada tampilan yang berubah, ada yang salah dan perubahan itu harus dibatalkan.

## Batas

1. Jangan sentuh komponen mana pun. Rencana ini hanya menambah token dan satu hook.
2. Jangan tambah library animasi apa pun. Semua rencana di folder ini memakai `Animated` bawaan React Native.
3. Jangan ubah nama ekspor yang sudah ada seperti `colors`, `spacing`, atau `radius`.
4. Jangan pakai `useReducedMotion`, karena React Native di proyek ini tidak mengekspornya. Pakai hook di atas.
5. Kalau isi `src/theme.ts` sudah berbeda dari kutipan di atas, berhenti dan laporkan.

## Verifikasi

1. Mekanis: `npm run typecheck` bersih.
2. Mekanis: `npm test` tetap 91 tes lulus.
3. Mekanis: `grep -rn "Easing.bezier" src/theme.ts` menemukan tepat satu baris.
4. Selesai bila: `motion` dan `useReduceMotion` bisa diimpor dari berkas lain, dan seluruh berkas lain masih lolos typecheck.
