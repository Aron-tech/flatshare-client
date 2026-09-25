import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { Pressable, View } from "react-native";

export interface ChipOption<T extends string | number> {
  value: T;
  label: string;
}

interface ChipGroupProps<T extends string | number> {
  options: ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
}

/** Egyválasztós pill-csoport, tördelődő sorokban (aktív: terrakotta tint). */
export function ChipGroup<T extends string | number>({ options, value, onChange }: ChipGroupProps<T>) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            role="button"
            aria-pressed={active}
            className={cn("rounded-full px-4 py-2", active ? "bg-primary-soft" : "bg-secondary")}
          >
            <Text
              className={cn(
                "text-label-lg",
                active ? "text-primary-soft-foreground" : "text-muted-foreground"
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
