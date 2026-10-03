import { createContext, useContext } from "react";
import { Platform } from "react-native";

import classicAssets from "./font-assets/classic";
import defaultAssets from "./font-assets/default";
import { fontFamilies, typography } from "./tokens";

type Family = keyof typeof fontFamilies;
type Weight = keyof (typeof fontFamilies)["sans"];
type FamilyTable = Record<Family, Record<Weight, string>>;

export type FontAssets = Record<string, number | { uri: string }>;

export interface FontSet {
  /** Without it (system fonts) there is nothing to load. */
  families: FamilyTable | null;
  /**
   * The `require`d fonts are only asset ids; the file is actually loaded only on `Font.loadAsync`,
   * so only for the selected set.
   */
  assets: FontAssets | null;
}

const withSuffix = (sans: string, serif: string, serifMax: Weight = 800): FamilyTable => ({
  sans: {
    400: `${sans}_400Regular`,
    500: `${sans}_500Medium`,
    600: `${sans}_600SemiBold`,
    700: `${sans}_700Bold`,
    800: `${sans}_800ExtraBold`,
  },
  serif: {
    400: `${serif}_400Regular`,
    500: `${serif}_500Medium`,
    600: `${serif}_600SemiBold`,
    700: `${serif}_700Bold`,
    800: serifMax === 800 ? `${serif}_800ExtraBold` : `${serif}_700Bold`,
  },
});

/**
 * Selectable font sets. `default` is the original look; the keys appear in the settings
 * (`settings.font_<id>`) and in the stored preference.
 */
export const FONT_SETS = {
  default: {
    families: fontFamilies as FamilyTable,
    assets: defaultAssets,
  },
  classic: {
    families: withSuffix("Inter", "Lora", 700),
    assets: classicAssets,
  },
  system: { families: null, assets: null },
} satisfies Record<string, FontSet>;

export type FontSetId = keyof typeof FONT_SETS;
export const FONT_SET_IDS = Object.keys(FONT_SETS) as FontSetId[];
export const DEFAULT_FONT_SET: FontSetId = "default";

/** System fonts: the weight comes from `fontWeight` (typography token / `font-*` class). */
const SYSTEM_FAMILIES: Record<Family, string> = {
  sans: Platform.select({ ios: "System", android: "sans-serif", default: "system-ui" }),
  serif: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia, serif" }),
};

/** Text / Input know from this which set is active (re-renders only on a switch). */
export const FontSetContext = createContext<FontSetId>(DEFAULT_FONT_SET);

const WEIGHT_CLASSES: Record<string, Weight> = {
  "font-thin": 400,
  "font-extralight": 400,
  "font-light": 400,
  "font-normal": 400,
  "font-medium": 500,
  "font-semibold": 600,
  "font-bold": 700,
  "font-extrabold": 800,
  "font-black": 800,
};

const TYPOGRAPHY = typography as Record<string, { family: Family; weight: number }>;

/**
 * Returns the exact font file name from the (already merged) className.
 * Considers: `font-sans` / `font-serif`, `font-medium`…`font-extrabold`, and the typography tokens
 * (`text-headline-md` → serif 500). Modifier classes (`dark:`, `active:`…) are not evaluated.
 * As in CSS: an explicit `font-*` class always wins over the token's default.
 */
export function resolveFontFamily(
  className: string | undefined,
  setId: FontSetId = DEFAULT_FONT_SET,
): string {
  let tokenFamily: Family = "sans";
  let tokenWeight: Weight = 400;
  let family: Family | undefined;
  let weight: Weight | undefined;

  for (const cls of (className ?? "").split(/\s+/)) {
    if (!cls || cls.includes(":")) continue;
    if (cls === "font-sans") family = "sans";
    else if (cls === "font-serif") family = "serif";
    else if (cls in WEIGHT_CLASSES) weight = WEIGHT_CLASSES[cls];
    else if (cls.startsWith("text-")) {
      const token = TYPOGRAPHY[cls.slice(5)];
      if (token) {
        tokenFamily = token.family;
        tokenWeight = token.weight as Weight;
      }
    }
  }

  const resolved = family ?? tokenFamily;
  const table = FONT_SETS[setId].families;
  return table ? table[resolved][weight ?? tokenWeight] : SYSTEM_FAMILIES[resolved];
}

export function useFontFamily(className: string | undefined): string {
  return resolveFontFamily(className, useContext(FontSetContext));
}
