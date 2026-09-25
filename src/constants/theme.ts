/**
 * JS-oldali téma (DESIGN.md – "Warm Organic Minimalist").
 *
 * A komponensek elsősorban Nativewind osztályokkal (`bg-primary`, `text-muted-foreground`…)
 * dolgoznak, amik a `global.css` CSS változóiból jönnek. Ez a fájl azokhoz a helyekhez kell,
 * ahol natív prop vár színt (navigáció, RefreshControl, tab bar, placeholder stb.).
 *
 * FONTOS: a `THEME` értékeinek egyezniük kell a `global.css` változóival.
 */

import "../../global.css";

import { DarkTheme, DefaultTheme, type Theme } from "expo-router";
import { Platform } from "react-native";

export const THEME = {
  light: {
    background: "#FDFBF7",
    foreground: "#2C2B29",
    card: "#FFFFFF",
    cardForeground: "#2C2B29",
    popover: "#FFFFFF",
    popoverForeground: "#2C2B29",
    primary: "#D87758",
    primaryForeground: "#FFFFFF",
    primaryActive: "#C66A4D",
    primarySoft: "#FAEDE8",
    primarySoftForeground: "#D87758",
    secondary: "#F5F2EB",
    secondaryForeground: "#2C2B29",
    secondaryActive: "#EFECE3",
    muted: "#F5F2EB",
    mutedForeground: "#706E6B",
    accent: "#FAEDE8",
    accentForeground: "#D87758",
    success: "#7C9D86",
    successForeground: "#FFFFFF",
    successActive: "#5E826A",
    successSoft: "#EDF3EE",
    successSoftForeground: "#5E826A",
    destructive: "#BA1A1A",
    destructiveForeground: "#FFFFFF",
    border: "#E8E4DA",
    input: "#D4CFBF",
    ring: "#D87758",
    placeholder: "#9E9B95",
  },
  dark: {
    background: "#1C1B1A",
    foreground: "#F4F0EC",
    card: "#262523",
    cardForeground: "#F4F0EC",
    popover: "#2A2927",
    popoverForeground: "#F4F0EC",
    primary: "#D87758",
    primaryForeground: "#FFFFFF",
    primaryActive: "#C66A4D",
    primarySoft: "#3A2A24",
    primarySoftForeground: "#FFB59E",
    secondary: "#31302E",
    secondaryForeground: "#F4F0EC",
    secondaryActive: "#3B3936",
    muted: "#31302E",
    mutedForeground: "#B5AFA8",
    accent: "#3A2A24",
    accentForeground: "#FFB59E",
    success: "#7C9D86",
    successForeground: "#FFFFFF",
    successActive: "#5E826A",
    successSoft: "#26332B",
    successSoftForeground: "#ACCFB6",
    destructive: "#FFB4AB",
    destructiveForeground: "#690005",
    border: "#3B3936",
    input: "#55524E",
    ring: "#D87758",
    placeholder: "#8A857E",
  },
} as const;

export type ThemeName = keyof typeof THEME;
export type ThemeColors = (typeof THEME)[ThemeName];

/** React Navigation téma, hogy a stack / modal háttér ne villanjon fehéren-feketén. */
export const NAV_THEME: Record<ThemeName, Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};

/**
 * Elevation – "sun-diffused ambient illumination" (DESIGN.md → Elevation & Depth).
 * RN `boxShadow` stílus (New Architecture, iOS + Android).
 */
export const Elevation = {
  /** Kártyák, polcok */
  level1: {
    boxShadow:
      "0px 4px 20px -2px rgba(198, 106, 77, 0.04), 0px 2px 6px -1px rgba(44, 43, 41, 0.03)",
  },
  /** Lebegő gombok, aktív dialógusok, menük, toast */
  level2: {
    boxShadow:
      "0px 12px 32px -4px rgba(198, 106, 77, 0.08), 0px 4px 12px -2px rgba(44, 43, 41, 0.04)",
  },
} as const;

/* ---------------------------------------------------------------------------
 * Expo template helper-ek (ThemedText / ThemedView / explore / app-tabs).
 * A meleg palettára vannak kötve, hogy a régi képernyők se lógjanak ki.
 * ------------------------------------------------------------------------ */

export const Colors = {
  light: {
    text: THEME.light.foreground,
    background: THEME.light.background,
    backgroundElement: THEME.light.secondary,
    backgroundSelected: THEME.light.secondaryActive,
    textSecondary: THEME.light.mutedForeground,
  },
  dark: {
    text: THEME.dark.foreground,
    background: THEME.dark.background,
    backgroundElement: THEME.dark.secondary,
    backgroundSelected: THEME.dark.secondaryActive,
    textSecondary: THEME.dark.mutedForeground,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** DESIGN.md mobil margó / gutter (1.25rem). Egyezik a `px-gutter` osztállyal. */
export const Gutter = 20;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
