/**
 * Expo inlines EXPO_PUBLIC_* at build time only when accessed statically (process.env.EXPO_PUBLIC_X),
 * so every variable is read by its full name. A missing one fails at startup instead of falling back to a dev value.
 */
function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing environment variable ${name} (see .env.example).`);
  }
  return value;
}

export class Config {
  public static readonly BACKEND_URL: string = required(
    process.env.EXPO_PUBLIC_BACKEND_URL,
    "EXPO_PUBLIC_BACKEND_URL",
  );

  public static readonly WORKOS_CLIENT_ID: string = required(
    process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID,
    "EXPO_PUBLIC_WORKOS_CLIENT_ID",
  );

  /** The backend only serves requests that arrive with this key (X-App-Key, see EnsureAppClientMiddleware). */
  public static readonly APP_KEY: string = required(
    process.env.EXPO_PUBLIC_APP_KEY,
    "EXPO_PUBLIC_APP_KEY",
  );

  /** The public website (privacy policy, account deletion); from BACKEND_URL without `/api`. */
  public static readonly WEB_URL: string =
    process.env.EXPO_PUBLIC_WEB_URL ?? Config.BACKEND_URL.replace(/\/api\/?$/, "");

  /** Address of Settings' "Contact / Support" button (matches the backend APP_CONTACT_EMAIL). */
  public static readonly SUPPORT_EMAIL: string =
    process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? "aron.papp2003@gmail.com";
}
