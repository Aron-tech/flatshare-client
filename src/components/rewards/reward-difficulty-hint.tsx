import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { RewardDifficulty, RewardDifficultyLevel } from "@/types/reward";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";

const BADGE_VARIANT: Record<RewardDifficultyLevel, "success" | "secondary" | "default" | "destructive"> = {
  easy: "success",
  medium: "secondary",
  hard: "default",
  very_hard: "destructive",
};

interface RewardDifficultyHintProps {
  difficulty: RewardDifficulty | null;
  isLoading: boolean;
}

/** Mennyire nehéz a megadott pontot összegyűjteni a háztartás feladatai és súlyozásai alapján. */
export function RewardDifficultyHint({ difficulty, isLoading }: RewardDifficultyHintProps) {
  const { t } = useTranslation();

  if (isLoading && !difficulty) return <ActivityIndicator className="self-start text-primary" />;
  if (!difficulty) return <Text variant="muted">{t("rewardForm.difficultyHint")}</Text>;
  if (!difficulty.difficulty) return <Text variant="muted">{t("rewardForm.difficultyNoTasks")}</Text>;

  return (
    <View className="gap-2 rounded-input bg-muted p-4">
      <View className="flex-row items-center gap-2">
        <Badge variant={BADGE_VARIANT[difficulty.difficulty]}>
          <Text>{t(`rewards.difficulty.${difficulty.difficulty}`)}</Text>
        </Badge>
        {isLoading && <ActivityIndicator size="small" className="text-muted-foreground" />}
      </View>
      {difficulty.weeks_needed !== null && (
        <Text variant="muted">
          {t("rewardForm.weeksNeeded", {
            weeks: difficulty.weeks_needed,
            weekly: difficulty.weekly_points_per_member,
          })}
        </Text>
      )}
      {difficulty.tasks_needed !== null && (
        <Text variant="muted">
          {t("rewardForm.tasksNeeded", { count: difficulty.tasks_needed, average: difficulty.average_task_points })}
        </Text>
      )}
    </View>
  );
}
