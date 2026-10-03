import type { PetId } from "@/lib/house/scene.generated";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  /** Nickname, or the full name if missing (computed by the backend). */
  name: string;
  nickname: string | null;
  avatar: string | null;
  /** The pet chosen in the House view; `null` = none chosen (the backend gives the default). */
  character: PetId | null;
  language: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UserMeResponse {
  user: User;
}

/** Result of the native Apple sheet; Apple only gives the name on the first sign-in. */
export interface AppleLoginPayload {
  identityToken: string;
  authorizationCode: string;
  firstName: string | null;
  lastName: string | null;
}

export type OAuthProvider = "GoogleOAuth" | "AppleOAuth";

export interface ITokenStorage {
  getToken(): Promise<string | null>;
  saveToken(token: string): Promise<void>;
  removeToken(): Promise<void>;
}

export interface IAuthService {
  buildWorkOSAuthUrl(redirectUri: string, provider?: OAuthProvider): string;
  exchangeWorkOSCode(code: string, language: string): Promise<AuthResponse>;
  authenticateWithApple(
    payload: AppleLoginPayload,
    language: string
  ): Promise<AuthResponse>;
  getCurrentUser(token: string): Promise<User>;
  updateNickname(token: string, nickname: string | null): Promise<User>;
  updateLanguage(token: string, language: string): Promise<User>;
  updateCharacter(token: string, character: PetId | null): Promise<User>;
  deleteAccount(token: string): Promise<void>;
}
