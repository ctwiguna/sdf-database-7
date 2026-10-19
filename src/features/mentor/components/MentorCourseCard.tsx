import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { MentorCourse } from '../types';

type Props = {
  course: MentorCourse;
  onPress: (course: MentorCourse) => void;
};

export function MentorCourseCard({ course, onPress }: Props) {
  const isPublished = course.status === 'published';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(course)}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <View style={styles.tagsRow}>
          {course.category ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{course.category}</Text>
            </View>
          ) : null}
          <View
            style={[
              styles.statusBadge,
              isPublished ? styles.publishedBadge : styles.draftBadge,
            ]}
          >
            <Ionicons
              name={isPublished ? 'checkmark-circle' : 'create-outline'}
              size={12}
              color={isPublished ? colors.success : colors.action}
            />
            <Text
              style={[
                styles.statusText,
                isPublished ? styles.publishedText : styles.draftText,
              ]}
            >
              {isPublished ? 'Terbit (Published)' : 'Draf (Draft)'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {course.title}
      </Text>

      {course.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {course.description}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.metaText}>Kapasitas: {course.capacity} siswa</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
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
    backgroundColor: colors.infoSurface,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  draftText: {
    color: colors.action,
  },
  publishedBadge: {
    backgroundColor: colors.successSurface,
  },
  publishedText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.success,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSoft,
    marginTop: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
