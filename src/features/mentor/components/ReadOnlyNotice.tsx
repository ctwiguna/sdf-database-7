import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme';

export function ReadOnlyNotice() {
  return (
    <View style={styles.container}>
      <Ionicons name="lock-closed" size={20} color={colors.textPrimary} style={styles.icon} />
      <View style={styles.textWrapper}>
        <Text style={styles.title}>Mode Baca Saja (Course Published)</Text>
        <Text style={styles.description}>
          Course ini sudah dipublikasikan. Demi menjaga integritas data peserta yang sedang belajar, modul dan materi kurasi tidak dapat ditambah, diedit, atau dihapus.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.pastelPeach,
    borderRadius: radius.card,
    padding: spacing.md,
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    marginTop: 2,
  },
  textWrapper: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textPrimary,
  },
});
