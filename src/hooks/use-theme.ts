/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { buildNavTheme } from '@/constants/theme';
import { PaletteContext, resolveThemeColors } from '@/theme/palettes';
import { useColorScheme } from 'nativewind';
import { useContext, useMemo } from 'react';

/** Name of the current (light/dark) theme – the same source Nativewind's `dark:` uses. */
export function useThemeName() {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? 'dark' : 'light';
}

/** Hex colors for native props with the chosen palette (placeholderTextColor, RefreshControl tintColor etc.). */
export function useThemeColors() {
  return resolveThemeColors(useContext(PaletteContext), useThemeName());
}

/** React Navigation theme for the `ThemeProvider`. */
export function useNavTheme() {
  const name = useThemeName();
  const colors = useThemeColors();
  return useMemo(() => buildNavTheme(name, colors), [name, colors]);
}
