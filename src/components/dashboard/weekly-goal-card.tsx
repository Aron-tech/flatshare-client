import { Icon } from "@/components/ui/icon";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { cn } from "@/lib/utils";
import { ResetPeriod } from "@/types/household";
import { Target } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface WeeklyGoalCardProps {
  /** Az e heti feladatokért kapott pont. */
  weeklyPoints: number | null;
  minPoints: number | null;
  /** Jutalomra költhető pont: a heti célig szerzett pontot a hét zárása levonja. */
  spendablePoints: number | null;
  /** A háztartás célidőszaka: ettől függ, hogy heti vagy havi célról beszélünk. */
  period: ResetPeriod;
  daysLeft: number;
  /** A ciklusból eltelt rész (0–1) – ebből számoljuk az elvárt tempót. */
  elapsedFraction: number;
  /** A lakás összesített egyensúlya (%); null, ha még nincs adat. */
  flatBalance: number | null;
  isLoading: boolean;
}

export function WeeklyGoalCard({
  weeklyPoints,
  minPoints,
  spendablePoints,
  period,
  daysLeft,
  elapsedFraction,
  flatBalance,
  isLoading,
}: WeeklyGoalCardProps) {
  const { t } = useTranslation();

  if (isLoading || weeklyPoints === null || minPoints === null) {
    return (
      <View className="gap-4 rounded-card bg-card p-6" style={Elevation.level1}>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-12 w-36" />
        <Skeleton className="h-2.5 w-full rounded-full" />
      </View>
    );
  }

  const percent = minPoints > 0 ? Math.min(100, Math.round((weeklyPoints / minPoints) * 100)) : 100;
  const behind = Math.max(0, Math.round(minPoints * elapsedFraction) - weeklyPoints);
  const reached = weeklyPoints >= minPoints;
  const hasGoal = minPoints > 0;
  // A cél feletti pont csak annyiban marad meg, amennyi ténylegesen költhető (pl. a már elköltött vagy még le nem zárt korábbi időszak miatt kevesebb is lehet).
  const extra = Math.min(Math.max(0, weeklyPoints - minPoints), spendablePoints ?? 0);

  return (
    <View className="gap-4 rounded-card bg-card p-6" style={Elevation.level1}>
      <View className="flex-row items-center justify-between gap-2">
        <View className="shrink flex-row items-center gap-2">
          <Icon as={Target} size={18} className="text-primary" />
          <Text className="shrink text-label-md uppercase text-muted-foreground" numberOfLines={1}>
            {hasGoal ? t("dashboard.weeklyGoal", { count: minPoints, context: period }) : t("dashboard.noWeeklyGoal", { context: period })}
          </Text>
        </View>
        <View className="rounded-full bg-primary-soft px-3 py-1">
          <Text className="text-label-md text-primary-soft-foreground">
            {t("dashboard.daysLeft", { count: daysLeft })}
          </Text>
        </View>
      </View>

      <View className="flex-row items-end justify-between gap-2">
        <View className="flex-row items-baseline gap-2">
          <Text className="text-headline-xl">{weeklyPoints}</Text>
          {hasGoal && (
            <Text className="font-serif text-headline-sm font-normal text-muted-foreground">
              {t("dashboard.ofPoints", { count: minPoints })}
            </Text>
          )}
        </View>
        {hasGoal && (
          <Text className="pb-2 text-label-lg text-success-soft-foreground">
            {t("dashboard.percentDone", { percent })}
          </Text>
        )}
      </View>

      <Progress
        value={percent}
        indicatorClassName="bg-success-active"
        accessibilityLabel={t("dashboard.progressLabel", { percent })}
      />

      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View
          className={cn(
            "flex-row items-center gap-2 rounded-full px-3 py-1",
            behind > 0 ? "bg-secondary" : "bg-success-soft"
          )}
        >
          <View className={cn("h-2 w-2 rounded-full", behind > 0 ? "bg-primary" : "bg-success")} />
          <Text
            className={cn(
              "text-body-sm",
              behind > 0 ? "text-foreground" : "text-success-soft-foreground"
            )}
          >
            {reached
              ? t("dashboard.goalReached", { context: period })
              : behind > 0
                ? t("dashboard.behindPace", { count: behind })
                : t("dashboard.onPace")}
          </Text>
        </View>
        {flatBalance !== null && (
          <Text variant="muted">{t("dashboard.flatBalance", { percent: flatBalance })}</Text>
        )}
      </View>

      {spendablePoints !== null && (
        <View className="gap-1 border-t border-border pt-4">
          <Text className="text-label-lg">{t("dashboard.spendable", { count: spendablePoints })}</Text>
          {hasGoal && (
            <Text variant="muted">
              {extra > 0 ? t("dashboard.extraThisWeek", { count: extra, context: period }) : t("dashboard.spendableHint", { context: period })}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
