export class Config {
  public static readonly BACKEND_URL: string =
    process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://192.168.0.32:8000/api";

  public static readonly WORKOS_CLIENT_ID: string =
    process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID ??
    "client_01M23QN0EFT8XFXCHDR0PS4Z6B";
}
