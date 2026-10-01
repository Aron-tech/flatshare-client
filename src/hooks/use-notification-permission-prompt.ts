import { pushNotificationService } from "@/services/notifications/PushNotificationService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PermissionStatus } from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

const STORAGE_KEY = "notification_permission_prompt_shown";

/**
 * A rendszer engedélyablaka helyett előbb egy saját képernyőn elmagyarázzuk, mire kell az értesítés
 * (App Review megjegyzés: a puszta bejelentkezés után, magyarázat nélkül feldobott kérés kevesebb
 * elfogadást hoz). A rendszer ablakát csak azután nyitjuk meg, hogy a felhasználó ezt jóváhagyta itt;
 * a saját képernyőt legfeljebb egyszer mutatjuk, utána a Beállításokból bármikor elérhető.
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
        // Már engedélyezve van (pl. korábbi telepítésből), nincs mit magyarázni.
        await pushNotificationService.register(authToken, { askPermission: false }).catch(() => undefined);
        await AsyncStorage.setItem(STORAGE_KEY, "1").catch(() => {});
        return;
      }

      if (status === "denied") {
        // A rendszer ablakát úgysem tudjuk újra megnyitni innen, a sajátunkat sem érdemes.
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
 * Az aktuális rendszerengedély, a Beállítások képernyőnek: aki a saját ajánlatunkat elutasította,
 * vagy a rendszer ablakában tiltotta le, innen bármikor bekapcsolhatja (App Review javaslat).
 * `null`: nem támogatott eszköz/platform. Frissül, amikor az app előtérbe kerül (pl. a rendszer
 * beállításaiból visszatérve).
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
