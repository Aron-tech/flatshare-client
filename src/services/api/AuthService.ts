import { Config } from "@/config/env";
import {
  AuthResponse,
  IAuthService,
  OAuthProvider,
  User,
  UserMeResponse,
} from "@/types/auth";
import { HttpClient } from "./HttpClient";

export class AuthService implements IAuthService {
  private readonly http: HttpClient;
  private readonly workosBaseAuthorizeUrl =
    "https://api.workos.com/user_management/authorize";

  public constructor(http?: HttpClient) {
    this.http = http ?? new HttpClient(Config.BACKEND_URL);
  }

  public buildWorkOSAuthUrl(
    redirectUri: string,
    provider?: OAuthProvider
  ): string {
    const params = new URLSearchParams({
      client_id: Config.WORKOS_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      ...(provider ? { provider } : {}),
    });

    return `${this.workosBaseAuthorizeUrl}?${params.toString()}`;
  }

  public async exchangeWorkOSCode(
    code: string,
    language: string
  ): Promise<AuthResponse> {
    return this.http.request<AuthResponse>("/auth/workos", {
      method: "POST",
      body: JSON.stringify({ code, language }),
    });
  }

  public async getCurrentUser(token: string): Promise<User> {
    const response = await this.http.request<UserMeResponse>(
      "/user/me",
      { method: "GET" },
      token
    );
    return response.user;
  }

  public async updateNickname(
    token: string,
    nickname: string | null
  ): Promise<User> {
    const response = await this.http.request<UserMeResponse>(
      "/user/me",
      { method: "PUT", body: JSON.stringify({ nickname }) },
      token
    );
    return response.user;
  }

  public async updateLanguage(token: string, language: string): Promise<User> {
    const response = await this.http.request<UserMeResponse>(
      "/user/me",
      { method: "PUT", body: JSON.stringify({ language }) },
      token
    );
    return response.user;
  }
}

export const authService = new AuthService();
