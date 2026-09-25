import { CategoryIconBadge } from "@/components/category-icon";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ActivityEntry } from "@/types/stats";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

export function ActivityCard({ activity }: { activity: ActivityEntry[] }) {
  const { t } = useTranslation();

  return (
    <View className="gap-4 rounded-card bg-card p-5" style={Elevation.level1}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-headline-md">{t("stats.activityTitle")}</Text>
          <Text variant="muted">{t("stats.activitySubtitle")}</Text>
        </View>
        <Pressable accessibilityRole="button">
          <Text className="text-label-lg text-primary">{t("stats.viewAll")}</Text>
        </Pressable>
      </View>

      <View className="gap-4">
        {activity.map((entry) => (
          <View key={entry.id} className="flex-row items-start gap-3">
            <View
              className={cn(
                "mt-1 h-3 w-3 rounded-full",
                entry.is_me ? "bg-primary" : "bg-success-active"
              )}
            />
            <View className="flex-1 gap-1">
              <Text className="text-label-lg">
                {entry.is_me ? `${entry.user_name} (${t("stats.you")})` : entry.user_name}
              </Text>
              <View className="flex-row items-center gap-2">
                <CategoryIconBadge hints={[entry.category_icon, entry.task_name]} size={24} />
                <Text className="flex-1 text-body-md">{entry.task_name}</Text>
              </View>
              <Text variant="muted">{formatTimeAgo(entry.completed_at, t)}</Text>
            </View>
            <View className="rounded-full bg-success-soft px-2.5 py-0.5">
              <Text className="text-label-md text-success-soft-foreground">
                {t("dashboard.plusPoints", { count: entry.points })}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
