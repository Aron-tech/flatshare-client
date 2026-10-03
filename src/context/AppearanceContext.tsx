import { useThemeName } from "@/hooks/use-theme";
import {
  DEFAULT_FONT_SET,
  FONT_SETS,
  FONT_SET_IDS,
  FontSetContext,
  type FontSetId,
} from "@/theme/fonts";
import {
  DEFAULT_ICON_SET,
  ICON_SET_IDS,
  IconSetContext,
  type IconSetId,
} from "@/theme/icon-sets";
import {
  DEFAULT_PALETTE,
  PALETTE_IDS,
  PaletteContext,
  type PaletteId,
  paletteCssVars,
} from "@/theme/palettes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Font from "expo-font";
import { vars } from "nativewind";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { View } from "react-native";

/** The appearance chosen by the user (dark/light mode lives separately: use-theme-preference). */
export interface Appearance {
  palette: PaletteId;
  font: FontSetId;
  icons: IconSetId;
  /** Wavy (sea-like) animation on the bar of the sticker album's sticker in progress. */
  stickerWaves: boolean;
}

const DEFAULTS: Appearance = {
  palette: DEFAULT_PALETTE,
  font: DEFAULT_FONT_SET,
  icons: DEFAULT_ICON_SET,
  stickerWaves: true,
};

const STORAGE_KEY = "appearance_preferences";

const pick = <T extends string>(ids: readonly T[], value: unknown, fallback: T): T =>
  ids.includes(value as T) ? (value as T) : fallback;

/** Stored JSON → valid preference; an unknown / missing field falls back to the default. */
function parse(raw: string | null): Appearance {
  let data: Partial<Record<keyof Appearance, unknown>> = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {}
  return {
    palette: pick(PALETTE_IDS, data.palette, DEFAULTS.palette),
    font: pick(FONT_SET_IDS, data.font, DEFAULTS.font),
    icons: pick(ICON_SET_IDS, data.icons, DEFAULTS.icons),
    stickerWaves: typeof data.stickerWaves === "boolean" ? data.stickerWaves : DEFAULTS.stickerWaves,
  };
}

/** Loads the set's fonts (if needed); an already registered set is not loaded again. */
async function ensureFont(id: FontSetId) {
  const { assets } = FONT_SETS[id];
  if (!assets) return;
  const missing = Object.fromEntries(Object.entries(assets).filter(([name]) => !Font.isLoaded(name)));
  if (Object.keys(missing).length) await Font.loadAsync(missing);
}

interface AppearanceValue extends Appearance {
  /** On a font error the promise rejects and the previous set stays. */
  setAppearance: (patch: Partial<Appearance>) => Promise<void>;
  reset: () => Promise<void>;
}

const AppearanceContext = createContext<AppearanceValue | null>(null);

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error("useAppearance az AppearanceProvider-en belül használható");
  return value;
}

/** CSS variables of the chosen palette above the whole tree. */
function PaletteRoot({ children }: { children: ReactNode }) {
  const palette = useContext(PaletteContext);
  const scheme = useThemeName();
  // There is always (from the first render) a `vars()` – see `paletteCssVars`.
  const style = useMemo(() => vars(paletteCssVars(palette, scheme)), [palette, scheme]);
  return (
    <View className="flex-1" style={style}>
      {children}
    </View>
  );
}

/**
 * Loads the stored appearance and its font, and only then renders (the splash stays until then) – so there
 * is no flash between the default and the chosen one. On a change the font loads first, and only then is the set swapped.
 */
export function AppearanceProvider({
  children,
  onReady,
}: {
  children: ReactNode;
  onReady?: () => void;
}) {
  const [appearance, setState] = useState<Appearance | null>(null);

  useEffect(() => {
    (async () => {
      const stored = parse(await AsyncStorage.getItem(STORAGE_KEY).catch(() => null));
      // On an error (e.g. a missing font) the default set stays.
      await ensureFont(stored.font).catch(() => {
        stored.font = DEFAULTS.font;
        return ensureFont(stored.font).catch(() => {});
      });
      setState(stored);
    })();
  }, []);

  useEffect(() => {
    if (appearance) onReady?.();
  }, [appearance, onReady]);

  const setAppearance = useCallback(
    async (patch: Partial<Appearance>) => {
      const next = { ...(appearance ?? DEFAULTS), ...patch };
      if (next.font !== appearance?.font) await ensureFont(next.font);
      setState(next);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
    },
    [appearance],
  );

  const reset = useCallback(() => setAppearance(DEFAULTS), [setAppearance]);

  const value = useMemo(
    () => (appearance ? { ...appearance, setAppearance, reset } : null),
    [appearance, setAppearance, reset],
  );

  if (!value) return null;

  return (
    <AppearanceContext.Provider value={value}>
      <PaletteContext.Provider value={value.palette}>
        <FontSetContext.Provider value={value.font}>
          <IconSetContext.Provider value={value.icons}>
            <PaletteRoot>{children}</PaletteRoot>
          </IconSetContext.Provider>
        </FontSetContext.Provider>
      </PaletteContext.Provider>
    </AppearanceContext.Provider>
  );
}
