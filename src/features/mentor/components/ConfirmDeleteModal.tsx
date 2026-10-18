import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';

type Props = {
  visible: boolean;
  title: string;
  itemName: string;
  lessonCount?: number;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDeleteModal({
  visible,
  title,
  itemName,
  lessonCount = 0,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="warning-outline" size={24} color={colors.error} />
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>

          <Text style={styles.body}>
            Apakah Anda yakin ingin menghapus <Text style={styles.highlight}>"{itemName}"</Text>?
          </Text>

          {lessonCount > 0 ? (
            <View style={styles.cascadeWarning}>
              <Ionicons name="alert-circle" size={18} color={colors.action} />
              <Text style={styles.cascadeWarningText}>
                Perhatian: Modul ini masih memiliki {lessonCount} materi di dalamnya. Karena aturan relasi database (ON DELETE CASCADE), menghapus modul ini akan menghapus seluruh {lessonCount} materi tersebut secara permanen.
              </Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              style={[styles.cancelButton, busy && styles.disabled]}
              disabled={busy}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>Batal</Text>
            </Pressable>
            <Pressable
              style={[styles.deleteButton, busy && styles.disabled]}
              disabled={busy}
              onPress={onConfirm}
            >
              {busy ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.deleteText}>Hapus</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
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
    maxWidth: 420,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: '#FDECEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  highlight: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  cascadeWarning: {
    flexDirection: 'row',
    backgroundColor: '#FFF4EE',
    borderLeftWidth: 3,
    borderLeftColor: colors.action,
    padding: spacing.md,
    borderRadius: radius.input / 2,
    gap: spacing.sm,
  },
  cascadeWarningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textPrimary,
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
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: colors.error,
    borderRadius: radius.button,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  disabled: {
    opacity: 0.6,
  },
});
