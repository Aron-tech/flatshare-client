import { THEME, type ThemeColors, type ThemeName } from "@/constants/theme";
import { createContext } from "react";

type ColorTokens = { -readonly [K in keyof ThemeColors]: string };
type Overrides = Partial<ColorTokens>;

/** Builds every palette-dependent token from one accent tone. */
const accent = (primary: string, active: string, soft: string, softForeground: string): Overrides => ({
  primary,
  primaryActive: active,
  primarySoft: soft,
  primarySoftForeground: softForeground,
  accent: soft,
  accentForeground: softForeground,
  ring: primary,
});

/**
 * Selectable color sets. Each has a separate light and dark variant; tokens that are not overridden
 * (background, card, success, error…) come from the base theme.
 * `terracotta` is the original look → no override, `global.css` applies.
 */
export const PALETTES = {
  terracotta: { swatch: "#D87758", light: {}, dark: {} },
  ocean: {
    swatch: "#3F7CAC",
    light: accent("#3F7CAC", "#33688F", "#E6EFF6", "#33688F"),
    dark: accent("#3F7CAC", "#33688F", "#1F2B36", "#A9CCE8"),
  },
  plum: {
    swatch: "#8E5A9B",
    light: accent("#8E5A9B", "#784A84", "#F3EAF5", "#784A84"),
    dark: accent("#8E5A9B", "#784A84", "#2E2232", "#DDB8E6"),
  },
  honey: {
    swatch: "#B0701C",
    light: accent("#B0701C", "#96601A", "#F8EEDD", "#96601A"),
    dark: accent("#B0701C", "#96601A", "#33281A", "#F0C98A"),
  },
} satisfies Record<string, { swatch: string; light: Overrides; dark: Overrides }>;

export type PaletteId = keyof typeof PALETTES;
export const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[];
export const DEFAULT_PALETTE: PaletteId = "terracotta";

/** The active palette (re-renders only on a switch). */
export const PaletteContext = createContext<PaletteId>(DEFAULT_PALETTE);

/** "#RRGGBB" + opacity → "rgba(…)" (e.g. for palette-matching shadows). */
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** "#RRGGBB" → "h s% l%" (the shadcn HSL triplet format of `global.css`). */
function hexToHslTriplet(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  const f = (n: number) => Math.round(n * 10) / 10;
  return `${f(h)} ${f(s * 100)}% ${f(l * 100)}%`;
}

const colorCache = new Map<string, ThemeColors>();

/** The theme's hex colors merged with the chosen palette (for native props; stable reference). */
export function resolveThemeColors(palette: PaletteId, scheme: ThemeName): ThemeColors {
  const key = `${palette}:${scheme}`;
  let colors = colorCache.get(key);
  if (!colors) {
    colors = { ...THEME[scheme], ...PALETTES[palette][scheme] } as ThemeColors;
    colorCache.set(key, colors);
  }
  return colors;
}

/** Every token any palette overrides (so every palette has the same key set). */
const PALETTE_KEYS = [
  ...new Set(
    Object.values(PALETTES).flatMap((p) => [...Object.keys(p.light), ...Object.keys(p.dark)]),
  ),
] as (keyof ThemeColors)[];

const varsCache = new Map<string, Record<string, string>>();

/**
 * CSS variables to pass to Nativewind's `vars()`. For the base palette it also gives the full key set
 * (with values matching global.css): if a component only gets variables later, Nativewind remounts
 * the whole tree below it.
 */
export function paletteCssVars(palette: PaletteId, scheme: ThemeName): Record<string, string> {
  const key = `${palette}:${scheme}`;
  let cssVars = varsCache.get(key);
  if (!cssVars) {
    const colors = resolveThemeColors(palette, scheme);
    cssVars = Object.fromEntries(
      PALETTE_KEYS.map((token) => [`--${kebab(token)}`, hexToHslTriplet(colors[token])]),
    );
    varsCache.set(key, cssVars);
  }
  return cssVars;
}
