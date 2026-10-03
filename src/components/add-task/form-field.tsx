import { Text } from "@/components/ui/text";
import type { ReactNode } from "react";
import { View } from "react-native";

export function FormField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-label-md uppercase text-muted-foreground">{label}</Text>
      {children}
      {error ? <Text className="text-body-sm text-destructive">{error}</Text> : null}
    </View>
  );
}

/** Messages of the errors that have no displayed field. */
export function unshownErrors(errors: Record<string, string>, shownFields: readonly string[]): string[] {
  return Object.entries(errors)
    .filter(([field]) => !shownFields.includes(field))
    .map(([, message]) => message);
}

/** Positive integer from the text field; `null` if empty or invalid. */
export function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}
