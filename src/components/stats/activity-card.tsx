import { ActivityModal } from "@/components/stats/activity-modal";
import { ActivityRow } from "@/components/stats/activity-row";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { ActivityEntry } from "@/types/stats";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

export function ActivityCard({ activity }: { activity: ActivityEntry[] }) {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <View className="gap-4 rounded-card bg-card p-5" style={Elevation.level1}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-headline-md">{t("stats.activityTitle")}</Text>
          <Text variant="muted">{t("stats.activitySubtitle")}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => setIsModalOpen(true)}>
          <Text className="text-label-lg text-primary">{t("stats.viewAll")}</Text>
        </Pressable>
      </View>

      <View className="gap-3.5">
        {activity.map((entry) => (
          <ActivityRow key={entry.id} entry={entry} />
        ))}
      </View>

      <ActivityModal visible={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </View>
  );
}
