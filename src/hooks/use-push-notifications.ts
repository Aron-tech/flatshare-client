import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";

/**
 * Az értesítésre koppintáskor a payload `route` mezője szerint navigál.
 * A push token regisztrációja (és a rendszer engedélyablaka) nem itt, hanem a
 * `NotificationPermissionPrompt` saját magyarázó képernyője után történik (App Review 2.1).
 */
export function usePushNotifications() {
  const router = useRouter();

  useEffect(() => {
    const navigate = (response: Notifications.NotificationResponse | null) => {
      const route = response?.notification.request.content.data?.route;
      if (typeof route === "string" && route.startsWith("/")) {
        router.push(route as never);
      }
    };

    // Hidegindításnál az értesítés, amivel megnyitották az appot.
    navigate(Notifications.getLastNotificationResponse());

    const subscription =
      Notifications.addNotificationResponseReceivedListener(navigate);
    return () => subscription.remove();
  }, [router]);
}
