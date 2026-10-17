import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { MentorCourseCard } from '../components/MentorCourseCard';
import { fetchMentorCourses, friendlyErrorMessage, MentorDatabaseClient } from '../lib/mentor';
import { MentorCourse } from '../types';

type Props = {
  client: MentorDatabaseClient | null;
  mentorId: string | null;
  mentorName?: string | null;
  onSelectCourse: (course: MentorCourse) => void;
  onViewParticipants?: (course: MentorCourse) => void;
};

export function MentorCourseListScreen({
  client,
  mentorId,
  mentorName,
  onSelectCourse,
  onViewParticipants,
}: Props) {
  const [courses, setCourses] = useState<MentorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    if (!client || !mentorId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMentorCourses(client, mentorId);
      setCourses(data);
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [client, mentorId]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  if (!client) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.stateTitle}>Koneksi Database Belum Siap</Text>
        <Text style={styles.stateSubtitle}>
          Pastikan kredensial Supabase di berkas .env sudah terpasang untuk melihat course Anda.
        </Text>
      </View>
    );
  }

  if (!mentorId) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-circle-outline" size={48} color={colors.textSecondary} />
        <Text style={styles.stateTitle}>Belum Masuk Sebagai Mentor</Text>
        <Text style={styles.stateSubtitle}>
          Masuk terlebih dahulu melalui tab Akun dengan akun mentor untuk mengurasi course.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.screenTitle}>Kurasi Course Mentor</Text>
          <Text style={styles.mentorGreeting}>
            {mentorName ? `Mentor: ${mentorName}` : 'Daftar course milik Anda'}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.refreshButton, pressed && styles.buttonPressed]}
          onPress={() => void loadCourses()}
          disabled={loading}
          accessibilityLabel="Muat ulang daftar course"
        >
          <Ionicons
            name="reload-outline"
            size={20}
            color={loading ? colors.border : colors.textPrimary}
          />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator size="large" color={colors.textPrimary} />
          <Text style={styles.loadingText}>Memuat course Anda...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle-outline" size={24} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => void loadCourses()}>
            <Text style={styles.retryButtonText}>Coba Lagi</Text>
          </Pressable>
        </View>
      ) : courses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="file-tray-outline" size={40} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Belum Ada Course</Text>
          <Text style={styles.emptySubtitle}>
            Anda belum memiliki course yang ditugaskan untuk dikurasi.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {courses.map((course) => (
            <View key={course.id} style={styles.courseGroup}>
              <MentorCourseCard course={course} onPress={onSelectCourse} />
              {onViewParticipants && (
                <Pressable
                  accessibilityRole="button"
                  style={styles.participantsButton}
                  onPress={() => onViewParticipants(course)}
                >
                  <Text style={styles.participantsText}>Lihat peserta</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  mentorGreeting: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  loadingArea: {
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorCard: {
    backgroundColor: '#FDECEB',
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.button,
  },
  retryButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
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
  },
  list: {
    gap: spacing.md,
  },
  courseGroup: {
    gap: spacing.sm,
  },
  participantsButton: {
    minHeight: 48,
    borderRadius: radius.button,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantsText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
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
});


