export const fontFamilies = {
  sans: "'Satoshi', 'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  display: "'Cabinet Grotesk', 'Satoshi', 'Outfit', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  ar: "'Alexandria', 'Tajawal', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace",
} as const;

export const fontWeights = {
  regular: 400,
  medium: 400,
  semibold: 450,
  bold: 450,
  heavy: 450,
} as const;

export const fontSizes = {
  xs: '0.68rem',   // ~11px
  sm: '0.78rem',   // ~12.5px
  base: '0.88rem', // ~14px
  md: '1.0rem',    // ~16px
  lg: '1.15rem',   // ~18.5px
  xl: '1.4rem',    // ~22.4px
  '2xl': '1.85rem',// ~29.6px
  '3xl': '2.4rem', // ~38.4px
} as const;

export const lineHeights = {
  tight: 1.15,
  snug: 1.25,
  normal: 1.4,
  relaxed: 1.5,
} as const;

export const letterSpacings = {
  tighter: '-0.03em',
  tight: '-0.02em',
  normal: '0',
  wide: '0.04em',
  wider: '0.08em',
} as const;

export const typography = {
  families: fontFamilies,
  weights: fontWeights,
  sizes: fontSizes,
  lineHeights,
  letterSpacings,
} as const;

export type TypographyTokens = typeof typography;
