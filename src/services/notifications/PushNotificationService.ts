import { pushTokenService } from "@/services/api/PushTokenService";
import { IPushTokenService, PushPlatform } from "@/types/push-token";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class PushNotificationService {
  public constructor(
    private readonly api: IPushTokenService = pushTokenService
  ) {}

  /**
   * Engedélyt kér, lekéri az Expo push tokent és regisztrálja a backendnél.
   * Visszaadja a tokent, vagy null-t, ha nem támogatott/nincs engedély.
   */
  public async register(authToken: string): Promise<string | null> {
    const pushToken = await this.getExpoPushToken();
    if (!pushToken) return null;

    await this.api.register(
      { token: pushToken, platform: Platform.OS as PushPlatform },
      authToken
    );
    return pushToken;
  }

  public async unregister(authToken: string): Promise<void> {
    const pushToken = await this.getExpoPushToken(false);
    if (!pushToken) return;

    await this.api.unregister(pushToken, authToken);
  }

  private async getExpoPushToken(
    askPermission = true
  ): Promise<string | null> {
    if (Platform.OS !== "ios" && Platform.OS !== "android") return null;
    // Szimulátoron/emulátoron nincs valódi push token.
    if (!Device.isDevice) return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted" && askPermission) {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== "granted") return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn(
        "[PushNotificationService] Hiányzik az EAS projectId (app.json extra.eas.projectId)."
      );
      return null;
    }

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  }
}

export const pushNotificationService = new PushNotificationService();
