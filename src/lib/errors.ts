import i18n from "@/i18n";
import { ApiError } from "@/services/api/HttpClient";
import { Alert } from "react-native";

/** The backend's validation errors by field (empty if the error is not a validation one). */
export function fieldErrorsOf(error: unknown): Record<string, string> {
  return error instanceof ApiError ? error.fieldErrors : {};
}

/**
 * On a backend error the toast has already appeared, so a popup is only shown for other errors
 * (e.g. network).
 */
export function alertError(error: unknown, fallback: string) {
  if (error instanceof ApiError) return;
  Alert.alert(
    i18n.t("common.error"),
    error instanceof Error ? error.message : fallback,
  );
}
