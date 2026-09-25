export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  /** Becenév, ennek hiányában a teljes név (backend számolja). */
  name: string;
  nickname: string | null;
  avatar: string | null;
  language: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UserMeResponse {
  user: User;
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
  getCurrentUser(token: string): Promise<User>;
  updateNickname(token: string, nickname: string | null): Promise<User>;
  updateLanguage(token: string, language: string): Promise<User>;
}
