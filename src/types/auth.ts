export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
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
}
