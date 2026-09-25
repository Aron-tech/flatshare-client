import { Text } from "@/components/ui/text";
import { View } from "react-native";

/** Üres lista – tónusos inset (DESIGN: Tonal Insets). */
export function EmptyState({ text }: { text: string }) {
  return (
    <View className="items-center rounded-card border border-border bg-muted px-6 py-8">
      <Text variant="muted" className="text-center">
        {text}
      </Text>
    </View>
  );
}
