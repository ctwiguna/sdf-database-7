# 004 Umpan balik saat materi selesai

Status: DONE (mekanis)
Commit: f57fa9e
Tingkat: LOW
Kategori: State indication
Perkiraan lingkup: 1 berkas, sekitar 12 baris

## Masalah

Tombol Tandai selesai bertukar ikon dan label seketika. Ikonnya berubah dari centang kosong jadi centang penuh, tapi perubahannya tidak terbaca karena tidak ada beat yang menandai bahwa materi itu baru saja selesai. Siswa sering menekan tombol ini dan tidak yakin apakah tekanannya terbaca.

```tsx
// App.tsx:245, kondisi sekarang
<Pressable style={[styles.secondaryButton, completed && styles.completedButton]} onPress={onComplete}><Ionicons name={completed ? 'checkmark-circle' : 'checkmark-circle-outline'} size={20} color={completed ? colors.success : colors.textPrimary} /><Text style={styles.secondaryText}>{completed ? 'Materi selesai' : 'Tandai selesai'}</Text></Pressable>
```

## Sasaran

Ikon centang tumbuh sedikit saat statusnya berubah jadi selesai. Label dibiarkan statis supaya teksnya tidak bergeser dan tombolnya tidak berubah lebar.

```tsx
// App.tsx, tambahan di dalam komponen LessonPlayer
  const iconScale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (!completed) return;
    if (reduceMotion) {
      iconScale.setValue(1);
      return;
    }
    iconScale.setValue(0.7);
    Animated.timing(iconScale, {
      toValue: 1,
      duration: motion.duration.fast,
      easing: motion.easing.out,
      useNativeDriver: true,
    }).start();
  }, [completed, reduceMotion, iconScale]);
```

```tsx
// App.tsx:245, pengganti elemen ikon
<Animated.View style={{ transform: [{ scale: iconScale }] }}><Ionicons name={completed ? 'checkmark-circle' : 'checkmark-circle-outline'} size={20} color={completed ? colors.success : colors.textPrimary} /></Animated.View>
```

Skala awal 0.7 dipakai karena ikonnya kecil, jadi perubahan mutlaknya hanya beberapa piksel. Jangan turunkan lagi ke 0.5 atau lebih kecil, karena akan terbaca sebagai lompatan, bukan sebagai beat.

## Konvensi repo yang harus diikuti

1. Token gerak dibaca dari `src/theme.ts`, hasil rencana 001. Durasi yang dipakai adalah `motion.duration.fast`, yaitu 160ms.
2. Hook reduce motion dibaca dari `src/lib/useReduceMotion.ts`, hasil rencana 001.
3. Pola animasi satu nilai dengan `useRef` dan `Animated.timing` mengikuti pola yang dipakai di rencana 003.
4. Kalau rencana 002 sudah dikerjakan, tombol ini sudah memakai `PressableScale`. Elemen ikon tetap bisa dibungkus `Animated.View` seperti di atas, karena `PressableScale` menaruh anak anaknya di dalam elemen yang memikul gaya visualnya.

## Langkah

1. Pastikan rencana 002 sudah selesai dikerjakan lebih dulu, karena keduanya menyentuh baris yang sama.
2. Di `App.tsx`, pastikan `Animated` dan `useRef` sudah ada di daftar import. Tambahkan kalau belum.
3. Di dalam komponen `LessonPlayer` di `App.tsx:243`, tambahkan blok animasi dari sasaran di atas.
4. Bungkus elemen `Ionicons` di tombol Tandai selesai dengan `Animated.View` seperti pada blok pengganti.
5. Jangan ubah gaya tombol, warna ikon, atau teksnya.
6. Jalankan `npm run typecheck` dan `npm test`.

## Batas

1. Jangan ubah label tombol dan jangan ubah warnanya.
2. Jangan bungkus label teks dengan `Animated.View`. Hanya ikon yang dianimasikan, supaya lebarnya tidak berubah dan teks tidak bergeser.
3. Jangan beri animasi yang sama pada tombol Buka di YouTube di baris yang sama.
4. Jangan kerjakan bersamaan dengan rencana 002 oleh orang berbeda, karena keduanya menyentuh `App.tsx:245`.
5. Jangan tambah library animasi apa pun. Jangan pakai Reanimated.
6. Kalau ada langkah yang tidak cocok dengan kode yang ditemukan, berhenti dan laporkan.

## Verifikasi

1. Mekanis: `npm run typecheck` bersih dan `npm test` tetap 91 tes lulus.
2. Feel check di emulator atau perangkat:
   1. Buka satu materi yang belum selesai, lalu tekan Tandai selesai. Ikon harus tumbuh dari kecil ke penuh dalam waktu sekitar 160ms, dan labelnya tidak bergeser sedikit pun.
   2. Buka materi yang sudah selesai. Ikon harus langsung tampil penuh tanpa animasi, karena statusnya tidak baru berubah.
   3. Tekan tombolnya dua kali cepat. Animasi tidak boleh mengulang dari skala 0.7 saat status sudah selesai.
3. Uji reduce motion: aktifkan reduce motion, lalu tandai satu materi selesai. Ikon harus langsung tampil penuh tanpa tumbuh.
4. Selesai bila: ikon tumbuh sekali saat status berubah jadi selesai, label tidak bergeser, dan tes tetap lulus.
5. Catatan penerapan: ikon hanya tumbuh saat status materi berubah jadi selesai. Pemeriksaan status sebelumnya ditambahkan supaya membuka materi yang sudah selesai tidak memicu animasi, sesuai butir 2 di atas.
