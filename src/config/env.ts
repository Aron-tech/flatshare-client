export class Config {
  public static readonly BACKEND_URL: string =
    process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://192.168.0.32:8000/api";

  public static readonly WORKOS_CLIENT_ID: string =
    process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID ??
    "client_01M23QN0EFT8XFXCHDR0PS4Z6B";

  /** The backend only serves requests that arrive with this key (X-App-Key, see EnsureAppClientMiddleware). */
  public static readonly APP_KEY: string = process.env.EXPO_PUBLIC_APP_KEY ?? "";

  /** The public website (privacy policy, account deletion); from BACKEND_URL without `/api`. */
  public static readonly WEB_URL: string =
    process.env.EXPO_PUBLIC_WEB_URL ?? Config.BACKEND_URL.replace(/\/api\/?$/, "");

  /** Address of Settings' "Contact / Support" button (matches the backend APP_CONTACT_EMAIL). */
  public static readonly SUPPORT_EMAIL: string =
    process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? "aron.papp2003@gmail.com";
}
