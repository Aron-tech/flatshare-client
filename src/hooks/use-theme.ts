/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { buildNavTheme } from '@/constants/theme';
import { PaletteContext, resolveThemeColors } from '@/theme/palettes';
import { useColorScheme } from 'nativewind';
import { useContext, useMemo } from 'react';

/** Aktuális (light/dark) téma neve – ugyanaz a forrás, amit a Nativewind `dark:` is használ. */
export function useThemeName() {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? 'dark' : 'light';
}

/** Hex színek natív propokhoz a választott palettával (placeholderTextColor, RefreshControl tintColor stb.). */
export function useThemeColors() {
  return resolveThemeColors(useContext(PaletteContext), useThemeName());
}

/** React Navigation téma a `ThemeProvider`-hez. */
export function useNavTheme() {
  const name = useThemeName();
  const colors = useThemeColors();
  return useMemo(() => buildNavTheme(name, colors), [name, colors]);
}
