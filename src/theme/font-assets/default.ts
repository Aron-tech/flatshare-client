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

import { fontFamilies } from "../tokens";

/** Alapértelmezett készlet: Plus Jakarta Sans + Newsreader. */
export default {
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
