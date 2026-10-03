import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";

/**
 * On tapping a notification, navigates by the payload's `route` field. The push token registration (and the
 * system permission dialog) does not happen here but after the `NotificationPermissionPrompt` explainer screen (App Review 2.1).
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

    // On a cold start, the notification the app was opened with.
    navigate(Notifications.getLastNotificationResponse());

    const subscription =
      Notifications.addNotificationResponseReceivedListener(navigate);
    return () => subscription.remove();
  }, [router]);
}
