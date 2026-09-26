import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { formatDue, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ResetPeriod } from "@/types/household";
import { Penalty } from "@/types/stats";
import { ArrowLeftRight, CircleCheck, Clock, Scale } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

interface PenaltiesCardProps {
  penalties: Penalty[];
  period: ResetPeriod;
  /** A bejelentkezett user: csak a saját függő büntetésére kérhet cserét / türelmi napot. */
  currentUserId: number | null;
  onRequestSwap: (taskInstanceId: number) => void;
}

/** Saját, még nem lejárt függő büntetés: erre kérhető csere vagy türelmi nap. */
function isRequestable(penalty: Penalty, currentUserId: number | null): boolean {
  return (
    penalty.status === "pending" &&
    penalty.user_id === currentUserId &&
    penalty.task_instance_id !== null &&
    !isOverdue(penalty.due_at)
  );
}

export function PenaltiesCard({ penalties, period, currentUserId, onRequestSwap }: PenaltiesCardProps) {
  const { t } = useTranslation();
  const pending = penalties.filter((p) => p.status === "pending").length;
  const requestable = penalties.filter((p) => isRequestable(p, currentUserId));

  return (
    <View className="gap-4 rounded-card bg-card p-5" style={Elevation.level1}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-input bg-primary-soft">
            <Icon as={Scale} size={20} className="text-primary" />
          </View>
          <Text className="text-headline-sm">{t("stats.penaltiesTitle", { context: period })}</Text>
        </View>
        {pending > 0 && (
          <View className="rounded-full bg-primary-soft px-3 py-1">
            <Text className="text-label-md text-primary-soft-foreground">
              {t("stats.pending", { count: pending })}
            </Text>
          </View>
        )}
      </View>

      <View className="gap-2">
        {penalties.map((penalty) => {
          const resolved = penalty.status === "resolved";
          const canRequest = isRequestable(penalty, currentUserId);
          return (
            <Pressable
              key={penalty.id}
              disabled={!canRequest}
              onPress={() => canRequest && onRequestSwap(penalty.task_instance_id!)}
              accessibilityRole={canRequest ? "button" : undefined}
              accessibilityHint={canRequest ? t("request.cardHint") : undefined}
              className="gap-2 rounded-input bg-muted p-3"
            >
              <View className="flex-row items-center justify-between gap-2">
                <Text className="shrink text-label-lg" numberOfLines={1}>
                  {penalty.user_name}
                </Text>
                <View
                  className={cn(
                    "flex-row items-center gap-1 rounded-full px-2.5 py-0.5",
                    resolved ? "bg-success-soft" : "bg-primary-soft"
                  )}
                >
                  <Icon
                    as={resolved ? CircleCheck : Clock}
                    size={12}
                    className={resolved ? "text-success-soft-foreground" : "text-primary-soft-foreground"}
                  />
                  <Text
                    className={cn(
                      "text-label-md",
                      resolved ? "text-success-soft-foreground" : "text-primary-soft-foreground"
                    )}
                  >
                    {resolved ? t("stats.resolved") : formatDue(penalty.due_at, t)}
                  </Text>
                </View>
              </View>
              <Text className={cn("text-body-md", resolved && "text-muted-foreground line-through")}>
                {penalty.task_name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {requestable.length > 0 && (
        <Button variant="secondary" onPress={() => onRequestSwap(requestable[0].task_instance_id!)}>
          <Icon as={ArrowLeftRight} size={16} />
          <Text>{t("stats.requestSwap")}</Text>
        </Button>
      )}
    </View>
  );
}
