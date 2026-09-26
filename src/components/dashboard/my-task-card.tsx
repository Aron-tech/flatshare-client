import { CategoryIconBadge } from "@/components/category-icon";
import { PointsChip } from "@/components/dashboard/points-chip";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { formatDue, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TaskInstance } from "@/types/dashboard";
import { ArrowLeftRight, CalendarDays, Check, CheckCheck, Clock, Timer } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, View } from "react-native";

interface MyTaskCardProps {
  item: TaskInstance;
  done: boolean;
  isCompleting: boolean;
  onComplete: () => void;
  /** Csere vagy türelmi nap kérése; csak határidős, nem kész feladatnál. */
  onRequest?: () => void;
}

/** Elvállalt feladat – jobb oldali körrel teljesíthető (DESIGN: Completion Affordance), a kártyára koppintva csere / türelmi nap kérhető. */
export function MyTaskCard({ item, done, isCompleting, onComplete, onRequest }: MyTaskCardProps) {
  const { t } = useTranslation();
  const category = item.task.category;
  const overdue = !done && isOverdue(item.due_at);
  const dueSoon =
    !!item.due_at && new Date(item.due_at).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;
  const canRequest = !done && !!item.due_at && !!onRequest;

  return (
    <View
      className={cn("flex-row items-center gap-3 rounded-card p-4", done ? "bg-muted" : "bg-card")}
      style={done ? undefined : Elevation.level1}
    >
      <Pressable
        onPress={onRequest}
        disabled={!canRequest}
        accessibilityRole={canRequest ? "button" : undefined}
        accessibilityHint={canRequest ? t("request.cardHint") : undefined}
        className={cn("flex-1 flex-row gap-3", done && "opacity-60")}
      >
        <CategoryIconBadge
          color={category?.color}
          hints={[category?.icon, category?.name, item.task.icon, item.task.name]}
        />
        <View className="flex-1 gap-1">
          {category && (
            <Text className="text-label-md uppercase text-primary" numberOfLines={1}>
              {category.name}
            </Text>
          )}
          <Text
            className={cn("text-headline-sm", done && "text-muted-foreground line-through")}
            numberOfLines={2}
          >
            {item.task.name}
          </Text>
          <View className="mt-1 flex-row flex-wrap items-center gap-x-3 gap-y-1.5">
            <View className="flex-row items-center gap-1.5">
              <Icon
                as={dueSoon ? Clock : CalendarDays}
                size={15}
                className={overdue || dueSoon ? "text-primary" : "text-muted-foreground"}
              />
              <Text
                className={cn(
                  "text-body-sm",
                  overdue ? "font-medium text-primary" : "text-muted-foreground"
                )}
              >
                {formatDue(item.due_at, t)}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Icon as={Timer} size={15} className="text-muted-foreground" />
              <Text className="text-body-sm text-muted-foreground">
                {t("dashboard.minutes", { count: item.task.duration_minutes })}
              </Text>
            </View>
            {item.is_penalty ? (
              <View className="rounded-full bg-primary-soft px-2.5 py-0.5">
                <Text className="text-label-md text-primary-soft-foreground">
                  {t("dashboard.penaltyTask", { count: item.points ?? 0 })}
                </Text>
              </View>
            ) : (
              <PointsChip points={item.points} claimers={item.claimers} />
            )}
            {!!item.offer_points && (
              <View className="rounded-full bg-success-soft px-2.5 py-0.5">
                <Text className="text-label-md text-success-soft-foreground">
                  {t("request.takenOverBonus", { count: item.offer_points })}
                </Text>
              </View>
            )}
            {item.my_offer && (
              <View className="rounded-full bg-secondary px-2.5 py-0.5">
                <Text className="text-label-md text-muted-foreground">
                  {t("request.offeredBadge", { count: item.my_offer.points })}
                </Text>
              </View>
            )}
            {item.grace_granted_at && (
              <View className="rounded-full bg-secondary px-2.5 py-0.5">
                <Text className="text-label-md text-muted-foreground">{t("request.graceBadge")}</Text>
              </View>
            )}
          </View>
          {canRequest && (
            <View className="mt-1 flex-row items-center gap-1.5">
              <Icon as={ArrowLeftRight} size={13} className="text-primary" />
              <Text className="text-label-md text-primary">{t("request.cardLink")}</Text>
            </View>
          )}
        </View>
      </Pressable>

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
