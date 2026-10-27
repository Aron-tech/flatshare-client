import { Config } from "@/config/env";
import type { HouseholdSettings } from "@/types/household";
import { ExtensionStorage } from "@bacons/apple-targets";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/** The app group shared with the iOS widget extension (`targets/widget`). */
const APP_GROUP: string | undefined =
  Constants.expoConfig?.ios?.entitlements?.["com.apple.security.application-groups"]?.[0];

const SESSION_KEY = "session";
/** The widget's own cache and state, cleared on sign-out (targets/widget/Snapshot.swift). */
const WIDGET_KEYS = ["snapshot", "recent_done", "last_error"];
const TOKEN_KEY = "auth_token";

// The widget reads the token with exactly this keychain query (targets/widget/Session.swift).
const TOKEN_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: "widget",
  accessGroup: APP_GROUP,
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

const storage = Platform.OS === "ios" && APP_GROUP ? new ExtensionStorage(APP_GROUP) : null;

export interface WidgetSession {
  householdId: number;
  language: string;
  settings: HouseholdSettings | null;
}

/** The last written state, so unchanged sessions do not touch the keychain again. */
let lastSynced: string | null = null;

/** Gives the widgets what they need to fetch on their own: API address, token, household, language. */
export async function syncWidgetSession(token: string, session: WidgetSession): Promise<void> {
  if (!storage) return;
  const reset = session.settings?.reset;
  const value = {
    base_url: Config.BACKEND_URL,
    app_key: Config.APP_KEY,
    household_id: session.householdId,
    language: session.language,
    house_enabled: Config.HOUSE_ENABLED ? 1 : 0,
    reset_period: reset?.period ?? "weekly",
    reset_day_of_week: reset?.day_of_week ?? 1,
    reset_day_of_month: reset?.day_of_month ?? 1,
  };
  const key = JSON.stringify([token, value]);
  if (key === lastSynced) return;
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token, TOKEN_OPTIONS);
    storage.set(SESSION_KEY, value);
    lastSynced = key;
    ExtensionStorage.reloadWidget();
  } catch (error) {
    // Widgets are optional (e.g. Expo Go has no app group entitlement); the app works without them.
    console.warn("[WidgetSync] Failed to share the session with the widgets:", error);
  }
}

/** After signing out the widgets show the sign-in state and keep nothing of the account. */
export async function clearWidgetSession(): Promise<void> {
  if (!storage) return;
  lastSynced = null;
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY, TOKEN_OPTIONS);
  } catch {
    // Nothing was stored.
  }
  storage.remove(SESSION_KEY);
  WIDGET_KEYS.forEach((key) => storage.remove(key));
  ExtensionStorage.reloadWidget();
}

/** The widgets refetch (e.g. after a completion in the app). */
export function reloadWidgets(): void {
  if (storage) ExtensionStorage.reloadWidget();
}
