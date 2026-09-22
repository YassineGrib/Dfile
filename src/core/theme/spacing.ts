export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

export const radii = {
  none: '0px',
  sm: '8px',
  md: '12px',
  lg: '20px',
  pill: '9999px',
} as const;

export const shadows = {
  sm: '0 2px 5px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03)',
  md: '0 4px 14px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.03)',
  lg: '0 20px 40px rgba(26,26,26,0.04), 0 4px 10px rgba(26,26,26,0.02)',
} as const;

export const transitions = {
  smooth: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

export type SpacingTokens = {
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  transitions: typeof transitions;
};
