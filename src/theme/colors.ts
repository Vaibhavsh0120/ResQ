// ── Design tokens ────────────────────────────────────────────────────────
// Every color used anywhere in the app must come from this file. No screen
// or component should contain a literal hex/rgba value — that's what makes
// dark mode, rebranding, and contrast fixes a one-file change instead of a
// find-and-replace across the codebase.
//
// Naming convention:
//   - Base surfaces: background, surface, surfaceSoft
//   - Text: foreground (primary text), inkMuted (secondary text)
//   - Brand: brand (accent), brandDeep (strong fills), brandSoft (tints)
//   - Semantic: danger/warning/info + their *Soft tint and On* foreground
//   - "on*" tokens are always the correct foreground color for that fill,
//     so a component never has to guess contrast — pass colors.onBrand,
//     not white/black directly.

export type ThemeColors = typeof lightColors;

export const lightColors = {
  // Surfaces
  background: '#f3f4f3',
  surface: '#ffffff',
  surfaceSoft: '#f7f8f7',
  surfaceRaised: '#ffffff',

  // Text
  foreground: '#202523',
  inkMuted: '#5b655f',
  inkFaint: '#8b948f',

  // Borders
  line: '#dfe4e1',
  lineStrong: '#c7cdc9',

  // Brand (teal)
  brand: '#1f6865',
  brandDeep: '#164c4a',
  brandSoft: '#dceceb',
  brandSofter: '#eef5f4',
  onBrand: '#ffffff',

  // Semantic — danger (red)
  danger: '#c75d51',
  dangerSoft: '#f8e9e6',
  onDanger: '#ffffff',

  // Semantic — warning (amber)
  warning: '#a3762f',
  warningSoft: '#f6ecd8',
  onWarning: '#ffffff',

  // Semantic — info blue
  blue: '#4f6f92',
  blueSoft: '#e8eef5',
  onBlue: '#ffffff',

  // Semantic — accent purple
  purple: '#71608a',
  purpleSoft: '#eee9f3',
  onPurple: '#ffffff',

  // Success (distinct from brand for status dots/badges that must read as
  // "status" rather than "app accent")
  success: '#1f6865',
  successSoft: '#dceceb',

  onAccent: '#ffffff',

  // Overlays & shadows
  overlay: 'rgba(10, 12, 13, 0.42)',
  scrim: 'rgba(10, 12, 13, 0.55)',
  shadow: 'rgba(26, 57, 52, 0.14)',
  shadowBrand: 'rgba(22, 76, 74, 0.17)',
  shadowStrong: 'rgba(0, 0, 0, 0.14)',

  // Fixed-contrast overlays used on top of a brandDeep/gradient fill
  // regardless of light/dark mode (e.g. splash screen, hero card ring).
  onBrandMuted: 'rgba(255, 255, 255, 0.72)',
  onBrandFaint: 'rgba(255, 255, 255, 0.65)',
  onBrandHairline: 'rgba(255, 255, 255, 0.2)',
  onBrandOverlaySoft: 'rgba(255, 255, 255, 0.12)',
  onBrandOverlayFainter: 'rgba(255, 255, 255, 0.18)',
  onBrandBorder: 'rgba(255, 255, 255, 0.8)',
  onBrandCard: 'rgba(255, 255, 255, 0.9)',

  // Map + misc decorative
  mapSurface: '#e7eeeb',
  mapPinRing: '#a6d7d0',
  featuredIconBg: '#c0e1dc',
  featuredIconFg: '#164c4a',
  ringHighlight: '#a6d7d0',

  // Fixed neutral used for switch/toggle thumbs, which sit on a colored
  // track (brand or line) rather than the page background.
  controlThumb: '#ffffff',

  // Translucent surface tint layered over the iOS tab bar's BlurView, so the
  // frosted glass still reads as "ResQ surface" instead of plain grey blur.
  surfaceBlurTint: 'rgba(255, 255, 255, 0.55)',

  white: '#ffffff',
  black: '#000000',
};

export const darkColors: ThemeColors = {
  background: '#111214',
  surface: '#1a1b1e',
  surfaceSoft: '#232428',
  surfaceRaised: '#232428',

  foreground: '#f4f4f2',
  inkMuted: '#b7b9bd',
  inkFaint: '#7d8085',

  line: '#34363b',
  lineStrong: '#454850',

  brand: '#8fc9c0',
  brandDeep: '#2f716c',
  brandSoft: '#263e3c',
  brandSofter: '#1d2f2d',
  onBrand: '#0d1211',

  danger: '#e08b7f',
  dangerSoft: '#432b2a',
  onDanger: '#1a1110',

  warning: '#e0b673',
  warningSoft: '#443a26',
  onWarning: '#1c1608',

  blue: '#9db6d4',
  blueSoft: '#25303d',
  onBlue: '#0d1420',

  purple: '#c3afd9',
  purpleSoft: '#31283d',
  onPurple: '#180f22',

  success: '#8fc9c0',
  successSoft: '#263e3c',

  onAccent: '#f4f4f2',

  overlay: 'rgba(0, 0, 0, 0.58)',
  scrim: 'rgba(0, 0, 0, 0.65)',
  shadow: 'rgba(0, 0, 0, 0.28)',
  shadowBrand: 'rgba(0, 0, 0, 0.34)',
  shadowStrong: 'rgba(0, 0, 0, 0.38)',

  onBrandMuted: 'rgba(244, 244, 242, 0.72)',
  onBrandFaint: 'rgba(244, 244, 242, 0.68)',
  onBrandHairline: 'rgba(255, 255, 255, 0.14)',
  onBrandOverlaySoft: 'rgba(255, 255, 255, 0.08)',
  onBrandOverlayFainter: 'rgba(255, 255, 255, 0.12)',
  onBrandBorder: 'rgba(0, 0, 0, 0.4)',
  onBrandCard: 'rgba(30, 32, 35, 0.92)',

  mapSurface: '#202226',
  mapPinRing: '#a4d7cf',
  featuredIconBg: '#365b56',
  featuredIconFg: '#c9ece6',
  ringHighlight: '#a4d7cf',

  controlThumb: '#ffffff',

  surfaceBlurTint: 'rgba(26, 27, 30, 0.55)',

  white: '#ffffff',
  black: '#000000',
};

export const radius = {
  xs: 8,
  sm: 11,
  md: 13,
  lg: 16,
  xl: 19,
  xxl: 24,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
};

export const fontSizes = {
  eyebrow: 10,
  small: 11,
  body: 13,
  label: 14,
  title: 17,
  heading: 22,
  display: 28,
};
