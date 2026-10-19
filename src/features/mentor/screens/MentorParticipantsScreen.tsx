import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { friendlyErrorMessage } from '../lib/mentor';
import { fetchMentorReport, MentorReportRow, MentorRpcClient } from '../lib/report';
import { MentorCourse } from '../types';

type Props = {
  client: MentorRpcClient | null;
  course: MentorCourse;
  onBack: () => void;
};

export function MentorParticipantsScreen({ client, course, onBack }: Props) {
  const [rows, setRows] = useState<MentorReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!client) {
      setLoading(false);
      setError('Koneksi database belum diatur. Isi berkas .env dulu.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setRows(await fetchMentorReport(client, course.id));
    } catch (err) {
      setRows([]);
      setError(friendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [client, course.id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable accessibilityRole="button" accessibilityLabel="Kembali" style={styles.back} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        <Text style={styles.backText}>Kembali</Text>
      </Pressable>
      <Text style={styles.title}>Peserta</Text>
      <Text style={styles.meta}>{course.title}</Text>

      {loading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.textPrimary} />
          <Text style={styles.meta}>Memuat peserta...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable accessibilityRole="button" style={styles.retry} onPress={() => void load()}>
            <Text style={styles.retryText}>Coba lagi</Text>
          </Pressable>
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.stateCard}>
          <Text style={styles.emptyTitle}>Belum ada peserta</Text>
          <Text style={styles.meta}>Peserta muncul setelah siswa mendaftar pada course ini.</Text>
        </View>
      ) : (
        rows.map((row) => (
          <View key={row.enrollmentId} style={styles.card}>
            <Text style={styles.name}>{row.studentName}</Text>
            <Text style={styles.body}>
              {row.completedLessons} dari {row.totalLessons} materi ({row.progressPercent}%)
            </Text>
            <Text style={[styles.status, row.isCompleted && styles.done]}>
              {row.isCompleted ? 'Course selesai' : 'Belum selesai'}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 110, gap: spacing.lg },
  back: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backText: { fontSize: 16, fontWeight: '500', color: colors.textPrimary },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '500', color: colors.textPrimary },
  meta: { fontSize: 14, lineHeight: 20, color: colors.textSecondary, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.xl, gap: spacing.sm },
  name: { fontSize: 20, lineHeight: 28, fontWeight: '500', color: colors.textPrimary },
  body: { fontSize: 16, lineHeight: 22, color: colors.textPrimary },
  status: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  done: { color: colors.success },
  stateCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  emptyTitle: { fontSize: 16, fontWeight: '500', color: colors.textPrimary },
  errorCard: { backgroundColor: colors.errorSurface, borderRadius: radius.card, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  errorText: { color: colors.error, fontSize: 14, textAlign: 'center' },
  retry: { minHeight: 48, minWidth: 120, borderRadius: radius.button, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  retryText: { color: colors.textPrimary, fontSize: 16, fontWeight: '500' },
});
