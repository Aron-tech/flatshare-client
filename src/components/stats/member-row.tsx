import { Progress } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import { initials, shortName } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatsMember } from "@/types/stats";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type Status = "onTrack" | "needs" | "atRisk";

function statusOf(member: StatsMember): Status {
  const ratio = member.target > 0 ? member.points / member.target : 1;
  if (ratio >= 0.8) return "onTrack";
  if (ratio >= 0.6) return "needs";
  return "atRisk";
}

const STATUS_STYLE: Record<Status, { pill: string; text: string; bar: string }> = {
  onTrack: { pill: "bg-success-soft", text: "text-success-soft-foreground", bar: "bg-success-active" },
  needs: { pill: "bg-primary-soft", text: "text-primary-soft-foreground", bar: "bg-primary" },
  atRisk: { pill: "bg-primary-soft", text: "text-primary-soft-foreground", bar: "bg-primary-active" },
};

export function MemberRow({ member }: { member: StatsMember }) {
  const { t } = useTranslation();
  const status = statusOf(member);
  const style = STATUS_STYLE[status];
  const percent = member.target > 0 ? Math.min(100, Math.round((member.points / member.target) * 100)) : 0;

  return (
    <View
      className={cn("flex-row items-center gap-3 rounded-input px-2 py-2.5", member.is_me && "bg-muted")}
    >
      <View
        className={cn(
          "h-11 w-11 items-center justify-center rounded-full",
          member.is_me ? "border border-primary bg-primary-soft" : "bg-success-soft"
        )}
      >
        <Text
          className={cn(
            "text-label-lg",
            member.is_me ? "text-primary-soft-foreground" : "text-success-soft-foreground"
          )}
        >
          {initials(member.first_name, member.last_name)}
        </Text>
      </View>
      <View className="flex-1 gap-1.5">
        <View className="flex-row items-center justify-between gap-2">
          <View className="shrink flex-row items-center gap-2">
            <Text className="shrink text-label-lg" numberOfLines={1}>
              {shortName(member.first_name, member.last_name)}
            </Text>
            {member.is_me ? (
              <View className="rounded-full bg-secondary-active px-2 py-0.5">
                <Text className="text-label-sm text-muted-foreground">{t("stats.you")}</Text>
              </View>
            ) : member.role === "admin" ? (
              <View className="rounded-full bg-secondary px-2 py-0.5">
                <Text className="text-label-sm text-muted-foreground">{t("stats.admin")}</Text>
              </View>
            ) : null}
          </View>
          <Text className="text-label-lg">
            {member.points}
            <Text className="text-body-sm text-muted-foreground">/{member.target}</Text>
          </Text>
        </View>
        <Progress value={percent} className="h-2" indicatorClassName={style.bar} />
      </View>
      <View className={cn("rounded-full px-3 py-1", style.pill)}>
        <Text className={cn("text-label-md", style.text)}>
          {status === "needs"
            ? t("stats.needs", { count: Math.max(0, member.target - member.points) })
            : t(`stats.${status}`)}
        </Text>
      </View>
    </View>
  );
}
