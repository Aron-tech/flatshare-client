import { Text } from "@/components/ui/text";
import type { ReactNode } from "react";
import { View } from "react-native";

/** Űrlapmező címkével; hiba esetén a mező alatt jelenik meg az üzenet. */
export function FormField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-label-md uppercase text-muted-foreground">{label}</Text>
      {children}
      {error ? <Text className="text-body-sm text-destructive">{error}</Text> : null}
    </View>
  );
}

/** A hibák közül azok üzenetei, amelyekhez nincs megjelenített mező. */
export function unshownErrors(errors: Record<string, string>, shownFields: readonly string[]): string[] {
  return Object.entries(errors)
    .filter(([field]) => !shownFields.includes(field))
    .map(([, message]) => message);
}

/** Pozitív egész a szövegmezőből; `null`, ha üres vagy érvénytelen. */
export function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}
