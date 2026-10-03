import { Config } from "@/config/env";
import type { PetId } from "@/lib/house/scene.generated";
import {
  AppleLoginPayload,
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

  /** Native Sign in with Apple (iOS): the backend verifies the Apple token and stores it for revocation on account deletion. */
  public async authenticateWithApple(
    payload: AppleLoginPayload,
    language: string
  ): Promise<AuthResponse> {
    return this.http.request<AuthResponse>("/auth/apple", {
      method: "POST",
      body: JSON.stringify({
        identity_token: payload.identityToken,
        authorization_code: payload.authorizationCode,
        first_name: payload.firstName,
        last_name: payload.lastName,
        language,
      }),
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

  public async deleteAccount(token: string): Promise<void> {
    await this.http.request<unknown>("/user/me", { method: "DELETE" }, token);
  }

  public async updateLanguage(token: string, language: string): Promise<User> {
    const response = await this.http.request<UserMeResponse>(
      "/user/me",
      { method: "PUT", body: JSON.stringify({ language }) },
      token
    );
    return response.user;
  }

  public async updateCharacter(token: string, character: PetId | null): Promise<User> {
    const response = await this.http.request<UserMeResponse>(
      "/user/me",
      { method: "PUT", body: JSON.stringify({ character }) },
      token
    );
    return response.user;
  }
}

export const authService = new AuthService();
