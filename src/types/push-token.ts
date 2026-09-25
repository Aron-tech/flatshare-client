export type PushPlatform = "ios" | "android";

export interface RegisterPushTokenDto {
  token: string;
  platform: PushPlatform;
}

export interface IPushTokenService {
  register(dto: RegisterPushTokenDto, token: string): Promise<void>;
  unregister(pushToken: string, token: string): Promise<void>;
}
