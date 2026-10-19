import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { useReduceMotion } from '../../../lib/useReduceMotion';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { LessonFormModal } from '../components/LessonFormModal';
import { ModuleFormModal } from '../components/ModuleFormModal';
import { ModuleItem } from '../components/ModuleItem';
import { ReadOnlyNotice } from '../components/ReadOnlyNotice';
import {
  deleteLesson,
  deleteModule,
  fetchMentorCourseDetail,
  friendlyErrorMessage,
  getNextLessonPosition,
  getNextModulePosition,
  MentorDatabaseClient,
  saveLesson,
  saveModule,
} from '../lib/mentor';
import {
  LessonFormData,
  MentorCourse,
  MentorLesson,
  MentorModule,
  ModuleFormData,
} from '../types';

type Props = {
  client: MentorDatabaseClient | null;
  courseId: string;
  onBack: () => void;
};

export function MentorCourseDetailScreen({ client, courseId, onBack }: Props) {
  const [course, setCourse] = useState<MentorCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State Form Modal Modul
  const [moduleModalVisible, setModuleModalVisible] = useState(false);
  const [selectedModule, setSelectedModule] = useState<MentorModule | null>(null);
  const [moduleBusy, setModuleBusy] = useState(false);
  const [moduleError, setModuleError] = useState<string | null>(null);
  const [moduleSuccess, setModuleSuccess] = useState<string | null>(null);

  // State Form Modal Lesson
  const [lessonModalVisible, setLessonModalVisible] = useState(false);
  const [targetModuleForLesson, setTargetModuleForLesson] = useState<MentorModule | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<MentorLesson | null>(null);
  const [lessonBusy, setLessonBusy] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [lessonSuccess, setLessonSuccess] = useState<string | null>(null);

  // State Konfirmasi Hapus
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: 'module'; module: MentorModule }
    | { type: 'lesson'; lesson: MentorLesson; module: MentorModule }
    | null
  >(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const reduceMotion = useReduceMotion();

  // Daftar modul dan materi dianimasikan saat berubah, kecuali reduce motion aktif.
  const animateListChange = useCallback(() => {
    if (reduceMotion) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [reduceMotion]);

  const loadCourse = useCallback(async () => {
    if (!client) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setScreenError(null);
    try {
      const data = await fetchMentorCourseDetail(client, courseId);
      setCourse(data);
    } catch (err) {
      setScreenError(friendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [client, courseId]);

  useEffect(() => {
    void loadCourse();
  }, [loadCourse]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const isReadOnly = course?.status === 'published';

  // Handler Buka Form Modul Baru
  const handleOpenAddModule = () => {
    setSelectedModule(null);
    setModuleError(null);
    setModuleSuccess(null);
    setModuleModalVisible(true);
  };

  // Handler Buka Form Edit Modul
  const handleOpenEditModule = (mod: MentorModule) => {
    setSelectedModule(mod);
    setModuleError(null);
    setModuleSuccess(null);
    setModuleModalVisible(true);
  };

  // Handler Submit Modul (Tambah / Ubah)
  const handleSubmitModule = async (data: ModuleFormData, id?: string) => {
    if (!client || !course) return;
    setModuleBusy(true);
    setModuleError(null);
    setModuleSuccess(null);

    try {
      await saveModule(client, {
        id,
        course_id: course.id,
        title: data.title,
        position: data.position,
      });

      setModuleSuccess(id ? 'Modul berhasil diperbarui.' : 'Modul baru berhasil ditambahkan.');
      animateListChange();
      await loadCourse();
      setTimeout(() => {
        setModuleModalVisible(false);
        showToast(id ? 'Modul berhasil diperbarui.' : 'Modul baru berhasil ditambahkan.');
      }, 500);
    } catch (err) {
      const msg = friendlyErrorMessage(err);
      setModuleError(msg);
      throw err;
    } finally {
      setModuleBusy(false);
    }
  };

  // Handler Buka Form Lesson Baru
  const handleOpenAddLesson = (mod: MentorModule) => {
    setTargetModuleForLesson(mod);
    setSelectedLesson(null);
    setLessonError(null);
    setLessonSuccess(null);
    setLessonModalVisible(true);
  };

  // Handler Buka Form Edit Lesson
  const handleOpenEditLesson = (lesson: MentorLesson, mod: MentorModule) => {
    setTargetModuleForLesson(mod);
    setSelectedLesson(lesson);
    setLessonError(null);
    setLessonSuccess(null);
    setLessonModalVisible(true);
  };

  // Handler Submit Lesson (Tambah / Ubah)
  const handleSubmitLesson = async (data: LessonFormData, id?: string) => {
    if (!client || !course || !targetModuleForLesson) return;
    setLessonBusy(true);
    setLessonError(null);
    setLessonSuccess(null);

    try {
      await saveLesson(client, {
        id,
        course_id: course.id,
        module_id: targetModuleForLesson.id,
        title: data.title,
        position: data.position,
        youtube_video_id: data.youtube_video_id,
      });

      setLessonSuccess(id ? 'Materi berhasil diperbarui.' : 'Materi baru berhasil ditambahkan.');
      animateListChange();
      await loadCourse();
      setTimeout(() => {
        setLessonModalVisible(false);
        showToast(id ? 'Materi berhasil diperbarui.' : 'Materi baru berhasil ditambahkan.');
      }, 500);
    } catch (err) {
      const msg = friendlyErrorMessage(err);
      setLessonError(msg);
      throw err;
    } finally {
      setLessonBusy(false);
    }
  };

  // Handler Konfirmasi Eksekusi Hapus (Modul atau Lesson)
  const handleConfirmDelete = async () => {
    if (!client || !deleteTarget) return;
    setDeleteBusy(true);
    try {
      if (deleteTarget.type === 'module') {
        await deleteModule(client, deleteTarget.module.id);
        showToast(`Modul "${deleteTarget.module.title}" berhasil dihapus.`);
      } else {
        await deleteLesson(client, deleteTarget.lesson.id);
        showToast(`Materi "${deleteTarget.lesson.title}" berhasil dihapus.`);
      }
      setDeleteTarget(null);
      animateListChange();
      await loadCourse();
    } catch (err) {
      showToast(friendlyErrorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  if (!client) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.stateTitle}>Koneksi Database Belum Siap</Text>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Kembali ke Daftar Course</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
        <Text style={styles.loadingText}>Memuat silabus dan materi course...</Text>
      </View>
    );
  }

  if (screenError || !course) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.stateTitle}>Gagal Memuat Course</Text>
        <Text style={styles.stateSubtitle}>{screenError || 'Course tidak ditemukan.'}</Text>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Kembali ke Daftar Course</Text>
        </Pressable>
      </View>
    );
  }

  const modules = course.modules || [];
  const nextModulePos = getNextModulePosition(modules);
  const nextLessonPos = targetModuleForLesson
    ? getNextLessonPosition(targetModuleForLesson.lessons)
    : 1;

  return (
    <View style={styles.screenWrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header Navigasi */}
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [styles.navBackButton, pressed && styles.buttonPressed]}
            onPress={onBack}
            accessibilityLabel="Kembali ke daftar course"
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={styles.navBackText}>Daftar Course</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.iconReload, pressed && styles.buttonPressed]}
            onPress={() => void loadCourse()}
          >
            <Ionicons name="reload-outline" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Info Course */}
        <View style={styles.courseHeaderCard}>
          <View style={styles.metaRow}>
            {course.category ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{course.category}</Text>
              </View>
            ) : null}
            <View
              style={[
                styles.statusBadge,
                isReadOnly ? styles.publishedBadge : styles.draftBadge,
              ]}
            >
              <Ionicons
                name={isReadOnly ? 'checkmark-circle' : 'create-outline'}
                size={12}
                color={isReadOnly ? colors.success : colors.action}
              />
              <Text
                style={[
                  styles.statusText,
                  isReadOnly ? styles.publishedText : styles.draftText,
                ]}
              >
                {isReadOnly ? 'Terbit (Published)' : 'Draf (Draft)'}
              </Text>
            </View>
          </View>

          <Text style={styles.courseTitle}>{course.title}</Text>
          {course.description ? (
            <Text style={styles.courseDescription}>{course.description}</Text>
          ) : null}

          <View style={styles.courseMetaFooter}>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.metaValue}>Kapasitas: {course.capacity} siswa</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="folder-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.metaValue}>{modules.length} Modul</Text>
            </View>
          </View>
        </View>

        {/* Banner ReadOnly jika status Published */}
        {isReadOnly ? <ReadOnlyNotice /> : null}

        {/* Section Modul & Lesson */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Silabus Modul & Materi</Text>
          {!isReadOnly ? (
            <Pressable
              style={({ pressed }) => [styles.addModuleButton, pressed && styles.buttonPressed]}
              onPress={handleOpenAddModule}
            >
              <Ionicons name="add" size={18} color={colors.surface} />
              <Text style={styles.addModuleText}>Tambah Modul</Text>
            </Pressable>
          ) : null}
        </View>

        {modules.length === 0 ? (
          <View style={styles.emptyModulesCard}>
            <Ionicons name="albums-outline" size={36} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Belum Ada Modul</Text>
            <Text style={styles.emptySubtitle}>
              {isReadOnly
                ? 'Course ini belum memiliki modul terbit.'
                : 'Mulai kurasi course dengan menambahkan modul pertama.'}
            </Text>
            {!isReadOnly ? (
              <Pressable style={styles.primaryActionButton} onPress={handleOpenAddModule}>
                <Ionicons name="add-circle-outline" size={18} color={colors.surface} />
                <Text style={styles.primaryActionText}>Tambah Modul Pertama</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.modulesList}>
            {modules.map((mod) => (
              <ModuleItem
                key={mod.id}
                module={mod}
                readOnly={isReadOnly}
                onEditModule={handleOpenEditModule}
                onDeleteModule={(target) =>
                  setDeleteTarget({ type: 'module', module: target })
                }
                onAddLesson={handleOpenAddLesson}
                onEditLesson={(lesson, parentMod) =>
                  handleOpenEditLesson(lesson, parentMod)
                }
                onDeleteLesson={(lesson, parentMod) =>
                  setDeleteTarget({ type: 'lesson', lesson, module: parentMod })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Toast Feedback */}
      {toastMessage ? (
        <View style={styles.toastContainer}>
          <Ionicons name="information-circle" size={18} color={colors.surface} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      {/* Modal Form Modul */}
      <ModuleFormModal
        visible={moduleModalVisible}
        initialData={selectedModule}
        defaultNextPosition={nextModulePos}
        busy={moduleBusy}
        errorMessage={moduleError}
        successMessage={moduleSuccess}
        onSubmit={handleSubmitModule}
        onClose={() => setModuleModalVisible(false)}
      />

      {/* Modal Form Lesson */}
      <LessonFormModal
        visible={lessonModalVisible}
        moduleTitle={targetModuleForLesson?.title || ''}
        initialData={selectedLesson}
        defaultNextPosition={nextLessonPos}
        busy={lessonBusy}
        errorMessage={lessonError}
        successMessage={lessonSuccess}
        onSubmit={handleSubmitLesson}
        onClose={() => setLessonModalVisible(false)}
      />

      {/* Modal Konfirmasi Hapus */}
      <ConfirmDeleteModal
        visible={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'module' ? 'Hapus Modul' : 'Hapus Materi'}
        itemName={
          deleteTarget?.type === 'module'
            ? deleteTarget.module.title
            : deleteTarget?.lesson.title || ''
        }
        lessonCount={
          deleteTarget?.type === 'module' ? deleteTarget.module.lessons.length : 0
        }
        busy={deleteBusy}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: 110,
    gap: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  navBackText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  iconReload: {
    padding: spacing.xs,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  courseHeaderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  categoryBadge: {
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    gap: 4,
  },
  draftBadge: {
    backgroundColor: '#FDEEE6',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  draftText: {
    color: colors.action,
  },
  publishedBadge: {
    backgroundColor: '#E6F4EA',
  },
  publishedText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.success,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 26,
  },
  courseDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  courseMetaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSoft,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaValue: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addModuleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.button,
    gap: 4,
  },
  addModuleText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  modulesList: {
    gap: spacing.lg,
  },
  emptyModulesCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceSoft,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.textPrimary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  primaryActionText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 24,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: '#1E1E1E',
    borderRadius: radius.button,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  stateSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  backButton: {
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
  },
  backButtonText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
});
