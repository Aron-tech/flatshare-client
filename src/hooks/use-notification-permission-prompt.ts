import { pushNotificationService } from "@/services/notifications/PushNotificationService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PermissionStatus } from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

const STORAGE_KEY = "notification_permission_prompt_shown";

/**
 * Instead of the system permission dialog we first explain on our own screen what the notifications are for
 * (App Review note: a request thrown up right after sign-in without an explanation gets less acceptance).
 * The system dialog is only opened after the user approved here; our own screen is shown at most once,
 * afterwards it is reachable from Settings at any time.
 */
export function useNotificationPermissionPrompt(active: boolean, authToken: string | null) {
  const [visible, setVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!active || !authToken) return;
    let cancelled = false;

    (async () => {
      const alreadyShown = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);
      if (alreadyShown || cancelled) return;

      const status = await pushNotificationService.getPermissionStatus();
      if (cancelled) return;

      if (status === null) return; // nem támogatott eszköz/platform

      if (status === "granted") {
        // Already allowed (e.g. from an earlier install), nothing to explain.
        await pushNotificationService.register(authToken, { askPermission: false }).catch(() => undefined);
        await AsyncStorage.setItem(STORAGE_KEY, "1").catch(() => {});
        return;
      }

      if (status === "denied") {
        // We cannot reopen the system dialog from here anyway, so ours is not worth showing either.
        await AsyncStorage.setItem(STORAGE_KEY, "1").catch(() => {});
        return;
      }

      setVisible(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [active, authToken]);

  const markShown = useCallback(() => {
    AsyncStorage.setItem(STORAGE_KEY, "1").catch(() => {});
  }, []);

  const enable = useCallback(async () => {
    if (!authToken) return;
    setRequesting(true);
    try {
      await pushNotificationService.register(authToken, { askPermission: true });
    } finally {
      setRequesting(false);
      setVisible(false);
      markShown();
    }
  }, [authToken, markShown]);

  return { visible, requesting, enable };
}

/**
 * The current system permission, for the Settings screen: whoever declined our offer or blocked it in the
 * system dialog can turn it on here at any time (App Review suggestion). `null`: unsupported device/platform.
 * Updates when the app comes to the foreground (e.g. returning from the system settings).
 */
export function useNotificationPermissionStatus(authToken: string | null) {
  const [status, setStatus] = useState<PermissionStatus | null | "loading">("loading");

  const refresh = useCallback(() => {
    pushNotificationService.getPermissionStatus().then(setStatus);
  }, []);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const enable = useCallback(async () => {
    if (!authToken) return;
    await pushNotificationService.register(authToken, { askPermission: true });
    refresh();
  }, [authToken, refresh]);

  return { status, enable };
}
