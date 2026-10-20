import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, motion, typography } from '../theme';
import { useReduceMotion } from '../lib/useReduceMotion';
import { Bracket, BrandOrb, BRAND_CAPTION, BRAND_TAGLINE, BRAND_WORD, brandMetrics } from './BrandMark';

/**
 * Layar sambutan mengikuti adegan lockup film peluncuran: kurung siku meluncur
 * masuk dari kiri dan kanan, huruf wordmark menyusul dari tepi ke tengah, lalu
 * baris tagline naik dari bawah. Layar menutup sendiri setelah jeda singkat,
 * dan ketukan di mana saja melewatinya lebih cepat.
 */
const WORD_FONT = 38;
const HOLD_MS = 2000;
const FADE_MS = 280;
const REDUCED_HOLD_MS = 1200;

const LETTERS = BRAND_WORD.split('');

export function WelcomeScreen({ onDone }: { onDone: () => void }) {
  const reduceMotion = useReduceMotion();
  const m = brandMetrics(WORD_FONT);
  const anim = useRef({
    bracketL: new Animated.Value(0),
    bracketR: new Animated.Value(0),
    meta: new Animated.Value(0),
    fade: new Animated.Value(1),
    letters: LETTERS.map(() => new Animated.Value(0)),
  }).current;
  const finished = useRef(false);
  const closeRef = useRef(() => {});

  closeRef.current = () => {
    if (finished.current) return;
    finished.current = true;
    Animated.timing(anim.fade, {
      toValue: 0,
      duration: reduceMotion ? 160 : FADE_MS,
      easing: motion.easing.out,
      useNativeDriver: true,
    }).start(({ finished: done }) => {
      if (done) onDone();
    });
  };

  useEffect(() => {
    if (reduceMotion) {
      anim.bracketL.setValue(1);
      anim.bracketR.setValue(1);
      anim.meta.setValue(1);
      anim.letters.forEach((value) => value.setValue(1));
      const timer = setTimeout(() => closeRef.current(), REDUCED_HOLD_MS);
      return () => clearTimeout(timer);
    }
    const steps: Animated.CompositeAnimation[] = [
      Animated.timing(anim.bracketL, {
        toValue: 1,
        duration: motion.duration.slow,
        delay: 40,
        easing: motion.easing.glide,
        useNativeDriver: true,
      }),
      Animated.timing(anim.bracketR, {
        toValue: 1,
        duration: motion.duration.slow,
        delay: 40,
        easing: motion.easing.glide,
        useNativeDriver: true,
      }),
      ...anim.letters.map((value, index) =>
        Animated.timing(value, {
          toValue: 1,
          duration: motion.duration.slow,
          delay: 60 + Math.min(index, LETTERS.length - 1 - index) * motion.stagger.letter,
          easing: motion.easing.glide,
          useNativeDriver: true,
        }),
      ),
      Animated.timing(anim.meta, {
        toValue: 1,
        duration: 500,
        delay: 430,
        easing: motion.easing.out,
        useNativeDriver: true,
      }),
    ];
    Animated.parallel(steps).start();
    const timer = setTimeout(() => closeRef.current(), HOLD_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  const orbSize = Math.round(WORD_FONT * 0.52);

  return (
    <Animated.View style={[styles.overlay, { opacity: anim.fade }]}>
      <Pressable
        style={styles.fill}
        onPress={() => closeRef.current()}
        accessibilityRole="button"
        accessibilityLabel="Lanjut ke aplikasi"
      >
        <View style={styles.lockup}>
          <View style={styles.row}>
            <Animated.View
              style={{
                opacity: anim.bracketL,
                transform: [
                  {
                    translateX: anim.bracketL.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-WORD_FONT * 0.96, 0],
                    }),
                  },
                ],
              }}
            >
              <Bracket side="left" height={m.bracketHeight} width={m.bracketWidth} stroke={m.bracketStroke} />
            </Animated.View>
            <View style={[styles.letters, { marginLeft: m.gap, marginRight: m.gap - m.letterGap }]}>
              {LETTERS.map((character, index) => {
                const travel = (index - 5.5) * WORD_FONT * 0.27;
                const transform = [
                  {
                    translateX: anim.letters[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [travel, 0],
                    }),
                  },
                ];
                return character === ' ' ? (
                  <Animated.View
                    key={index}
                    style={{ width: m.spaceWidth, marginRight: m.letterGap, opacity: anim.letters[index], transform }}
                  />
                ) : (
                  <Animated.Text
                    key={index}
                    style={[
                      styles.letter,
                      { fontSize: WORD_FONT, lineHeight: WORD_FONT * 1.18, marginRight: m.letterGap, opacity: anim.letters[index], transform },
                    ]}
                  >
                    {character}
                  </Animated.Text>
                );
              })}
            </View>
            <Animated.View
              style={{
                opacity: anim.bracketR,
                transform: [
                  {
                    translateX: anim.bracketR.interpolate({
                      inputRange: [0, 1],
                      outputRange: [WORD_FONT * 0.96, 0],
                    }),
                  },
                ],
              }}
            >
              <Bracket side="right" height={m.bracketHeight} width={m.bracketWidth} stroke={m.bracketStroke} />
            </Animated.View>
          </View>
          <Animated.View
            style={[
              styles.meta,
              {
                marginLeft: WORD_FONT * 0.54,
                marginTop: WORD_FONT * 0.33,
                opacity: anim.meta,
                transform: [
                  {
                    translateY: anim.meta.interpolate({
                      inputRange: [0, 1],
                      outputRange: [WORD_FONT * 0.15, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <BrandOrb size={orbSize} />
            <View style={[styles.metaText, { marginLeft: WORD_FONT * 0.2 }]}>
              <Text style={styles.tagline}>{BRAND_TAGLINE}</Text>
              <Text style={styles.caption}>{BRAND_CAPTION}</Text>
            </View>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.background, zIndex: 20, elevation: 20 },
  fill: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  lockup: { alignItems: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center' },
  letters: { flexDirection: 'row', alignItems: 'center' },
  letter: { fontWeight: '300', color: colors.textPrimary },
  meta: { flexDirection: 'row', alignItems: 'center' },
  metaText: { justifyContent: 'center' },
  tagline: { fontSize: 13, color: colors.textStrong },
  caption: {
    fontSize: 9,
    marginTop: 4,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
    fontFamily: typography.mono.fontFamily,
  },
});
