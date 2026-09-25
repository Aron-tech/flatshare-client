import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";

export interface CategoryFilterOption {
  key: string;
  label: string;
  count: number;
}

interface CategoryFilterProps {
  options: CategoryFilterOption[];
  value: string;
  onChange: (key: string) => void;
}

export const ALL_CATEGORIES = "__all__";

/** Vízszintesen görgethető zóna-szűrő pillek (aktív: terrakotta tint). */
export function CategoryFilter({ options, value, onChange }: CategoryFilterProps) {
  const { t } = useTranslation();
  const all: CategoryFilterOption = {
    key: ALL_CATEGORIES,
    label: t("chores.all"),
    count: options.reduce((sum, o) => sum + o.count, 0),
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
      // A képernyő gutterén túl is görgethető.
      style={{ marginHorizontal: -20 }}
    >
      <View className="w-3" />
      {[all, ...options].map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            role="button"
            aria-pressed={active}
            className={cn(
              "flex-row items-center gap-1.5 rounded-full px-4 py-2",
              active ? "bg-primary-soft" : "bg-secondary"
            )}
          >
            <Text
              className={cn(
                "text-label-lg",
                active ? "text-primary-soft-foreground" : "text-muted-foreground"
              )}
            >
              {option.label}
            </Text>
            <Text
              className={cn(
                "text-label-md",
                active ? "text-primary-soft-foreground" : "text-placeholder"
              )}
            >
              {option.count}
            </Text>
          </Pressable>
        );
      })}
      <View className="w-3" />
    </ScrollView>
  );
}
