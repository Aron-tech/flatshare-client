export class Config {
  public static readonly BACKEND_URL: string =
    process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://192.168.0.32:8000/api";

  public static readonly WORKOS_CLIENT_ID: string =
    process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID ??
    "client_01M23QN0EFT8XFXCHDR0PS4Z6B";

  /** A backend csak az ezzel a kulccsal érkező kéréseket szolgálja ki (X-App-Key, lásd EnsureAppClientMiddleware). */
  public static readonly APP_KEY: string = process.env.EXPO_PUBLIC_APP_KEY ?? "";

  /** A nyilvános weboldal (adatvédelmi nyilatkozat, fióktörlés); a BACKEND_URL-ből, az `/api` nélkül. */
  public static readonly WEB_URL: string =
    process.env.EXPO_PUBLIC_WEB_URL ?? Config.BACKEND_URL.replace(/\/api\/?$/, "");
}
