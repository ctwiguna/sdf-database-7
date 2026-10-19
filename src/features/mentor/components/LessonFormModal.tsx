import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';
import { useDialogTransition } from '../../../lib/useDialogTransition';
import { useReduceMotion } from '../../../lib/useReduceMotion';
import { LessonFormData } from '../types';

type Props = {
  visible: boolean;
  moduleTitle: string;
  initialData?: { id: string; title: string; position: number; youtube_video_id: string } | null;
  defaultNextPosition: number;
  busy: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onSubmit: (data: LessonFormData, id?: string) => Promise<void>;
  onClose: () => void;
};

export function LessonFormModal({
  visible,
  moduleTitle,
  initialData,
  defaultNextPosition,
  busy,
  errorMessage,
  successMessage,
  onSubmit,
  onClose,
}: Props) {
  const isEditing = Boolean(initialData?.id);
  const [title, setTitle] = useState('');
  const [positionStr, setPositionStr] = useState('1');
  const [videoId, setVideoId] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setTitle(initialData.title);
        setPositionStr(String(initialData.position));
        setVideoId(initialData.youtube_video_id);
      } else {
        setTitle('');
        setPositionStr(String(defaultNextPosition || 1));
        setVideoId('');
      }
      setLocalError(null);
    }
  }, [visible, initialData, defaultNextPosition]);

  const { rendered, progress } = useDialogTransition(visible);
  const reduceMotion = useReduceMotion();
  const cardScale = reduceMotion ? null : { transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] };


  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setLocalError('Judul materi wajib diisi.');
      return;
    }

    const pos = parseInt(positionStr, 10);
    if (isNaN(pos) || pos <= 0) {
      setLocalError('Nomor urutan (posisi) harus berupa angka positif lebih besar dari 0.');
      return;
    }

    const cleanVideoId = videoId.trim();
    if (cleanVideoId.length !== 11) {
      setLocalError('ID video YouTube harus tepat 11 karakter (contoh: W2vMc3ENiz8).');
      return;
    }

    setLocalError(null);
    try {
      await onSubmit(
        {
          title: trimmedTitle,
          position: pos,
          youtube_video_id: cleanVideoId,
        },
        initialData?.id
      );
    } catch {
      // Error akan ditangkap di layar dan dioper lewat prop errorMessage
    }
  };

  const displayedError = localError || errorMessage;

  return (
    <Modal visible={rendered} transparent animationType="none">
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Animated.View style={[styles.card, cardScale]}>
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.title}>
                {isEditing ? 'Ubah Materi (Lesson)' : 'Tambah Materi (Lesson)'}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                Modul: {moduleTitle}
              </Text>
            </View>
            <Pressable onPress={onClose} disabled={busy} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>JUDUL MATERI</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Keselamatan Kerja dan Alat Pelindung Diri"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (localError) setLocalError(null);
              }}
              editable={!busy}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>NOMOR URUTAN (POSISI)</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: 1"
              placeholderTextColor={colors.textSecondary}
              value={positionStr}
              onChangeText={(text) => {
                setPositionStr(text);
                if (localError) setLocalError(null);
              }}
              keyboardType="number-pad"
              editable={!busy}
            />
            <Text style={styles.helperText}>
              Urutan materi diisi otomatis ke posisi berikutnya di modul ini, namun tetap dapat Anda ubah.
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>YOUTUBE VIDEO ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: W2vMc3ENiz8 (11 Karakter)"
              placeholderTextColor={colors.textSecondary}
              value={videoId}
              onChangeText={(text) => {
                setVideoId(text);
                if (localError) setLocalError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={11}
              editable={!busy}
            />
            <Text style={styles.helperText}>
              Masukkan 11 karakter kode video YouTube (misalnya kode di belakang "v=" pada URL YouTube).
            </Text>
          </View>

          {displayedError ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={styles.errorText}>{displayedError}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              style={[styles.cancelButton, busy && styles.disabled]}
              disabled={busy}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>Batal</Text>
            </Pressable>
            <Pressable
              style={[styles.submitButton, busy && styles.disabled]}
              disabled={busy}
              onPress={() => void handleSubmit()}
            >
              {busy ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.submitText}>
                  {isEditing ? 'Simpan Perubahan' : 'Tambah Materi'}
                </Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 440,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitleWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    height: 48,
    color: colors.textPrimary,
    fontSize: 15,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.errorSurface,
    padding: spacing.sm,
    borderRadius: radius.input / 2,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: 13,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.successSurface,
    padding: spacing.sm,
    borderRadius: radius.input / 2,
  },
  successText: {
    flex: 1,
    color: colors.success,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.button,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.textPrimary,
    fontWeight: '500',
    fontSize: 14,
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.textPrimary,
    borderRadius: radius.button,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: colors.surface,
    fontWeight: '500',
    fontSize: 14,
  },
  disabled: {
    opacity: 0.6,
  },
});
