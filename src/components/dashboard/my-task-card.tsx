import { CategoryIconBadge } from "@/components/category-icon";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { formatDue, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TaskInstance } from "@/types/dashboard";
import { CalendarDays, Check, CheckCheck, Clock } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";

interface MyTaskCardProps {
  item: TaskInstance;
  done: boolean;
  isCompleting: boolean;
  onComplete: () => void;
}

/** Elvállalt feladat – jobb oldali körrel teljesíthető (DESIGN: Completion Affordance). */
export function MyTaskCard({ item, done, isCompleting, onComplete }: MyTaskCardProps) {
  const { t } = useTranslation();
  const category = item.task.category;
  const overdue = !done && isOverdue(item.due_at);
  const dueSoon =
    !!item.due_at && new Date(item.due_at).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;

  return (
    <View
      className={cn("flex-row items-center gap-3 rounded-card p-4", done ? "bg-muted" : "bg-card")}
      style={done ? undefined : Elevation.level1}
    >
      <View className={cn("flex-1 flex-row gap-3", done && "opacity-60")}>
        <CategoryIconBadge
          color={category?.color}
          hints={[category?.icon, category?.name, item.task.icon, item.task.name]}
        />
        <View className="flex-1 gap-1.5">
          <View className="flex-row flex-wrap gap-1.5">
            {category && (
              <View className="rounded-full bg-secondary px-2.5 py-0.5">
                <Text className="text-label-md text-muted-foreground">{category.name}</Text>
              </View>
            )}
            {item.is_penalty ? (
              <View className="rounded-full bg-primary-soft px-2.5 py-0.5">
                <Text className="text-label-md text-primary-soft-foreground">
                  {t("dashboard.penaltyTask")}
                </Text>
              </View>
            ) : (
              <View className="rounded-full bg-success-soft px-2.5 py-0.5">
                <Text className="text-label-md text-success-soft-foreground">
                  {item.points === null
                    ? t("dashboard.noPoints")
                    : t("dashboard.plusPoints", { count: item.points })}
                </Text>
              </View>
            )}
          </View>
          <Text
            className={cn("text-headline-sm", done && "text-muted-foreground line-through")}
          >
            {item.task.name}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <Icon
              as={dueSoon ? Clock : CalendarDays}
              size={15}
              className={overdue || dueSoon ? "text-primary" : "text-muted-foreground"}
            />
            <Text
              className={cn("text-body-sm", overdue ? "text-primary" : "text-muted-foreground")}
            >
              {formatDue(item.due_at, t)}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={onComplete}
        disabled={done || isCompleting}
        accessibilityRole="button"
        accessibilityState={{ checked: done, busy: isCompleting }}
        accessibilityLabel={t("dashboard.completeLabel", { name: item.task.name })}
        className={cn(
          "h-12 w-12 items-center justify-center rounded-full",
          done ? "bg-success" : "bg-secondary active:bg-secondary-active"
        )}
      >
        {isCompleting ? (
          <ActivityIndicator className="text-muted-foreground" />
        ) : (
          <Icon
            as={done ? CheckCheck : Check}
            size={22}
            strokeWidth={2.25}
            className={done ? "text-success-foreground" : "text-muted-foreground"}
          />
        )}
      </Pressable>
    </View>
  );
}
