import { CategoryIconBadge } from "@/components/category-icon";
import { Text } from "@/components/ui/text";
import { formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ActivityEntry } from "@/types/stats";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center gap-3">
      <CategoryIconBadge hints={[entry.category_icon, entry.task_name]} size={40} />
      <View className="flex-1 gap-0.5">
        <Text className="text-label-lg" numberOfLines={1}>
          {entry.task_name}
        </Text>
        <Text variant="muted" numberOfLines={1}>
          <Text className={cn("text-body-sm", entry.is_me ? "text-primary" : "text-muted-foreground")}>
            {entry.is_me ? t("stats.you") : entry.user_name}
          </Text>
          {` · ${formatTimeAgo(entry.completed_at, t)}`}
        </Text>
      </View>
      <View className="rounded-full bg-success-soft px-2.5 py-0.5">
        <Text className="text-label-md text-success-soft-foreground">
          {t("dashboard.plusPoints", { count: entry.points })}
        </Text>
      </View>
    </View>
  );
}
