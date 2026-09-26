import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react-native";
import { Pressable, View } from "react-native";

export interface ChipOption<T extends string | number> {
  value: T;
  label: string;
  /** Opcionális színminta a felirat előtt (pl. paletta). */
  swatch?: string;
  /** Alapértelmezett érték: a felirat után egy csillag jelzi. */
  isDefault?: boolean;
}

interface ChipGroupProps<T extends string | number> {
  options: ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Az alapértelmezett-jelölő akadálymentes felirata. */
  defaultLabel?: string;
}

/** Egyválasztós pill-csoport, tördelődő sorokban (aktív: terrakotta tint). */
export function ChipGroup<T extends string | number>({
  options,
  value,
  onChange,
  defaultLabel,
}: ChipGroupProps<T>) {
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
            className={cn(
              "flex-row items-center gap-2 rounded-full px-4 py-2",
              active ? "bg-primary-soft" : "bg-secondary"
            )}
          >
            {option.swatch && (
              <View className="size-3.5 rounded-full" style={{ backgroundColor: option.swatch }} />
            )}
            <Text
              className={cn(
                "text-label-lg",
                active ? "text-primary-soft-foreground" : "text-muted-foreground"
              )}
            >
              {option.label}
            </Text>
            {option.isDefault && (
              <Icon
                as={Star}
                size={13}
                strokeWidth={2.25}
                accessibilityLabel={defaultLabel}
                className={active ? "text-primary-soft-foreground" : "text-muted-foreground"}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
