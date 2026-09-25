import { CategoryIconBadge } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { formatDue } from "@/lib/format";
import { TaskInstance } from "@/types/dashboard";
import { Zap } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

interface PoolTaskCardProps {
  item: TaskInstance;
  isClaiming: boolean;
  onClaim: () => void;
}

/** Elvállalható (Instant Pool) feladat teljes szélességű vállalás gombbal. */
export function PoolTaskCard({ item, isClaiming, onClaim }: PoolTaskCardProps) {
  const { t } = useTranslation();
  const category = item.task.category;

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
      </View>
      <Button
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
            <Text>
              {item.points === null
                ? t("dashboard.claim")
                : t("dashboard.claimWithPoints", { count: item.points })}
            </Text>
          </>
        )}
      </Button>
    </View>
  );
}
