import { useAuth } from "@/context/AuthContext";
import { pushNotificationService } from "@/services/notifications/PushNotificationService";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";

/**
 * Bejelentkezett felhasználónál regisztrálja az eszköz push tokenjét,
 * és a értesítésre koppintáskor a payload `route` mezője szerint navigál.
 */
export function usePushNotifications() {
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) return;

    pushNotificationService
      .register(token)
      .catch((error) =>
        console.error("[usePushNotifications] Regisztráció sikertelen:", error)
      );
  }, [token]);

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
