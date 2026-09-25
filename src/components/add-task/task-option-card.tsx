import { CategoryIconBadge } from "@/components/category-icon";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { cn } from "@/lib/utils";
import { Category, TaskDifficulty } from "@/types/task";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

/** Sablon és háztartási feladat közös, listában megjelenített mezői. */
export interface TaskOption {
  name: string;
  category: Category | null;
  icon: string | null;
  duration_minutes: number;
  difficulty: TaskDifficulty;
}

/** Kiválasztható feladat-kártya kategória ikonnal, adatokkal és pont-jelvénnyel. */
export function TaskOptionCard({
  task,
  points,
  active,
  onPress,
}: {
  task: TaskOption;
  points: number;
  active: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      role="button"
      aria-pressed={active}
      className={cn(
        "flex-row items-center gap-3 rounded-card border-[1.5px] bg-card p-4",
        active ? "border-primary bg-primary-soft" : "border-transparent"
      )}
      style={Elevation.level1}
    >
      <CategoryIconBadge
        color={task.category?.color}
        hints={[task.category?.icon, task.category?.name, task.icon, task.name]}
        shape="rounded"
        size={44}
      />
      <View className="flex-1 gap-0.5">
        <Text className="text-label-lg">{task.name}</Text>
        <Text variant="muted" numberOfLines={1}>
          {[
            task.category?.name,
            t("chores.duration", { count: task.duration_minutes }),
            t(`dashboard.difficulty.${task.difficulty}`, { defaultValue: task.difficulty }),
          ]
            .filter(Boolean)
            .join("  •  ")}
        </Text>
      </View>
      <View className="rounded-full bg-success-soft px-3 py-1">
        <Text className="text-label-md text-success-soft-foreground">
          {t("dashboard.plusPoints", { count: points })}
        </Text>
      </View>
    </Pressable>
  );
}
