import { CategoryIconBadge } from "@/components/category-icon";
import { PointsChip } from "@/components/dashboard/points-chip";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { formatDue } from "@/lib/format";
import { TaskInstance } from "@/types/dashboard";
import { Check, Zap } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, View } from "react-native";

interface PoolTaskCardProps {
  item: TaskInstance;
  isClaiming: boolean;
  onClaim: () => void;
  /** Vállalás és azonnali lezárás (megerősítés után). */
  onFinish: () => void;
}

/** Elvállalható (Instant Pool) feladat teljes szélességű vállalás gombbal. */
export function PoolTaskCard({ item, isClaiming, onClaim, onFinish }: PoolTaskCardProps) {
  const { t } = useTranslation();
  const category = item.task.category;

  const confirmFinish = () => {
    Alert.alert(t("dashboard.finishTitle"), t("dashboard.finishMessage", { name: item.task.name }), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("dashboard.finishConfirm"), onPress: onFinish },
    ]);
  };

  return (
    <View className="gap-4 rounded-card bg-card p-4" style={Elevation.level1}>
      <View className="flex-row gap-3">
        <CategoryIconBadge
          color={category?.color}
          hints={[category?.icon, category?.name, item.task.icon, item.task.name]}
          shape="rounded"
        />
        <View className="flex-1 gap-0.5">
          <Text className="text-label-md uppercase text-primary">
            {category?.name ?? t("dashboard.minutes", { count: item.task.duration_minutes })}
          </Text>
          <Text className="text-headline-sm">{item.task.name}</Text>
          <Text variant="muted" numberOfLines={2}>
            {item.task.description || formatDue(item.due_at, t)}
          </Text>
        </View>
        <View className="items-end">
          <PointsChip points={item.points} claimers={item.claimers} />
        </View>
      </View>
      <View className="flex-row gap-3">
        <Button
          className="h-11 flex-1 border border-success"
          variant="success"
          onPress={onClaim}
          disabled={isClaiming}
          accessibilityLabel={t("dashboard.claimLabel", { name: item.task.name })}
        >
          {isClaiming ? (
            <ActivityIndicator className="text-success-foreground" />
          ) : (
            <>
              <Icon as={Zap} size={16} className="text-success-foreground" />
              <Text>{t("dashboard.claim")}</Text>
            </>
          )}
        </Button>
        <Button
          className="h-11 flex-1"
          variant="outline"
          onPress={confirmFinish}
          disabled={isClaiming}
          accessibilityLabel={t("dashboard.finishLabel", { name: item.task.name })}
        >
          <Icon as={Check} size={16} className="text-foreground" />
          <Text>{t("dashboard.finish")}</Text>
        </Button>
      </View>
    </View>
  );
}
