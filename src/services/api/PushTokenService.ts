import { Config } from "@/config/env";
import { IPushTokenService, RegisterPushTokenDto } from "@/types/push-token";
import { HttpClient } from "./HttpClient";

export class PushTokenService implements IPushTokenService {
  private readonly http: HttpClient;

  public constructor(http?: HttpClient) {
    this.http = http ?? new HttpClient(Config.BACKEND_URL);
  }

  public async register(
    dto: RegisterPushTokenDto,
    token: string
  ): Promise<void> {
    await this.http.request<unknown>(
      "/push-tokens",
      { method: "POST", body: JSON.stringify(dto) },
      token
    );
  }

  public async unregister(pushToken: string, token: string): Promise<void> {
    await this.http.request<unknown>(
      "/push-tokens",
      { method: "DELETE", body: JSON.stringify({ token: pushToken }) },
      token
    );
  }
}

export const pushTokenService = new PushTokenService();
