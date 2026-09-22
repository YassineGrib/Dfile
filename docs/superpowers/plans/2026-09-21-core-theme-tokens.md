# Core Theme, Colors, and Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish an enterprise-grade core theme, colors, and typography architecture under `src/core/theme/`, unifying TypeScript tokens, CSS variables, and dynamic theme switching.

**Architecture:** Build modular, strongly-typed token files (`colors.ts`, `typography.ts`, `spacing.ts`, `themes.ts`), a React `ThemeProvider` context with local storage persistence and system preference sync, and barrel exports under `src/core/index.ts`. Maintain complete backward compatibility with existing CSS stylesheets.

**Tech Stack:** TypeScript, React, CSS Custom Properties, LocalStorage.

**Spec:** [`docs/superpowers/specs/2026-09-21-core-theme-tokens-design.md`](file:///c:/Users/PC%20WORLD%20DZ/Documents/Dfile/docs/superpowers/specs/2026-09-21-core-theme-tokens-design.md)

## Global Constraints

- Refined, modern font weights: regular: 400, medium: 500, semibold: 600, bold: 650, heavy: 700. Ultra-heavy 800+ weights are banned.
- Support both Latin and Arabic typography stacks seamlessly.
- Strict TypeScript: no `any` types; all token structures must be immutable `as const` or typed via `ThemeTokens`.
- Full backward compatibility: existing CSS variables (`--bg-canvas`, `--text-main`, etc.) must remain active and bound to the active theme.

## Review Focus

1. Ensure `ThemeProvider` applies `data-theme` to `document.documentElement` immediately on mount without hydration flash.
2. Verify token contrast in both Light and Dark themes meets WCAG AA standards.
3. Validate that inline styles and CSS variables use the exact same color values.
4. Verify Arabic font fallback order (`Alexandria`, `Tajawal`, sans-serif).
5. Ensure `npm run build` compiles with zero TypeScript errors.

---

### Task 1: Create Color Primitives and Semantic Tokens

**Files:**
- Create: `src/core/theme/colors.ts`

**Interfaces:**
- Produces: `colorPrimitives`, `lightColors`, `darkColors`, `ColorTokens` type

- [ ] **Step 1: Write `src/core/theme/colors.ts`**

```typescript
export const colorPrimitives = {
  paper: {
    canvas: '#FAF9F6',
    card: '#FFFFFF',
    sidebar: '#F4F3F0',
  },
  darkPaper: {
    canvas: '#0F0F11',
    card: '#17171A',
    sidebar: '#141416',
  },
  charcoal: {
    900: '#1A1A1A',
    800: '#262626',
    600: '#666666',
    400: '#9E9EA8',
    300: '#B2B0A9',
    100: '#E6E5E0',
    50: '#F4F4F6',
  },
  brand: {
    forest: '#0E4F2F',
    forestHover: '#0A3C23',
    purple: '#8A5CF5',
    purpleLight: '#F1EAFF',
    orange: '#F05A28',
    lime: '#E5FF60',
  },
  status: {
    success: '#0E4F2F',
    successBg: '#E2FFEF',
    warning: '#F05A28',
    warningBg: '#FFF1EA',
    danger: '#D32F2F',
    dangerBg: '#FFF0F0',
    info: '#3B82F6',
    infoBg: '#EFF6FF',
  }
} as const;

export const lightColors = {
  bg: {
    canvas: colorPrimitives.paper.canvas,
    card: colorPrimitives.paper.card,
    sidebar: colorPrimitives.paper.sidebar,
  },
  text: {
    main: colorPrimitives.charcoal[900],
    muted: colorPrimitives.charcoal[600],
    placeholder: colorPrimitives.charcoal[300],
    inverse: '#FFFFFF',
  },
  border: {
    default: colorPrimitives.charcoal[100],
    focus: colorPrimitives.brand.purple,
  },
  brand: colorPrimitives.brand,
  status: colorPrimitives.status,
} as const;

export const darkColors = {
  bg: {
    canvas: colorPrimitives.darkPaper.canvas,
    card: colorPrimitives.darkPaper.card,
    sidebar: colorPrimitives.darkPaper.sidebar,
  },
  text: {
    main: colorPrimitives.charcoal[50],
    muted: colorPrimitives.charcoal[400],
    placeholder: '#52525B',
    inverse: colorPrimitives.charcoal[900],
  },
  border: {
    default: '#27272A',
    focus: colorPrimitives.brand.purple,
  },
  brand: colorPrimitives.brand,
  status: colorPrimitives.status,
} as const;

export type ColorTokens = typeof lightColors;
```

---

### Task 2: Create Typography Tokens

**Files:**
- Create: `src/core/theme/typography.ts`

**Interfaces:**
- Produces: `fontFamilies`, `fontWeights`, `fontSizes`, `lineHeights`, `letterSpacings`, `TypographyTokens` type

- [ ] **Step 1: Write `src/core/theme/typography.ts`**

```typescript
export const fontFamilies = {
  sans: "'Satoshi', 'Outfit', 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  display: "'Cabinet Grotesk', 'Satoshi', 'Outfit', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  ar: "'Alexandria', 'Tajawal', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace",
} as const;

export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 650,
  heavy: 700,
} as const;

export const fontSizes = {
  xs: '0.68rem',   // 11px
  sm: '0.78rem',   // 12.5px
  base: '0.88rem', // 14px
  md: '1.0rem',    // 16px
  lg: '1.15rem',   // 18.5px
  xl: '1.4rem',    // 22.4px
  '2xl': '1.85rem',// 29.6px
  '3xl': '2.4rem', // 38.4px
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
```

---

### Task 3: Create Spacing, Radii, Shadows, and Motion Tokens

**Files:**
- Create: `src/core/theme/spacing.ts`

**Interfaces:**
- Produces: `spacing`, `radii`, `shadows`, `transitions`, `SpacingTokens` type

- [ ] **Step 1: Write `src/core/theme/spacing.ts`**

```typescript
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
```

---

### Task 4: Create Theme Definitions & CSS Variable Injector

**Files:**
- Create: `src/core/theme/themes.ts`

**Interfaces:**
- Produces: `lightTheme`, `darkTheme`, `ThemeTokens`, `applyThemeToDocument(theme)`

- [ ] **Step 1: Write `src/core/theme/themes.ts`**

```typescript
import { lightColors, darkColors, ColorTokens } from './colors';
import { typography, TypographyTokens } from './typography';
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
  const root = document.documentElement;
  root.setAttribute('data-theme', theme.mode);

  // Set CSS custom properties
  root.style.setProperty('--bg-canvas', theme.colors.bg.canvas);
  root.style.setProperty('--bg-card', theme.colors.bg.card);
  root.style.setProperty('--bg-sidebar', theme.colors.bg.sidebar);

  root.style.setProperty('--text-main', theme.colors.text.main);
  root.style.setProperty('--text-muted', theme.colors.text.muted);
  root.style.setProperty('--text-placeholder', theme.colors.text.placeholder);

  root.style.setProperty('--border-color', theme.colors.border.default);
  root.style.setProperty('--border-color-focus', theme.colors.border.focus);

  root.style.setProperty('--accent-purple', theme.colors.brand.purple);
  root.style.setProperty('--accent-purple-light', theme.colors.brand.purpleLight);
  root.style.setProperty('--accent-orange', theme.colors.brand.orange);
  root.style.setProperty('--accent-lime', theme.colors.brand.lime);
  root.style.setProperty('--btn-primary', theme.colors.brand.forest);
  root.style.setProperty('--btn-primary-hover', theme.colors.brand.forestHover);

  root.style.setProperty('--weight-regular', String(theme.typography.weights.regular));
  root.style.setProperty('--weight-medium', String(theme.typography.weights.medium));
  root.style.setProperty('--weight-semibold', String(theme.typography.weights.semibold));
  root.style.setProperty('--weight-bold', String(theme.typography.weights.bold));
  root.style.setProperty('--weight-heavy', String(theme.typography.weights.heavy));
}
```

---

### Task 5: Create React Theme Context & Provider

**Files:**
- Create: `src/core/theme/ThemeContext.tsx`

**Interfaces:**
- Produces: `ThemeProvider`, `useTheme()`, `ThemeMode`

- [ ] **Step 1: Write `src/core/theme/ThemeContext.tsx`**

```tsx
import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ThemeTokens, lightTheme, darkTheme, applyThemeToDocument } from './themes';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  theme: ThemeTokens;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'fintask_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return saved || 'light';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  const resolvedMode: 'light' | 'dark' = useMemo(() => {
    if (mode === 'system') {
      return systemPrefersDark ? 'dark' : 'light';
    }
    return mode;
  }, [mode, systemPrefersDark]);

  const activeTheme = useMemo(() => {
    return resolvedMode === 'dark' ? darkTheme : lightTheme;
  }, [resolvedMode]);

  useEffect(() => {
    applyThemeToDocument(activeTheme);
  }, [activeTheme]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  const toggleTheme = () => {
    const next = resolvedMode === 'light' ? 'dark' : 'light';
    setMode(next);
  };

  return (
    <ThemeContext.Provider value={{ mode, resolvedMode, theme: activeTheme, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

---

### Task 6: Create Barrel Exports

**Files:**
- Create: `src/core/theme/index.ts`
- Create: `src/core/index.ts`

**Interfaces:**
- Produces: `import { ... } from '@/core/theme'` and `import { ... } from '@/core'`

- [ ] **Step 1: Write `src/core/theme/index.ts`**
- [ ] **Step 2: Write `src/core/index.ts`**

---

### Task 7: Integrate `ThemeProvider` in Application Shell

**Files:**
- Modify: `src/main.tsx` or `src/App.tsx`
- Modify: `src/components/SettingsView.tsx` (connect theme selection buttons to `useTheme()`)

- [ ] **Step 1: Wrap `<App />` with `<ThemeProvider>`**
- [ ] **Step 2: Bind SettingsView theme toggles to `useTheme().setMode`**

---

### Task 8: Verification & Quality Assurance

- [ ] **Step 1: Run TypeScript compiler**
Run: `npm run build`
Expected: Zero type errors, successful bundle.

- [ ] **Step 2: Verify in browser**
Inspect live UI on `http://localhost:5173`, verify typography weights feel balanced, crisp, and harmonious across English and Arabic.
