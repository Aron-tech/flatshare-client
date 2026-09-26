import * as Localization from "expo-localization";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import hu from "./locales/hu";

export const SUPPORTED_LANGUAGES = ["hu", "en"] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const FALLBACK_LANGUAGE: AppLanguage = "hu";

export function isSupportedLanguage(value: unknown): value is AppLanguage {
  return SUPPORTED_LANGUAGES.includes(value as AppLanguage);
}

function detectDeviceLanguage(): AppLanguage {
  const code = Localization.getLocales()[0]?.languageCode?.toLowerCase();
  return isSupportedLanguage(code) ? code : FALLBACK_LANGUAGE;
}

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources: { hu: { translation: hu }, en: { translation: en } },
  lng: detectDeviceLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** A bejelentkezett felhasználó `language` értéke alapján állítja be a nyelvet. */
export async function applyUserLanguage(language: string | null | undefined) {
  const code = language?.slice(0, 2).toLowerCase();
  if (isSupportedLanguage(code) && code !== i18n.language) {
    await i18n.changeLanguage(code);
  }
}

/** Aktuális nyelvhez tartozó BCP 47 locale a dátumformázáshoz. */
export function currentLocale(): string {
  return i18n.language === "en" ? "en-US" : "hu-HU";
}

export default i18n;
