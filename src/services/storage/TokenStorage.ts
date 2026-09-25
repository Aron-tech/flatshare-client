import { ITokenStorage } from "@/types/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export class TokenStorageService implements ITokenStorage {
  private readonly tokenKey = "auth_token";
  private readonly options: SecureStore.SecureStoreOptions = {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  };

  public async saveToken(token: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        await AsyncStorage.setItem(this.tokenKey, token);
        return;
      }
      await SecureStore.setItemAsync(this.tokenKey, token, this.options);
    } catch (error) {
      console.error(
        "[TokenStorageService.saveToken] Failed saving token:",
        error
      );
      throw error;
    }
  }

  public async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === "web") {
        return await AsyncStorage.getItem(this.tokenKey);
      }
      return await SecureStore.getItemAsync(this.tokenKey, this.options);
    } catch (error) {
      console.warn(
        "[TokenStorageService.getToken] Failed reading token, purging:",
        error
      );
      await this.removeToken();
      return null;
    }
  }

  public async removeToken(): Promise<void> {
    try {
      if (Platform.OS === "web") {
        await AsyncStorage.removeItem(this.tokenKey);
        return;
      }
      await SecureStore.deleteItemAsync(this.tokenKey, this.options);
    } catch (error) {
      console.error(
        "[TokenStorageService.removeToken] Failed deleting token:",
        error
      );
    }
  }
}

export const tokenStorage = new TokenStorageService();
