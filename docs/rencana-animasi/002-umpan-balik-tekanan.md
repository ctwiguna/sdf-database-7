# 002 Umpan balik tekanan pada tombol dan kartu

Status: TODO
Commit: f57fa9e
Tingkat: MEDIUM
Kategori: Physicality & origin
Perkiraan lingkup: 1 berkas baru, 1 berkas yang diubah di lima titik

## Masalah

Empat kontrol utama siswa belum memberi respons saat ditekan. Di layar sentuh, kontrol yang tidak bereaksi terhadap sentuhan terbaca sebagai aplikasi yang lambat atau tidak mendengar.

```tsx
// App.tsx:240, kondisi sekarang, tanpa pressed state
<Pressable style={styles.primaryButton} onPress={onStart}>

// App.tsx:245, kondisi sekarang, tanpa pressed state
<Pressable style={[styles.secondaryButton, completed && styles.completedButton]} onPress={onComplete}>
<Pressable style={styles.secondaryButton} onPress={() => Linking.openURL(youtubeUrl)}>
<Pressable style={styles.primaryButton} onPress={onNext}>

// App.tsx:253, kondisi sekarang, tanpa pressed state
function BackButton({ onPress }: { onPress: () => void }) { return <Pressable onPress={onPress} style={styles.back}>
```

Kartu course sudah punya respons, tapi caranya kurang tepat. `App.tsx:231` menurunkan opacity ke 0.8 seketika, dan karena kartu memakai warna pastel sebagai latar, perubahannya terbaca sebagai kedipan, bukan sebagai tekanan.

```tsx
// App.tsx:231 dan 257, kondisi sekarang
<Pressable onPress={onPress} style={({ pressed }) => [styles.courseCard, { backgroundColor: course.color }, pressed && styles.pressed]}>
...
pressed: { opacity: 0.8 },
```

Nav bawah sengaja tidak diberi animasi karena frekuensinya paling tinggi. Untuk itu cukup pressed state statis supaya sentuhan tetap terasa.

## Sasaran

Kartu turun ke scale 0.98 dan tombol turun ke scale 0.97 saat ditekan, lalu kembali dalam 160ms. Yang bergerak hanya `transform` dan `opacity`, jadi tetap ringan. Tekanan terasa seketika karena durasi tekannya hanya 120ms.

```tsx
// src/components/PressableScale.tsx, berkas baru
import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { motion } from '../theme';
import { useReduceMotion } from '../lib/useReduceMotion';

type Props = PressableProps & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  dimTo?: number;
  children: React.ReactNode;
};

export function PressableScale({ scaleTo = 0.97, dimTo = 0.94, style, children, ...rest }: Props) {
  const pressed = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();

  const handlePressIn = () => {
    Animated.timing(pressed, {
      toValue: 1,
      duration: motion.duration.press,
      easing: motion.easing.out,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(pressed, {
      toValue: 0,
      duration: motion.duration.fast,
      easing: motion.easing.out,
      useNativeDriver: true,
    }).start();
  };

  const scale = pressed.interpolate({ inputRange: [0, 1], outputRange: [1, reduceMotion ? 1 : scaleTo] });
  const opacity = pressed.interpolate({ inputRange: [0, 1], outputRange: [1, dimTo] });

  return (
    <Animated.View style={[style, { opacity, transform: [{ scale }] }]}>
      {children}
      <Pressable style={StyleSheet.absoluteFill} onPressIn={handlePressIn} onPressOut={handlePressOut} {...rest} />
    </Animated.View>
  );
}
```

Cara kerja komponen ini: gaya visual yang lama tetap dipakai apa adanya di `Animated.View`, jadi tinggi, warna, dan tata letak tidak berubah. `Pressable` dipasang sebagai lapisan bening yang menutupi seluruh elemen, jadi sentuhan di mana pun tetap terbaca. Karena yang dianimasikan adalah elemen yang memikul gaya visualnya, latar tombol ikut menyusut bersama teksnya.

## Konvensi repo yang harus diikuti

1. Token gerak dibaca dari `src/theme.ts`, contoh `motion.duration.press`. Jangan tulis angka durasi langsung di komponen.
2. Hook reduce motion dibaca dari `src/lib/useReduceMotion.ts`, hasil rencana 001.
3. Pola komponen bersama memakai folder `src/components/`, yang belum ada di repo ini dan perlu dibuat.

## Langkah

1. Buat folder `src/components/` kalau belum ada, lalu buat berkas `src/components/PressableScale.tsx` dengan isi persis seperti blok di atas.
2. Di `App.tsx`, tambahkan import `import { PressableScale } from './src/components/PressableScale';`.
3. Ubah `App.tsx:231` menjadi:

```tsx
  return <PressableScale onPress={onPress} scaleTo={0.98} style={[styles.courseCard, { backgroundColor: course.color }]}>
```

Lalu hapus `pressed && styles.pressed` dari baris itu, dan hapus baris `pressed: { opacity: 0.8 },` di `App.tsx:257` karena sudah tidak dipakai siapa pun.

4. Ubah ketiga tombol di `App.tsx:240` dan `App.tsx:245` dari `Pressable` menjadi `PressableScale`, dengan gaya yang sama seperti sekarang. Tidak ada nilai gaya yang berubah.
5. Ubah `BackButton` di `App.tsx:253` menjadi `PressableScale` dengan gaya `styles.back` yang sama.
6. Di `App.tsx:254`, `NavItem` tetap memakai `Pressable`, tapi beri pressed state statis:

```tsx
function NavItem({ icon, label, active, onPress }: ...) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.navItem, pressed && styles.navPressed]}>...
```

Tambahkan `navPressed: { opacity: 0.6 },` di blok `StyleSheet.create` pada `App.tsx`.

7. Jalankan `npm run typecheck` dan `npm test`.

## Batas

1. Jangan sentuh `src/features/mentor/components/LessonItem.tsx`, `ModuleItem.tsx`, dan berkas di `src/features/admin/`. Tombol ikon di sana masuk pekerjaan terpisah.
2. Jangan ubah nilai gaya yang ada: warna, tinggi, radius, dan padding tombol harus tetap sama persis.
3. Jangan tambah library animasi apa pun. Komponen ini memakai `Animated` bawaan React Native. Jangan pakai Reanimated.
4. Jangan beri animasi pada `NavItem`. Frekuensinya paling tinggi dan animasi di sana justru memperlambat.
5. Kalau `PressableScale` tidak meneruskan `onPressIn` dan `onPressOut` milik pemanggil, itu disengaja. Pemakaian di rencana ini tidak memerlukannya.
6. Kalau ada langkah yang tidak cocok dengan kode yang ditemukan, berhenti dan laporkan.

## Verifikasi

1. Mekanis: `npm run typecheck` bersih dan `npm test` tetap 91 tes lulus.
2. Feel check di emulator atau perangkat:
   1. Tekan dan tahan tombol Daftar course. Seluruh tombol, termasuk latarnya, harus menyusut sedikit, bukan hanya teksnya.
   2. Tekan dan tahan kartu course di katalog. Kartu harus menyusut halus, tidak berkedip seperti sebelumnya.
   3. Lepas tekanan. Elemen harus kembali dalam waktu sekitar 160ms tanpa lompatan.
   4. Tekan berulang kali dengan cepat. Elemen harus mengikuti jari tanpa mengulang animasi dari nol.
   5. Pastikan tata letak tidak bergeser saat elemen diam. Kalau ada tombol yang tiba tiba menyempit atau tingginya berubah, hentikan dan laporkan.
3. Uji reduce motion: aktifkan reduce motion di setelan perangkat, lalu tekan tombol. Gerakan menyusut harus hilang, tapi peredupan tetap ada.
4. Selesai bila: keempat kontrol dan kartu memberi respons tekanan, tata letak tidak berubah saat diam, dan tes tetap lulus.
