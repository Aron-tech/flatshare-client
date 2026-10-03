/**
 * Design tokens (DESIGN.md – "Warm Organic Minimalist").
 *
 * This file is the single source for typography, fonts, radii and spacing. `tailwind.config.js` and
 * the `Text` component both read from here. COLORS are in `global.css` (shadcn CSS variables) and are
 * reachable from JS through the `THEME` object of `src/constants/theme.ts`.
 *
 * CommonJS, because `tailwind.config.js` loads it with `require`.
 */

/**
 * Font families per weight. On SDK 57 only one file can be loaded under a family name, so every weight
 * is registered under its own name (see `fonts.ts`). `Text` picks the right one from the `font-*` weight class.
 */
const fontFamilies = {
  sans: {
    400: "PlusJakartaSans_400Regular",
    500: "PlusJakartaSans_500Medium",
    600: "PlusJakartaSans_600SemiBold",
    700: "PlusJakartaSans_700Bold",
    800: "PlusJakartaSans_800ExtraBold",
  },
  serif: {
    400: "Newsreader_400Regular",
    500: "Newsreader_500Medium",
    600: "Newsreader_600SemiBold",
    700: "Newsreader_700Bold",
    800: "Newsreader_800ExtraBold",
  },
};

/**
 * Typography scale. Usage: `text-headline-md`, `text-body-sm`, `text-label-lg`…
 * `family` decides which font family `Text` picks. letterSpacing is in px (em × fontSize), because em is not supported natively.
 */
const typography = {
  "headline-xl": { family: "serif", size: 40, lineHeight: 48, weight: 400, tracking: -0.4 },
  "headline-xl-mobile": { family: "serif", size: 32, lineHeight: 40, weight: 400, tracking: -0.32 },
  "headline-lg": { family: "serif", size: 30, lineHeight: 38, weight: 400, tracking: -0.15 },
  "headline-md": { family: "serif", size: 24, lineHeight: 32, weight: 500, tracking: 0 },
  "headline-sm": { family: "serif", size: 20, lineHeight: 28, weight: 500, tracking: 0 },
  "body-lg": { family: "sans", size: 17, lineHeight: 26, weight: 400, tracking: 0.17 },
  "body-md": { family: "sans", size: 15, lineHeight: 24, weight: 400, tracking: 0.15 },
  "body-sm": { family: "sans", size: 13, lineHeight: 20, weight: 400, tracking: 0.13 },
  "label-lg": { family: "sans", size: 14, lineHeight: 20, weight: 600, tracking: 0.28 },
  "label-md": { family: "sans", size: 12, lineHeight: 18, weight: 600, tracking: 0.36 },
  "label-sm": { family: "sans", size: 11, lineHeight: 16, weight: 500, tracking: 0.44 },
};

/** Radii. Semantic names for the components + the DESIGN.md scale. */
const radius = {
  sm: "0.25rem",
  DEFAULT: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  input: "0.75rem", // 12px – beviteli mezők, inset konténerek
  container: "1rem", // 16px – nagyobb konténerek, alertek, bottom sheet
  card: "1.25rem", // 20px – kártyák
};

/** Spacing from DESIGN.md (alongside Tailwind's 4px scale). */
const spacing = {
  gutter: "1.25rem", // 20px – mobil margó és gutter
  "gutter-desktop": "2rem",
};

module.exports = { fontFamilies, typography, radius, spacing };
