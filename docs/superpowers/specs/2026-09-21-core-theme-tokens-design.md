# Core Theme, Colors, and Typography Architecture Specification

**Author:** Antigravity  
**Date:** 2026-09-21  
**Status:** Approved  
**Classification:** Architectural (Core Design System Primitive)

---

## 1. Executive Summary & Intent

This specification formalizes the core design foundations (themes, colors, typography, spacing, and elevation) for the Fintask application, bringing it to the architectural standard of top-tier production projects (e.g. Linear, Vercel, Radix, GitHub Primer).

Previously, design tokens were declared strictly in CSS variables (`src/design-system/01-tokens.css`). This specification introduces an enterprise-grade, strongly typed TypeScript core under `src/core/theme/` that acts as the single source of truth for all components, dynamic charts, theme toggles, and CSS stylesheets.

---

## 2. Architectural Structure

```
src/
└── core/
    ├── theme/
    │   ├── colors.ts        # Primitive color palettes & semantic theme mappings
    │   ├── typography.ts    # Multi-lingual font stack (Latin + Arabic), scale, refined weights
    │   ├── spacing.ts       # Spacing grid, border radii, shadows, and transition curves
    │   ├── themes.ts        # Full Light & Dark theme contracts and definitions
    │   ├── ThemeContext.tsx # React Context provider with localStorage and system preference sync
    │   └── index.ts         # Module entry point & barrel export
    └── index.ts             # Core entry point
```

---

## 3. Detailed Token Specifications

### 3.1. Colors (`src/core/theme/colors.ts`)

#### Primitive Palettes
- **Paper & Neutrals:**
  - `canvas`: `#FAF9F6` (Warm Paper off-white)
  - `card`: `#FFFFFF`
  - `sidebar`: `#F4F3F0` (Creamy warm surface)
  - `charcoal`: `#1A1A1A` (Primary off-black text)
  - `muted`: `#666666` (Subdued steel)
  - `placeholder`: `#B2B0A9` (Warm gray)
  - `border`: `#E6E5E0` (Soft border gray)
- **Brand & Accents:**
  - `forest`: `#0E4F2F` (Primary action green)
  - `forestHover`: `#0A3C23`
  - `purple`: `#8A5CF5` (Brand accent purple)
  - `purpleLight`: `#F1EAFF`
  - `orange`: `#F05A28` (Brand orange)
  - `lime`: `#E5FF60` (High-contrast yellow-lime highlight)
  - `red`: `#D32F2F` / `#A31D1D` (Destructive actions & alerts)

#### Dark Palette Mappings
- `canvasDark`: `#0F0F11`
- `cardDark`: `#17171A`
- `sidebarDark`: `#141416`
- `textMainDark`: `#F4F4F6`
- `textMutedDark`: `#9E9EA8`
- `borderDark`: `#27272A`

---

### 3.2. Typography (`src/core/theme/typography.ts`)

#### Font Families
- **Sans (Latin Primary):** `'Satoshi', 'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif`
- **Display (Headings & Hero):** `'Cabinet Grotesk', 'Satoshi', 'Outfit', system-ui, sans-serif`
- **Arabic (Bilingual Harmony):** `'Alexandria', 'Tajawal', system-ui, sans-serif`
- **Mono (Metrics, Financials & Code):** `'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace`

#### Balanced Font Weights
In accordance with modern UI design standards and addressing the excessive bold weight issue:
- `regular`: `400`
- `medium`: `500`
- `semibold`: `600` (used for active buttons, badges, secondary titles)
- `bold`: `650` (used for section headers and prominent cards)
- `heavy`: `700` (maximum weight reserved for hero headlines & KPI numbers)

#### Scale & Leading
- `xs`: `0.68rem` / `1.3`
- `sm`: `0.78rem` / `1.35`
- `base`: `0.88rem` / `1.4`
- `md`: `1.0rem` / `1.4`
- `lg`: `1.15rem` / `1.3`
- `xl`: `1.4rem` / `1.2`
- `2xl`: `1.85rem` / `1.15`
- `3xl`: `2.4rem` / `1.1`

---

### 3.3. Spacing & Elevation (`src/core/theme/spacing.ts`)

- **Radii:**
  - `sm`: `8px`
  - `md`: `12px`
  - `lg`: `20px`
  - `pill`: `9999px`
- **Shadows:**
  - `sm`: `0 2px 5px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.03)`
  - `md`: `0 4px 14px rgba(0,0,0,0.03), 0 2px 6px rgba(0,0,0,0.03)`
  - `lg`: `0 20px 40px rgba(26,26,26,0.04), 0 4px 10px rgba(26,26,26,0.02)`
- **Transitions:**
  - `smooth`: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`
  - `fast`: `all 0.15s cubic-bezier(0.4, 0, 0.2, 1)`

---

### 3.4. Theming Engine (`src/core/theme/ThemeContext.tsx` & `themes.ts`)

- **Theme Contract:** Type `ThemeTokens` enforcing complete semantic parity between Light and Dark mode.
- **Dynamic HTML Sync:** Toggling theme applies `data-theme="dark" | "light"` to the `<html>` root and updates CSS variables synchronously.
- **Persistence:** Automatically syncs with `localStorage.getItem('fintask_theme_mode')`.

---

## 4. Integration with Existing CSS Architecture

- `src/design-system/01-tokens.css` will be maintained as the CSS representation of the TypeScript tokens, ensuring complete compatibility with all existing CSS classes (`.nav-btn`, `.kpi-card`, `.client-card`, etc.).
- React components can either consume CSS classes or import typed tokens directly (`import { colors, typography } from '@/core/theme'`).

---

## 5. Verification & Acceptance Criteria

1. All core files compile with strict TypeScript (`tsc --noEmit`).
2. `npm run build` succeeds without warnings or missing exports.
3. `ThemeProvider` wraps the app shell seamlessly.
4. Switching themes persists properly across page refreshes.
5. All typography adheres to the refined, softened font weights (`400`-`700`).
