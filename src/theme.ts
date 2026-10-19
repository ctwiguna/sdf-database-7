import { Easing, Platform } from 'react-native';

/**
 * ElevenLabs design tokens - warm cream editorial with whispered headlines.
 *
 * Surfaces stack eggshell, warm taupe, stone. Type is ink on paper: display
 * moments run at weight 300 with tight -0.02em tracking (the design's Waldenburg
 * substitute on device is the system light weight), while everything below 24px
 * stays 400/500. Violet and ember stay reserved for product visuals, so the UI
 * chrome here is fully achromatic.
 */
export const palette = {
  eggshell: '#FDFCFC',
  warmTaupe: '#F5F3F1',
  stone: '#EBE8E4',
  ink: '#000000',
  graphite: '#44403B',
  smoke: '#777169',
  ash: '#A59F97',
  violetSpark: '#0447FF',
  emberOrange: '#FF4704',
  buttonBorder: '#E5E5E5',
} as const;

export const colors = {
  background: palette.eggshell,
  surface: palette.warmTaupe,
  surfaceSoft: palette.stone,
  surfaceElevated: palette.eggshell,

  textPrimary: palette.ink,
  textSecondary: palette.smoke,
  textMuted: palette.ash,
  textStrong: palette.graphite,

  border: palette.stone,
  borderStrong: palette.buttonBorder,

  // Interactive chrome stays achromatic: pure black is the only hard contrast.
  accent: palette.ink,
  action: palette.ink,
  actionText: palette.eggshell,

  // Decoration only, product visuals and course dots, never buttons or links.
  violetSpark: palette.violetSpark,
  emberOrange: palette.emberOrange,

  // Course identity tints, used as small accents only.
  pastelPeach: '#F4D9CB',
  pastelLavender: '#DFD1EE',

  // Functional status.
  success: '#2F6B4A',
  error: '#B42318',
  successSurface: '#E9F0E7',
  errorSurface: '#FAEDE7',
  infoSurface: palette.warmTaupe,
} as const;

/** Type scale from the design md: 10/14/16/18/20 plus 32/36/48 with -0.02em display tracking. */
export const typography = {
  display: { fontSize: 48, lineHeight: 52, letterSpacing: -0.96, fontWeight: '300' },
  heading: { fontSize: 36, lineHeight: 42, letterSpacing: -0.72, fontWeight: '300' },
  headingSm: { fontSize: 32, lineHeight: 36, letterSpacing: -0.64, fontWeight: '300' },
  title: { fontSize: 30, lineHeight: 34, letterSpacing: -0.6, fontWeight: '300' },
  titleSm: { fontSize: 24, lineHeight: 30, letterSpacing: -0.48, fontWeight: '300' },
  subheading: { fontSize: 20, lineHeight: 27, letterSpacing: -0.2, fontWeight: '400' },
  bodyLg: { fontSize: 18, lineHeight: 29, letterSpacing: 0, fontWeight: '400' },
  body: { fontSize: 16, lineHeight: 24, letterSpacing: 0.16, fontWeight: '400' },
  bodySm: { fontSize: 14, lineHeight: 21, letterSpacing: 0.14, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 19, letterSpacing: 0.12, fontWeight: '400' },
  micro: { fontSize: 11, lineHeight: 18, letterSpacing: 0.11, fontWeight: '400' },
  label: { fontSize: 12, lineHeight: 16, letterSpacing: 1.4, fontWeight: '500' },
  button: { fontSize: 15, lineHeight: 20, letterSpacing: 0.15, fontWeight: '500' },
  wordmark: { fontSize: 20, lineHeight: 26, letterSpacing: -0.2, fontWeight: '600' },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 13,
    lineHeight: 22,
    fontWeight: '400',
  },
} as const;

/** 4px base unit, the design's spacing ladder. */
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48, section: 64 } as const;

/** Cards 20px, large cards 24px, inputs 4px, buttons and tags fully pilled. */
export const radius = { small: 10, input: 4, card: 20, cardLg: 24, button: 9999, pill: 9999, tag: 9999 } as const;

/** Whisper shadow: a 1px hard edge plus a 4% blur, never heavy elevation. */
export const shadow = {
  subtle: {
    shadowColor: palette.ink,
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
} as const;

export const motion = {
  duration: {
    press: 120, // umpan balik saat kontrol ditekan
    fast: 160, // pelepasan tekan, keluar toast, keluar modal
    base: 200, // masuk toast, masuk kartu modal
  },
  easing: {
    out: Easing.bezier(0.23, 1, 0.32, 1),
  },
} as const;
