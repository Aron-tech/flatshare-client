import i18n from "@/i18n";
import { ApiError } from "@/services/api/HttpClient";
import { Alert } from "react-native";

/** A backend validációs hibái mezőnként (üres, ha a hiba nem validációs). */
export function fieldErrorsOf(error: unknown): Record<string, string> {
  return error instanceof ApiError ? error.fieldErrors : {};
}

/**
 * Backend hibánál a toast már megjelent, ezért csak egyéb hibánál
 * (pl. hálózati) jelenít meg felugró ablakot.
 */
export function alertError(error: unknown, fallback: string) {
  if (error instanceof ApiError) return;
  Alert.alert(
    i18n.t("common.error"),
    error instanceof Error ? error.message : fallback,
  );
}
