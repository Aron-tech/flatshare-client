import { IHouseholdStorage } from "@/types/household";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export class HouseholdStorageService implements IHouseholdStorage {
  private readonly storageKey = "active_household_id";
  private readonly options: SecureStore.SecureStoreOptions = {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
  };

  public async getActiveHouseholdId(): Promise<number | null> {
    try {
      const value =
        Platform.OS === "web"
          ? await AsyncStorage.getItem(this.storageKey)
          : await SecureStore.getItemAsync(this.storageKey, this.options);
      return value ? Number(value) : null;
    } catch (error) {
      console.error(
        "[HouseholdStorageService.getActiveHouseholdId] Failed to read:",
        error
      );
      return null;
    }
  }

  public async setActiveHouseholdId(id: number): Promise<void> {
    try {
      if (Platform.OS === "web") {
        await AsyncStorage.setItem(this.storageKey, id.toString());
        return;
      }
      await SecureStore.setItemAsync(
        this.storageKey,
        id.toString(),
        this.options
      );
    } catch (error) {
      console.error(
        "[HouseholdStorageService.setActiveHouseholdId] Failed to write:",
        error
      );
    }
  }

  public async clearActiveHouseholdId(): Promise<void> {
    try {
      if (Platform.OS === "web") {
        await AsyncStorage.removeItem(this.storageKey);
        return;
      }
      await SecureStore.deleteItemAsync(this.storageKey, this.options);
    } catch (error) {
      console.error(
        "[HouseholdStorageService.clearActiveHouseholdId] Failed to delete:",
        error
      );
    }
  }
}

export const householdStorage = new HouseholdStorageService();
