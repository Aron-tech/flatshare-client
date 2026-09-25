// Súlyonkénti al-útvonalról importálunk: a csomag főindexe mind a 14 vágást
// (dőlteket is) behúzná a bundle-be.
import { Newsreader_400Regular } from "@expo-google-fonts/newsreader/400Regular";
import { Newsreader_500Medium } from "@expo-google-fonts/newsreader/500Medium";
import { Newsreader_600SemiBold } from "@expo-google-fonts/newsreader/600SemiBold";
import { Newsreader_700Bold } from "@expo-google-fonts/newsreader/700Bold";
import { Newsreader_800ExtraBold } from "@expo-google-fonts/newsreader/800ExtraBold";
import { PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans/400Regular";
import { PlusJakartaSans_500Medium } from "@expo-google-fonts/plus-jakarta-sans/500Medium";
import { PlusJakartaSans_600SemiBold } from "@expo-google-fonts/plus-jakarta-sans/600SemiBold";
import { PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans/700Bold";
import { PlusJakartaSans_800ExtraBold } from "@expo-google-fonts/plus-jakarta-sans/800ExtraBold";

import { fontFamilies, typography } from "./tokens";

/** A root layout `useFonts`-a ezt tölti be. A kulcsok = `tokens.js` fontFamilies nevei. */
export const FONT_ASSETS = {
  [fontFamilies.sans[400]]: PlusJakartaSans_400Regular,
  [fontFamilies.sans[500]]: PlusJakartaSans_500Medium,
  [fontFamilies.sans[600]]: PlusJakartaSans_600SemiBold,
  [fontFamilies.sans[700]]: PlusJakartaSans_700Bold,
  [fontFamilies.sans[800]]: PlusJakartaSans_800ExtraBold,
  [fontFamilies.serif[400]]: Newsreader_400Regular,
  [fontFamilies.serif[500]]: Newsreader_500Medium,
  [fontFamilies.serif[600]]: Newsreader_600SemiBold,
  [fontFamilies.serif[700]]: Newsreader_700Bold,
  [fontFamilies.serif[800]]: Newsreader_800ExtraBold,
};

type Family = keyof typeof fontFamilies;
type Weight = keyof (typeof fontFamilies)["sans"];

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

const TYPOGRAPHY = typography as Record<
  string,
  { family: Family; weight: number }
>;

/**
 * A (már összefésült) className alapján visszaadja a pontos fontfájl nevét.
 * Figyelembe veszi: `font-sans` / `font-serif`, `font-medium`…`font-extrabold`,
 * és a tipográfiai tokeneket (`text-headline-md` → Newsreader 500).
 * Módosítós osztályokat (`dark:`, `active:`…) nem értékel ki.
 * Mint a CSS-ben: az explicit `font-*` osztály mindig nyer a token alapértékével szemben.
 */
export function resolveFontFamily(className: string | undefined): string {
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

  return fontFamilies[family ?? tokenFamily][weight ?? tokenWeight];
}
