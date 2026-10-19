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
import { ModuleFormData } from '../types';

type Props = {
  visible: boolean;
  initialData?: { id: string; title: string; position: number } | null;
  defaultNextPosition: number;
  busy: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onSubmit: (data: ModuleFormData, id?: string) => Promise<void>;
  onClose: () => void;
};

export function ModuleFormModal({
  visible,
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
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setTitle(initialData.title);
        setPositionStr(String(initialData.position));
      } else {
        setTitle('');
        setPositionStr(String(defaultNextPosition || 1));
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
      setLocalError('Judul modul wajib diisi.');
      return;
    }

    const pos = parseInt(positionStr, 10);
    if (isNaN(pos) || pos <= 0) {
      setLocalError('Nomor urutan (posisi) harus berupa angka positif lebih besar dari 0.');
      return;
    }

    setLocalError(null);
    try {
      await onSubmit({ title: trimmedTitle, position: pos }, initialData?.id);
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
            <Text style={styles.title}>
              {isEditing ? 'Ubah Modul' : 'Tambah Modul Baru'}
            </Text>
            <Pressable onPress={onClose} disabled={busy} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>JUDUL MODUL</Text>
            <TextInput
              style={styles.input}
              placeholder="Contoh: Pengenalan Komponen Dasar"
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
              Urutan modul diisi otomatis ke posisi berikutnya, namun tetap dapat Anda sesuaikan.
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
                  {isEditing ? 'Simpan Perubahan' : 'Tambah Modul'}
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
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
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
    backgroundColor: '#FDECEB',
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
    backgroundColor: '#E6F4EA',
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
    fontWeight: '600',
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
    fontWeight: '700',
    fontSize: 14,
  },
  disabled: {
    opacity: 0.6,
  },
});
