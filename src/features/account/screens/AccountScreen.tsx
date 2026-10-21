import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { validateCredentials } from '../../../lib/session';
import { CatalogSource } from '../../../lib/catalog';

type Props = {
  databaseReady: boolean;
  userEmail: string | null;
  dataSource: CatalogSource;
  notice: string | null;
  busy: boolean;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<boolean>;
  onSignOut: () => Promise<void>;
};

export function AccountScreen({ databaseReady, userEmail, dataSource, notice, busy, onSignIn, onSignUp, onSignOut }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (action: 'masuk' | 'daftar') => {
    const problem = validateCredentials(email, password);
    if (problem) {
      setError(problem);
      setInfo(null);
      return;
    }
    setError(null);
    setInfo(null);
    try {
      if (action === 'masuk') {
        await onSignIn(email, password);
        setInfo('Berhasil masuk.');
      } else {
        const signedIn = await onSignUp(email, password);
        setInfo(signedIn ? 'Akun dibuat dan kamu langsung masuk.' : 'Akun dibuat. Cek email untuk konfirmasi lalu masuk.');
      }
      setPassword('');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Terjadi error, coba lagi.');
    }
  };

  // Host ditampilkan supaya saat uji di HP langsung terlihat APK menunjuk ke server mana.
  const host = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/^https?:\/\//, '');
  const target = host ? ` (${host})` : '';

  const connectionText = () => {
    if (!databaseReady) return 'Mode demo lokal. Kredensial database belum diisi.';
    if (dataSource === 'database') return `Terhubung ke database Supabase${target}.`;
    return `Data contoh dipakai sementara${target}. ${notice ?? ''}`.trim();
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Akun</Text>

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>STATUS KONEKSI</Text>
        <Text style={styles.bodyText}>{connectionText()}</Text>
      </View>

      {!databaseReady && (
        <View style={styles.card}>
          <Text style={styles.bodyText}>
            Isi EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY di berkas .env lalu jalankan ulang aplikasi.
            Tanpa itu, aplikasi memakai data contoh lokal dan progres hanya bertahan selama aplikasi berjalan.
          </Text>
        </View>
      )}

      {databaseReady && !userEmail && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Masuk atau daftar</Text>
          <Text style={styles.bodyText}>Gunakan email. Pendaftaran baru otomatis berperan sebagai siswa.</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Kata sandi"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            style={styles.input}
          />
          {error && <Text style={styles.errorText}>{error}</Text>}
          {info && <Text style={styles.infoText}>{info}</Text>}
          <View style={styles.row}>
            <Pressable style={[styles.primaryButton, busy && styles.disabled]} disabled={busy} onPress={() => void submit('masuk')}>
              {busy ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryText}>Masuk</Text>}
            </Pressable>
            <Pressable style={[styles.secondaryButton, busy && styles.disabled]} disabled={busy} onPress={() => void submit('daftar')}>
              <Text style={styles.secondaryText}>Daftar</Text>
            </Pressable>
          </View>
        </View>
      )}

      {databaseReady && userEmail && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Masuk sebagai</Text>
          <Text style={styles.bodyText}>{userEmail}</Text>
          <Pressable style={[styles.secondaryButton, busy && styles.disabled]} disabled={busy} onPress={() => void onSignOut()}>
            <Ionicons name="log-out-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.secondaryText}>Keluar</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 110, gap: spacing.lg },
  sectionTitle: { fontSize: 20, fontWeight: '500', color: colors.textPrimary },
  sectionLabel: { fontSize: 12, fontWeight: '500', letterSpacing: 1.2, color: colors.textSecondary },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.xl, gap: spacing.md },
  cardTitle: { fontSize: 18, fontWeight: '500', color: colors.textPrimary },
  bodyText: { fontSize: 14, lineHeight: 21, color: colors.textSecondary },
  input: { backgroundColor: colors.surfaceSoft, borderRadius: radius.input, paddingHorizontal: spacing.lg, height: 50, color: colors.textPrimary, fontSize: 15 },
  row: { flexDirection: 'row', gap: spacing.md },
  primaryButton: { flex: 1, backgroundColor: colors.textPrimary, borderRadius: radius.button, height: 50, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.surface, fontWeight: '500', fontSize: 15 },
  secondaryButton: { flex: 1, backgroundColor: colors.surfaceSoft, borderRadius: radius.button, height: 50, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm },
  secondaryText: { color: colors.textPrimary, fontWeight: '500', fontSize: 15 },
  disabled: { opacity: 0.6 },
  errorText: { color: colors.error, fontSize: 13 },
  infoText: { color: colors.success, fontSize: 13 },
});
