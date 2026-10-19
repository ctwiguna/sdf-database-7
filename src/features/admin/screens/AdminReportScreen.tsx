import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { AdminCourseReportRow, AdminReportSummary } from '../types';
import { AdminRpcClient, fetchAdminCourseReport, friendlyAdminError, summarizeReport } from '../lib/admin';

type Props = {
  client: AdminRpcClient | null;
  onBack: () => void;
};

// Layar laporan admin: daftar course, ringkasan pendaftar, dan agregat progres per course.
// Seluruh angka datang dari satu pemanggilan RPC admin_course_report.
export function AdminReportScreen({ client, onBack }: Props) {
  const [rows, setRows] = useState<AdminCourseReportRow[]>([]);
  const [summary, setSummary] = useState<AdminReportSummary | null>(null);
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
      const next = await fetchAdminCourseReport(client);
      setRows(next);
      setSummary(summarizeReport(next));
    } catch (err) {
      setRows([]);
      setSummary(null);
      setError(err instanceof Error ? err.message : friendlyAdminError(err));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable accessibilityRole="button" accessibilityLabel="Kembali" style={styles.back} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        <Text style={styles.backText}>Kembali</Text>
      </Pressable>
      <Text style={styles.title}>Laporan course</Text>
      <Text style={styles.lead}>Daftar course, jumlah pendaftar, dan agregat progres tiap course.</Text>

      {loading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.textPrimary} />
          <Text style={styles.meta}>Memuat laporan...</Text>
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
          <Text style={styles.emptyTitle}>Belum ada course</Text>
          <Text style={styles.meta}>Laporan muncul setelah course dibuat.</Text>
        </View>
      ) : (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Ringkasan</Text>
            <View style={styles.statRow}>
              <Stat label="Course" value={String(summary?.totalCourses ?? 0)} />
              <Stat label="Peserta" value={String(summary?.totalParticipants ?? 0)} />
              <Stat label="Rerata progres" value={`${summary?.averageProgress ?? 0}%`} />
            </View>
            <Text style={styles.meta}>
              {summary?.totalCompleted ?? 0} peserta menyelesaikan seluruh materi.
            </Text>
          </View>
          <Text style={styles.sectionTitle}>Progres per course</Text>
          {rows.map((row) => (
            <ReportCard key={row.courseId} row={row} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

// Satu course: jumlah lesson, jumlah peserta, rerata progres, dan jumlah yang selesai penuh.
function ReportCard({ row }: { row: AdminCourseReportRow }) {
  const published = row.status === 'published';
  const percent = Math.min(Math.max(row.averageProgress, 0), 100);
  const width = `${percent}%` as `${number}%`;
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{row.courseTitle}</Text>
        <View style={[styles.badge, published ? styles.badgePublished : styles.badgeDraft]}>
          <Text style={[styles.badgeText, published ? styles.badgeTextPublished : styles.badgeTextDraft]}>
            {published ? 'Terbit' : 'Draf'}
          </Text>
        </View>
      </View>
      <Text style={styles.meta}>Mentor: {row.mentorName}</Text>
      <Text style={styles.body}>
        {row.totalParticipants} peserta terdaftar, {row.totalLessons} materi
      </Text>
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width }]} />
        </View>
        <Text style={styles.progressValue}>{row.averageProgress}%</Text>
      </View>
      <Text style={styles.meta}>
        Rerata progres peserta. {row.completedParticipants} peserta selesai penuh.
      </Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 110, gap: spacing.lg },
  back: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backText: { fontSize: 16, fontWeight: '500', color: colors.textPrimary },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '500', color: colors.textPrimary },
  lead: { fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  sectionTitle: { fontSize: 20, fontWeight: '500', color: colors.textPrimary },
  meta: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  body: { fontSize: 16, lineHeight: 22, color: colors.textPrimary },
  summaryCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.xl, gap: spacing.lg },
  statRow: { flexDirection: 'row', gap: spacing.md },
  stat: { flex: 1, backgroundColor: colors.surfaceSoft, borderRadius: radius.input, padding: spacing.lg, gap: spacing.xs },
  statValue: { fontSize: 22, fontWeight: '500', color: colors.textPrimary },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.xl, gap: spacing.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  cardTitle: { flex: 1, fontSize: 20, lineHeight: 28, fontWeight: '500', color: colors.textPrimary },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  badgePublished: { backgroundColor: colors.successSurface },
  badgeDraft: { backgroundColor: colors.surfaceSoft },
  badgeText: { fontSize: 12, fontWeight: '500' },
  badgeTextPublished: { color: colors.success },
  badgeTextDraft: { color: colors.textSecondary },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  progressTrack: { flex: 1, height: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceSoft, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: radius.pill, backgroundColor: colors.accent },
  progressValue: { fontSize: 16, fontWeight: '500', color: colors.action, minWidth: 56, textAlign: 'right' },
  stateCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  emptyTitle: { fontSize: 16, fontWeight: '500', color: colors.textPrimary },
  errorCard: { backgroundColor: colors.errorSurface, borderRadius: radius.card, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  errorText: { color: colors.error, fontSize: 14, textAlign: 'center' },
  retry: { minHeight: 48, minWidth: 120, borderRadius: radius.button, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  retryText: { color: colors.textPrimary, fontSize: 16, fontWeight: '500' },
});
