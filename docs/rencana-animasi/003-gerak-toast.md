# 003 Gerak masuk dan keluar toast

Status: DONE (mekanis)
Commit: f57fa9e
Tingkat: MEDIUM
Kategori: Missed opportunities, preventing a jarring change
Perkiraan lingkup: 1 berkas, sekitar 20 baris

## Masalah

Toast adalah satu satunya saluran umpan balik saat pendaftaran atau penyimpanan progres gagal. Sekarang toast muncul dan hilang seketika di atas nav bawah, jadi isinya terbaca sebagai kejutan dan mudah terlewat.

```tsx
// App.tsx:101 sampai 105, kondisi sekarang, timer tanpa animasi
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
```

```tsx
// App.tsx:213, kondisi sekarang, muncul dan hilang seketika
      {toast && <View style={toastStyles.toast}><Ionicons name="alert-circle-outline" size={18} color={colors.textPrimary} /><Text style={toastStyles.toastText}>{toast}</Text></View>}
```

```tsx
// App.tsx:260 sampai 265, gaya toast, posisinya di atas nav bawah
const toastStyles = StyleSheet.create({
  toast: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: 96, ... },
```

Toast ini tidak punya tombol tutup, jadi satu satunya jalan keluar adalah timer 4 detik. Itu sebabnya animasi keluar harus dijalankan sebelum elemen dilepas dari pohon tampilan.

## Sasaran

Toast naik dari tepi bawah dan turun kembali ke tepi yang sama. Satu nilai `Animated.Value` menggerakkan opacity dan `translateY` sekaligus, jadi jalur masuk dan jalur keluar persis berlawanan.

```tsx
// App.tsx, tambahan di dalam komponen App
  const toastProgress = useRef(new Animated.Value(0)).current;
  const reduceMotion = useReduceMotion();
  const toastTranslate = toastProgress.interpolate({ inputRange: [0, 1], outputRange: [reduceMotion ? 0 : 20, 0] });
```

```tsx
// App.tsx:101 sampai 105, pengganti timer lama
  useEffect(() => {
    if (!toast) return;
    Animated.timing(toastProgress, {
      toValue: 1,
      duration: motion.duration.base,
      easing: motion.easing.out,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => {
      Animated.timing(toastProgress, {
        toValue: 0,
        duration: motion.duration.fast,
        easing: motion.easing.out,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setToast(null);
      });
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, toastProgress]);
```

```tsx
// App.tsx:213, pengganti elemen toast
      {toast && <Animated.View style={[toastStyles.toast, { opacity: toastProgress, transform: [{ translateY: toastTranslate }] }]}><Ionicons name="alert-circle-outline" size={18} color={colors.textPrimary} /><Text style={toastStyles.toastText}>{toast}</Text></Animated.View>}
```

Nilai `20` adalah jarak naik dalam piksel. Toast duduk di `bottom: 96`, jadi jarak itu membuatnya muncul dari arah nav bawah. Jangan memakai `translateY` persen, karena persen dihitung dari tinggi elemen yang isinya berubah ubah mengikuti panjang pesan.

## Konvensi repo yang harus diikuti

1. Token gerak dibaca dari `src/theme.ts`, hasil rencana 001: `motion.duration.base`, `motion.duration.fast`, dan `motion.easing.out`.
2. Hook reduce motion dibaca dari `src/lib/useReduceMotion.ts`, hasil rencana 001.
3. Timer toast sekarang ada di `App.tsx:101`. Jangan pindahkan ke tempat lain dan jangan ubah nilainya.
4. `toastStyles.toast` di `App.tsx:261` tidak perlu diubah. Semua nilai geraknya dipasang lewat prop `style` tambahan di `Animated.View`.

## Langkah

1. Di `App.tsx`, tambahkan `Animated` ke daftar import dari `react-native`, dan `useRef` ke daftar import dari `react`.
2. Tambahkan import `import { motion } from './src/theme';` dan `import { useReduceMotion } from './src/lib/useReduceMotion';`.
3. Di dalam komponen `App`, tambahkan tiga baris dari blok pertama di atas, di dekat deklarasi state toast.
4. Ganti isi `useEffect` di `App.tsx:101` dengan blok pengganti di atas. Ketiga nilai `duration` dan `easing` harus persis seperti itu.
5. Ganti elemen toast di `App.tsx:213` dengan blok pengganti di atas.
6. Jalankan `npm run typecheck` dan `npm test`.

## Batas

1. Jangan ubah teks pesan toast, warnanya, posisinya, dan durasi tampilnya.
2. Jangan pakai `LayoutAnimation` di rencana ini. Gerak toast harus bisa dibalik di tengah jalan, dan `Animated` melakukannya sementara `LayoutAnimation` mengulang dari nol.
3. Jangan sentuh banner fallback di `App.tsx:221` dan `toastStyles.banner`. Banner itu tampil sekali saat katalog jatuh ke data contoh, bukan elemen yang muncul dan hilang cepat.
4. Jangan tambah library animasi apa pun. Jangan pakai Reanimated.
5. Kalau ada langkah yang tidak cocok dengan kode yang ditemukan, berhenti dan laporkan.

## Verifikasi

1. Mekanis: `npm run typecheck` bersih dan `npm test` tetap 91 tes lulus.
2. Feel check di emulator atau perangkat:
   1. Keluar dari akun, buka satu course, lalu tekan Daftar course. Toast harus naik dari arah nav bawah dan tidak muncul sebagai kejutan.
   2. Diamkan 4 detik. Toast harus turun kembali ke arah yang sama sebelum hilang, bukan memudar di tempat.
   3. Munculkan toast kedua saat toast pertama masih tampil. Toast tidak boleh melompat atau mengulang animasi dari nol.
   4. Rekam layar lalu tonton pelan pelan. Jalur masuk dan jalur keluar harus terlihat sebagai kebalikan satu sama lain.
3. Uji reduce motion: aktifkan reduce motion, lalu munculkan toast. Naiknya harus hilang, tapi memudarnya harus tetap ada dan pesannya tetap terbaca.
4. Selesai bila: toast tidak pernah muncul atau hilang seketika, dan elemennya baru dilepas dari tampilan setelah animasi keluar selesai.
