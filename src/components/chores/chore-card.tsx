import { CategoryIconBadge } from "@/components/category-icon";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { Category } from "@/types/task";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

interface ChoreCardProps {
  name: string;
  category: Category | null;
  iconHint?: string | null;
  /** Pl. "Hetente", "Egyszeri". */
  meta: string;
  points: number | null;
  /** Alsó sor bal oldala: időtartam. */
  footer: string;
  /** Amíg a user nem súlyozta a feladatot, erre figyelmeztetünk. */
  needsWeight?: boolean;
  /** Koppintásra: feladat-műveletek (súlyozás, szerkesztés, törlés). */
  onPress?: () => void;
}

export function ChoreCard({
  name,
  category,
  iconHint,
  meta,
  points,
  footer,
  needsWeight = false,
  onPress,
}: ChoreCardProps) {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      className="gap-4 rounded-card bg-card p-4 active:opacity-90"
      style={Elevation.level1}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row gap-3">
          <CategoryIconBadge
            color={category?.color}
            hints={[category?.icon, category?.name, iconHint, name]}
            shape="rounded"
            size={48}
          />
          <View className="flex-1 gap-0.5">
            <Text className="text-label-md uppercase text-primary" numberOfLines={1}>
              {[category?.name, meta].filter(Boolean).join("  •  ")}
            </Text>
            <Text className="font-serif text-headline-sm">{name}</Text>
          </View>
        </View>
        {points !== null && (
          <View className="rounded-full bg-success-soft px-3 py-1">
            <Text className="text-label-lg text-success-soft-foreground">
              {t("dashboard.plusPoints", { count: points })}
            </Text>
          </View>
        )}
      </View>
      <View className="flex-row items-center justify-between gap-3">
        <Text variant="muted" className="flex-1">
          {footer}
        </Text>
        {needsWeight && <Text className="text-label-md text-primary">{t("chores.weightMissing")}</Text>}
      </View>
    </Pressable>
  );
}
