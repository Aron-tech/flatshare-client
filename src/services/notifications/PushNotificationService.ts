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
   * A jelenlegi engedély állapota a rendszer ablakának megnyitása nélkül.
   * `null`, ha az eszköz/platform egyáltalán nem támogatja a push értesítést (web, szimulátor).
   */
  public async getPermissionStatus(): Promise<Notifications.PermissionStatus | null> {
    if (!this.isSupported()) return null;
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  /**
   * Lekéri az Expo push tokent és regisztrálja a backendnél.
   * `askPermission: true` esetén – ha még nem kérdeztük meg – felugrik a rendszer engedélyablaka;
   * ezt csak azután hívjuk, hogy egy saját képernyőn elmagyaráztuk, mire kell (App Review 2.1).
   * Visszaadja a tokent, vagy null-t, ha nem támogatott/nincs engedély.
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
    // Szimulátoron/emulátoron nincs valódi push token.
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
