import { lightColors, darkColors, type ColorTokens } from './colors';
import { typography, type TypographyTokens } from './typography';
import { spacing, radii, shadows, transitions } from './spacing';

export interface ThemeTokens {
  mode: 'light' | 'dark';
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  transitions: typeof transitions;
}

export const lightTheme: ThemeTokens = {
  mode: 'light',
  colors: lightColors,
  typography,
  spacing,
  radii,
  shadows,
  transitions,
};

export const darkTheme: ThemeTokens = {
  mode: 'dark',
  colors: darkColors,
  typography,
  spacing,
  radii,
  shadows,
  transitions,
};

export function applyThemeToDocument(theme: ThemeTokens) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.setAttribute('data-theme', theme.mode);

  // Background surfaces
  root.style.setProperty('--bg-canvas', theme.colors.bg.canvas);
  root.style.setProperty('--bg-card', theme.colors.bg.card);
  root.style.setProperty('--bg-sidebar', theme.colors.bg.sidebar);

  // Text colors
  root.style.setProperty('--text-main', theme.colors.text.main);
  root.style.setProperty('--text-muted', theme.colors.text.muted);
  root.style.setProperty('--text-placeholder', theme.colors.text.placeholder);

  // Borders
  root.style.setProperty('--border-color', theme.colors.border.default);
  root.style.setProperty('--border-color-focus', theme.colors.border.focus);

  // Brand Accents
  root.style.setProperty('--accent-purple', theme.colors.brand.purple);
  root.style.setProperty('--accent-purple-light', theme.colors.brand.purpleLight);
  root.style.setProperty('--accent-orange', theme.colors.brand.orange);
  root.style.setProperty('--accent-lime', theme.colors.brand.lime);
  root.style.setProperty('--btn-primary', theme.colors.brand.forest);
  root.style.setProperty('--btn-primary-hover', theme.colors.brand.forestHover);

  // Balanced Font Weights
  root.style.setProperty('--weight-regular', String(theme.typography.weights.regular));
  root.style.setProperty('--weight-medium', String(theme.typography.weights.medium));
  root.style.setProperty('--weight-semibold', String(theme.typography.weights.semibold));
  root.style.setProperty('--weight-bold', String(theme.typography.weights.bold));
  root.style.setProperty('--weight-heavy', String(theme.typography.weights.heavy));

  // Radii
  root.style.setProperty('--radius-sm', theme.radii.sm);
  root.style.setProperty('--radius-md', theme.radii.md);
  root.style.setProperty('--radius-lg', theme.radii.lg);
  root.style.setProperty('--radius-pill', theme.radii.pill);

  // Shadows
  root.style.setProperty('--shadow-sm', theme.shadows.sm);
  root.style.setProperty('--shadow-md', theme.shadows.md);
  root.style.setProperty('--shadow-lg', theme.shadows.lg);

  // Transitions
  root.style.setProperty('--transition-smooth', theme.transitions.smooth);
  root.style.setProperty('--transition-fast', theme.transitions.fast);
}
