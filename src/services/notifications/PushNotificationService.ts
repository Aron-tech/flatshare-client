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
   * The current permission state without opening the system dialog.
   * `null` if the device/platform does not support push at all (web, simulator).
   */
  public async getPermissionStatus(): Promise<Notifications.PermissionStatus | null> {
    if (!this.isSupported()) return null;
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  /**
   * Fetches the Expo push token and registers it with the backend. With `askPermission: true` the system
   * permission dialog pops up if we have not asked yet; call it only after our own screen explained
   * what it is for (App Review 2.1). Returns the token, or null if unsupported / not allowed.
   */
  public async register(
    authToken: string,
    { askPermission = true }: { askPermission?: boolean } = {}
  ): Promise<string | null> {
    const pushToken = await this.getExpoPushToken(askPermission);
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

  private isSupported(): boolean {
    // No real push token on a simulator/emulator.
    return (Platform.OS === "ios" || Platform.OS === "android") && Device.isDevice;
  }

  private async getExpoPushToken(
    askPermission = true
  ): Promise<string | null> {
    if (!this.isSupported()) return null;

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
