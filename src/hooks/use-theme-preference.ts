import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "theme_preference";
const isPreference = (v: unknown): v is ThemePreference =>
  v === "system" || v === "light" || v === "dark";

/** Elmentett témabeállítás betöltése és a Nativewindre alkalmazása (app indulásakor). */
export function useApplyStoredTheme() {
  const { setColorScheme } = useColorScheme();
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (isPreference(v)) setColorScheme(v);
      })
      .catch(() => {});
  }, [setColorScheme]);
}

/** Téma választása a Beállításokban; a választás tárolódik. */
export function useThemePreference() {
  const { setColorScheme } = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => isPreference(v) && setPreference(v))
      .catch(() => {});
  }, []);

  const update = useCallback(
    (next: ThemePreference) => {
      setPreference(next);
      setColorScheme(next);
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    },
    [setColorScheme]
  );

  return { preference, setPreference: update };
}
