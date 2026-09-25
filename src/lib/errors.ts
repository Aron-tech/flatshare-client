import i18n from "@/i18n";
import { ApiError } from "@/services/api/HttpClient";
import { Alert } from "react-native";

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
