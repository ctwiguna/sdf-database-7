import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

/**
 * Wordmark dari film peluncuran Future Skill: "FUTURE SKILL" di antara dua
 * kurung siku, dengan ukuran yang diturunkan dari nisbah asli di film
 * (huruf display 96, kurung 42x128, celah kurung 30, jarak antar huruf .11em).
 */
export const BRAND_WORD = 'FUTURE SKILL';
export const BRAND_TAGLINE = 'future skill, for future leaders';
export const BRAND_CAPTION = 'Learning Mobile Apps · 2026';
export const brandOrbSource = require('../../assets/brand-orb.png');

export function brandMetrics(fontSize: number) {
  return {
    bracketHeight: fontSize * 1.3,
    bracketWidth: fontSize * 0.3,
    bracketStroke: Math.max(1.5, fontSize * 0.05),
    gap: fontSize * 0.34, // celah kurung ke huruf pertama
    letterGap: fontSize * 0.11, // jarak antar huruf, dari nisbah film
    spaceWidth: fontSize * 0.26, // lebar spasi antar kata
  };
}

export function Bracket({
  side,
  height,
  width,
  stroke,
  color = colors.textPrimary,
}: {
  side: 'left' | 'right';
  height: number;
  width: number;
  stroke: number;
  color?: string;
}) {
  const ends =
    side === 'left'
      ? { borderLeftWidth: stroke, borderTopWidth: stroke, borderBottomWidth: stroke }
      : { borderRightWidth: stroke, borderTopWidth: stroke, borderBottomWidth: stroke };
  return <View style={[{ width, height, borderColor: color }, ends]} />;
}

export function BrandOrb({ size }: { size: number }) {
  return <Image source={brandOrbSource} style={{ width: size, height: size }} resizeMode="contain" />;
}

/** Wordmark statis untuk header aplikasi. */
export function BrandWordmark({ fontSize = 16, color = colors.textPrimary }: { fontSize?: number; color?: string }) {
  const m = brandMetrics(fontSize);
  return (
    <View style={styles.row} accessibilityLabel="Future Skill">
      <Bracket side="left" height={m.bracketHeight} width={m.bracketWidth} stroke={m.bracketStroke} color={color} />
      <View style={[styles.letters, { marginLeft: m.gap, marginRight: m.gap - m.letterGap }]}>
        {BRAND_WORD.split('').map((character, index) =>
          character === ' ' ? (
            <View key={index} style={{ width: m.spaceWidth, marginRight: m.letterGap }} />
          ) : (
            <Text key={index} style={[styles.letter, { fontSize, lineHeight: fontSize * 1.18, color, marginRight: m.letterGap }]}>
              {character}
            </Text>
          ),
        )}
      </View>
      <Bracket side="right" height={m.bracketHeight} width={m.bracketWidth} stroke={m.bracketStroke} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  letters: { flexDirection: 'row', alignItems: 'center' },
  letter: { fontWeight: '300' },
});
