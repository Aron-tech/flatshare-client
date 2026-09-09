import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export async function saveToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token, SECURE_STORE_OPTIONS);
  } catch (error) {
    console.error("Failed saving token:", error);
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY, SECURE_STORE_OPTIONS);
  } catch (error) {
    console.warn("Failed reading token:", error);
    await removeToken();
    return null;
  }
}

export async function removeToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY, SECURE_STORE_OPTIONS);
  } catch (error) {
    console.error("Error during token deleting:", error);
  }
}
