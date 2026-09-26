/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { NAV_THEME, THEME } from '@/constants/theme';
import { useColorScheme } from 'nativewind';

/** Aktuális (light/dark) téma neve – ugyanaz a forrás, amit a Nativewind `dark:` is használ. */
export function useThemeName() {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? 'dark' : 'light';
}

/** Hex színek natív propokhoz (placeholderTextColor, RefreshControl tintColor stb.). */
export function useThemeColors() {
  return THEME[useThemeName()];
}

/** React Navigation téma a `ThemeProvider`-hez. */
export function useNavTheme() {
  return NAV_THEME[useThemeName()];
}
