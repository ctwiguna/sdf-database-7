import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { MentorLesson } from '../types';

type Props = {
  lesson: MentorLesson;
  readOnly: boolean;
  onEdit: (lesson: MentorLesson) => void;
  onDelete: (lesson: MentorLesson) => void;
};

export function LessonItem({ lesson, readOnly, onEdit, onDelete }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.positionBadge}>
        <Text style={styles.positionText}>{lesson.position}</Text>
      </View>

      <View style={styles.contentWrap}>
        <Text style={styles.title} numberOfLines={2}>
          {lesson.title}
        </Text>
        <View style={styles.videoMeta}>
          <Ionicons name="logo-youtube" size={13} color={colors.action} />
          <Text style={styles.videoIdText}>{lesson.youtube_video_id}</Text>
        </View>
      </View>

      {!readOnly ? (
        <View style={styles.actions}>
          <Pressable
            style={styles.iconButton}
            onPress={() => onEdit(lesson)}
            accessibilityLabel={`Edit materi ${lesson.title}`}
          >
            <Ionicons name="pencil-outline" size={16} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            style={styles.iconButton}
            onPress={() => onDelete(lesson)}
            accessibilityLabel={`Hapus materi ${lesson.title}`}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.input,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceSoft,
  },
  positionBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  contentWrap: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  videoIdText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    padding: spacing.xs,
    borderRadius: radius.pill,
  },
});
