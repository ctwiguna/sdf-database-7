import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { MentorLesson, MentorModule } from '../types';
import { LessonItem } from './LessonItem';

type Props = {
  module: MentorModule;
  readOnly: boolean;
  onEditModule: (module: MentorModule) => void;
  onDeleteModule: (module: MentorModule) => void;
  onAddLesson: (module: MentorModule) => void;
  onEditLesson: (lesson: MentorLesson, module: MentorModule) => void;
  onDeleteLesson: (lesson: MentorLesson, module: MentorModule) => void;
};

export function ModuleItem({
  module,
  readOnly,
  onEditModule,
  onDeleteModule,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
}: Props) {
  const sortedLessons = [...module.lessons].sort((a, b) => a.position - b.position);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Modul {module.position}</Text>
          </View>
          <Text style={styles.title}>{module.title}</Text>
        </View>

        {!readOnly ? (
          <View style={styles.moduleActions}>
            <Pressable
              style={styles.actionButton}
              onPress={() => onEditModule(module)}
              accessibilityLabel={`Edit modul ${module.title}`}
            >
              <Ionicons name="pencil-outline" size={17} color={colors.textPrimary} />
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => onDeleteModule(module)}
              accessibilityLabel={`Hapus modul ${module.title}`}
            >
              <Ionicons name="trash-outline" size={17} color={colors.error} />
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.lessonsContainer}>
        {sortedLessons.length > 0 ? (
          sortedLessons.map((lesson) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              readOnly={readOnly}
              onEdit={(target) => onEditLesson(target, module)}
              onDelete={(target) => onDeleteLesson(target, module)}
            />
          ))
        ) : (
          <View style={styles.emptyLessons}>
            <Text style={styles.emptyText}>Belum ada materi pada modul ini.</Text>
          </View>
        )}
      </View>

      {!readOnly ? (
        <Pressable
          style={({ pressed }) => [styles.addLessonButton, pressed && styles.pressed]}
          onPress={() => onAddLesson(module)}
        >
          <Ionicons name="add-circle-outline" size={16} color={colors.action} />
          <Text style={styles.addLessonText}>Tambah Materi</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  titleArea: {
    flex: 1,
    gap: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  moduleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionButton: {
    padding: spacing.xs,
    borderRadius: radius.pill,
  },
  lessonsContainer: {
    gap: spacing.sm,
  },
  emptyLessons: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.input,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  addLessonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDEEE6',
    borderRadius: radius.button,
    height: 40,
    gap: spacing.xs,
  },
  addLessonText: {
    color: colors.action,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
