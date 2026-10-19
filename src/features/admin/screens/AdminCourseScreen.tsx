import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { AdminCourseRow, DraftCourseInput, MentorOption } from '../types';
import {
  AdminClient,
  fetchAdminCourses,
  fetchMentorOptions,
  friendlyAdminError,
  publishCourse,
  saveDraftCourse,
  validateDraftCourseInput,
} from '../lib/admin';

type Props = {
  client: AdminClient | null;
  onBack: () => void;
};

// Isian formulir kosong dipakai saat admin menekan tombol buat course baru.
const EMPTY_FORM = {
  title: '',
  description: '',
  category: '',
  capacity: '10',
  mentorId: null as string | null,
};

// Layar kelola course admin: buat draf, pasang mentor, atur kapasitas, lalu terbitkan.
// Penerbitan memakai RPC publish_course; sisanya memakai tabel courses dengan kebijakan RLS admin.
export function AdminCourseScreen({ client, onBack }: Props) {
  const [rows, setRows] = useState<AdminCourseRow[]>([]);
  const [mentors, setMentors] = useState<MentorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!client) {
      setLoading(false);
      setError('Koneksi database belum diatur. Isi berkas .env dulu.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [courses, options] = await Promise.all([
        fetchAdminCourses(client),
        fetchMentorOptions(client),
      ]);
      setRows(courses);
      setMentors(options);
    } catch (err) {
      setRows([]);
      setMentors([]);
      setError(err instanceof Error ? err.message : friendlyAdminError(err));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setFormOpen(false);
    setConfirmId(null);
  };

  const startCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setNotice(null);
    setError(null);
    setFormOpen(true);
  };

  const startEdit = (row: AdminCourseRow) => {
    setForm({
      title: row.title,
      description: row.description,
      category: row.category,
      capacity: String(row.capacity),
      mentorId: row.mentorId,
    });
    setEditingId(row.courseId);
    setNotice(null);
    setError(null);
    setConfirmId(null);
    setFormOpen(true);
  };

  const buildInput = (): DraftCourseInput | null => {
    const capacity = Number.parseInt(form.capacity, 10);
    const input: DraftCourseInput = {
      title: form.title,
      description: form.description,
      category: form.category,
      capacity: Number.isFinite(capacity) ? capacity : 0,
      mentorId: form.mentorId,
    };
    const problem = validateDraftCourseInput(input);
    if (problem) {
      setError(problem);
      return null;
    }
    return input;
  };

  const submitForm = async () => {
    if (!client) return;
    const input = buildInput();
    if (!input) return;

    setBusy(true);
    setError(null);
    try {
      await saveDraftCourse(client, input, editingId);
      setNotice(editingId ? 'Perubahan draf tersimpan.' : 'Draf course baru dibuat.');
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : friendlyAdminError(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmPublish = async (courseId: string) => {
    if (!client) return;
    setBusy(true);
    setError(null);
    try {
      await publishCourse(client, courseId);
      setNotice('Course berhasil diterbitkan.');
      setConfirmId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : friendlyAdminError(err));
      setConfirmId(null);
    } finally {
      setBusy(false);
    }
  };

  if (!client) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.centerTitle}>Koneksi database belum siap</Text>
        <Text style={styles.centerText}>
          Isi kredensial Supabase di berkas .env sebelum mengelola course.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable accessibilityRole="button" accessibilityLabel="Kembali" style={styles.back} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        <Text style={styles.backText}>Kembali</Text>
      </Pressable>
      <Text style={styles.title}>Kelola course</Text>
      <Text style={styles.lead}>
        Buat draf course, pasang mentor, atur kapasitas, lalu terbitkan supaya muncul di katalog siswa.
      </Text>

      <Pressable
        accessibilityRole="button"
        style={styles.primaryButton}
        onPress={startCreate}
        disabled={busy}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.surface} />
        <Text style={styles.primaryButtonText}>Buat draf course</Text>
      </Pressable>

      {notice ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {formOpen ? (
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>{editingId ? 'Ubah draf course' : 'Draf course baru'}</Text>

          <Field label="Judul">
            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(value) => setForm((prev) => ({ ...prev, title: value }))}
              placeholder="Contoh: Dasar Sistem Solar Panel"
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel="Judul course"
            />
          </Field>

          <Field label="Deskripsi">
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={form.description}
              onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
              placeholder="Ringkasan singkat isi course"
              placeholderTextColor={colors.textSecondary}
              multiline
              accessibilityLabel="Deskripsi course"
            />
          </Field>

          <Field label="Kategori">
            <TextInput
              style={styles.input}
              value={form.category}
              onChangeText={(value) => setForm((prev) => ({ ...prev, category: value }))}
              placeholder="Contoh: Energi"
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel="Kategori course"
            />
          </Field>

          <Field label="Kapasitas">
            <TextInput
              style={styles.input}
              value={form.capacity}
              onChangeText={(value) => setForm((prev) => ({ ...prev, capacity: value }))}
              keyboardType="number-pad"
              placeholder="Contoh: 30"
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel="Kapasitas course"
            />
          </Field>

          <Field label="Mentor">
            <View style={styles.mentorList}>
              <MentorChoice
                label="Belum ada mentor"
                active={form.mentorId === null}
                onPress={() => setForm((prev) => ({ ...prev, mentorId: null }))}
              />
              {mentors.map((mentor) => (
                <MentorChoice
                  key={mentor.id}
                  label={mentor.displayName}
                  active={form.mentorId === mentor.id}
                  onPress={() => setForm((prev) => ({ ...prev, mentorId: mentor.id }))}
                />
              ))}
            </View>
          </Field>

          <View style={styles.formActions}>
            <Pressable
              accessibilityRole="button"
              style={[styles.secondaryButton, busy && styles.buttonDisabled]}
              onPress={resetForm}
              disabled={busy}
            >
              <Text style={styles.secondaryButtonText}>Batal</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={[styles.primaryButton, styles.formSubmit, busy && styles.buttonDisabled]}
              onPress={() => void submitForm()}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.primaryButtonText}>{editingId ? 'Simpan perubahan' : 'Simpan draf'}</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.textPrimary} />
          <Text style={styles.meta}>Memuat course...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Daftar course</Text>
          {rows.length === 0 ? (
            <View style={styles.stateCard}>
              <Text style={styles.emptyTitle}>Belum ada course</Text>
              <Text style={styles.meta}>Course pertama dibuat lewat tombol di atas.</Text>
            </View>
          ) : (
            rows.map((row) => (
              <CourseCard
                key={row.courseId}
                row={row}
                busy={busy}
                confirming={confirmId === row.courseId}
                onEdit={() => startEdit(row)}
                onAskPublish={() => setConfirmId(row.courseId)}
                onCancelPublish={() => setConfirmId(null)}
                onConfirmPublish={() => void confirmPublish(row.courseId)}
              />
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

// Satu baris course: status, mentor, kapasitas, jumlah materi, dan aksi yang tersedia.
// Aksi ubah dan terbitkan hanya muncul pada course berstatus draf karena database menolak
// perubahan pada course yang sudah terbit.
function CourseCard({
  row,
  busy,
  confirming,
  onEdit,
  onAskPublish,
  onCancelPublish,
  onConfirmPublish,
}: {
  row: AdminCourseRow;
  busy: boolean;
  confirming: boolean;
  onEdit: () => void;
  onAskPublish: () => void;
  onCancelPublish: () => void;
  onConfirmPublish: () => void;
}) {
  const published = row.status === 'published';
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{row.title}</Text>
        <View style={[styles.badge, published ? styles.badgePublished : styles.badgeDraft]}>
          <Text style={[styles.badgeText, published ? styles.badgeTextPublished : styles.badgeTextDraft]}>
            {published ? 'Terbit' : 'Draf'}
          </Text>
        </View>
      </View>
      <Text style={styles.meta}>{row.mentorName ? `Mentor: ${row.mentorName}` : 'Belum ada mentor'}</Text>
      <Text style={styles.meta}>
        Kapasitas {row.capacity} peserta, {row.totalLessons} materi
      </Text>
      {!published && row.totalLessons === 0 ? (
        <Text style={styles.warning}>Belum ada materi. Penerbitan ditolak sebelum materi ditambahkan.</Text>
      ) : null}

      {published ? (
        <Text style={styles.meta}>Course yang sudah terbit tidak dapat diubah.</Text>
      ) : confirming ? (
        <View style={styles.confirmRow}>
          <Text style={styles.confirmText}>Terbitkan course ini sekarang?</Text>
          <View style={styles.formActions}>
            <Pressable
              accessibilityRole="button"
              style={[styles.secondaryButton, busy && styles.buttonDisabled]}
              onPress={onCancelPublish}
              disabled={busy}
            >
              <Text style={styles.secondaryButtonText}>Batal</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={[styles.primaryButton, busy && styles.buttonDisabled]}
              onPress={onConfirmPublish}
              disabled={busy}
            >
              {busy ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.primaryButtonText}>Ya, terbitkan</Text>}
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.formActions}>
          <Pressable
            accessibilityRole="button"
            style={[styles.secondaryButton, busy && styles.buttonDisabled]}
            onPress={onEdit}
            disabled={busy}
          >
            <Text style={styles.secondaryButtonText}>Ubah</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={[styles.primaryButton, busy && styles.buttonDisabled]}
            onPress={onAskPublish}
            disabled={busy}
          >
            <Text style={styles.primaryButtonText}>Terbitkan</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function MentorChoice({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.mentorChoice, active && styles.mentorChoiceActive]}
      onPress={onPress}
    >
      <Text style={[styles.mentorChoiceText, active && styles.mentorChoiceTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 110, gap: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  centerTitle: { fontSize: 18, fontWeight: '500', color: colors.textPrimary, textAlign: 'center' },
  centerText: { fontSize: 15, lineHeight: 22, color: colors.textSecondary, textAlign: 'center' },
  back: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backText: { fontSize: 16, fontWeight: '500', color: colors.textPrimary },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '500', color: colors.textPrimary },
  lead: { fontSize: 15, lineHeight: 22, color: colors.textSecondary },
  sectionTitle: { fontSize: 20, fontWeight: '500', color: colors.textPrimary },
  meta: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  warning: { fontSize: 14, lineHeight: 20, color: colors.error },
  primaryButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.action,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: { color: colors.surface, fontSize: 16, fontWeight: '500' },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: { color: colors.textPrimary, fontSize: 16, fontWeight: '500' },
  buttonDisabled: { opacity: 0.6 },
  formSubmit: { flex: 1 },
  formCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.xl, gap: spacing.lg },
  field: { gap: spacing.sm },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceSoft,
  },
  inputMultiline: { minHeight: 96, paddingTop: spacing.md, textAlignVertical: 'top' },
  mentorList: { gap: spacing.sm },
  mentorChoice: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceSoft,
  },
  mentorChoiceActive: { borderColor: colors.action, backgroundColor: colors.surface },
  mentorChoiceText: { fontSize: 15, color: colors.textSecondary },
  mentorChoiceTextActive: { color: colors.textPrimary, fontWeight: '500' },
  formActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  noticeCard: { backgroundColor: colors.successSurface, borderRadius: radius.card, padding: spacing.lg },
  noticeText: { color: colors.success, fontSize: 14, lineHeight: 20 },
  errorCard: { backgroundColor: colors.errorSurface, borderRadius: radius.card, padding: spacing.lg },
  errorText: { color: colors.error, fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.xl, gap: spacing.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  cardTitle: { flex: 1, fontSize: 20, lineHeight: 28, fontWeight: '500', color: colors.textPrimary },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  badgePublished: { backgroundColor: colors.successSurface },
  badgeDraft: { backgroundColor: colors.surfaceSoft },
  badgeText: { fontSize: 12, fontWeight: '500' },
  badgeTextPublished: { color: colors.success },
  badgeTextDraft: { color: colors.textSecondary },
  confirmRow: { gap: spacing.sm, marginTop: spacing.sm },
  confirmText: { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  stateCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  emptyTitle: { fontSize: 16, fontWeight: '500', color: colors.textPrimary },
});

export default AdminCourseScreen;
