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

/** A felhasználó által választott kinézet (a sötét/világos mód külön él: use-theme-preference). */
export interface Appearance {
  palette: PaletteId;
  font: FontSetId;
  icons: IconSetId;
}

const DEFAULTS: Appearance = {
  palette: DEFAULT_PALETTE,
  font: DEFAULT_FONT_SET,
  icons: DEFAULT_ICON_SET,
};

const STORAGE_KEY = "appearance_preferences";

const pick = <T extends string>(ids: readonly T[], value: unknown, fallback: T): T =>
  ids.includes(value as T) ? (value as T) : fallback;

/** Tárolt JSON → érvényes preferencia; az ismeretlen / hiányzó mező az alapértelmezett. */
function parse(raw: string | null): Appearance {
  let data: Partial<Record<keyof Appearance, unknown>> = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {}
  return {
    palette: pick(PALETTE_IDS, data.palette, DEFAULTS.palette),
    font: pick(FONT_SET_IDS, data.font, DEFAULTS.font),
    icons: pick(ICON_SET_IDS, data.icons, DEFAULTS.icons),
  };
}

/** Betölti (ha kell) a készlet fontjait; a már regisztrált készletet nem tölti újra. */
async function ensureFont(id: FontSetId) {
  const { assets } = FONT_SETS[id];
  if (!assets) return;
  const missing = Object.fromEntries(Object.entries(assets).filter(([name]) => !Font.isLoaded(name)));
  if (Object.keys(missing).length) await Font.loadAsync(missing);
}

interface AppearanceValue extends Appearance {
  /** Fonthiba esetén a promise elutasít, és a korábbi készlet marad. */
  setAppearance: (patch: Partial<Appearance>) => Promise<void>;
  reset: () => Promise<void>;
}

const AppearanceContext = createContext<AppearanceValue | null>(null);

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error("useAppearance az AppearanceProvider-en belül használható");
  return value;
}

/** A választott paletta CSS változói a teljes fa fölött. */
function PaletteRoot({ children }: { children: ReactNode }) {
  const palette = useContext(PaletteContext);
  const scheme = useThemeName();
  // Mindig (az első rendertől) van `vars()` – lásd `paletteCssVars`.
  const style = useMemo(() => vars(paletteCssVars(palette, scheme)), [palette, scheme]);
  return (
    <View className="flex-1" style={style}>
      {children}
    </View>
  );
}

/**
 * Betölti a tárolt kinézetet és a hozzá tartozó fontot, és csak utána renderel
 * (a splash addig marad) – így nincs villanás az alapértelmezett és a választott között.
 * Váltáskor a font előbb betöltődik, és csak utána cserélődik a készlet.
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
      // Hiba esetén (pl. hiányzó font) az alapértelmezett készlet marad.
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
