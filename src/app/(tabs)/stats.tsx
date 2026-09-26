import { ActivityCard } from "@/components/stats/activity-card";
import { CycleRing } from "@/components/stats/cycle-ring";
import { MemberRow } from "@/components/stats/member-row";
import { PenaltiesCard } from "@/components/stats/penalties-card";
import { TabScreen } from "@/components/screen";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Icon } from "@/components/ui/icon";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { usePullToRefresh } from "@/hooks/use-household-query";
import { useStats } from "@/hooks/use-stats";
import { daysUntil } from "@/lib/cycle";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { CircleAlert, Hourglass } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function StatsScreen() {
  const { t } = useTranslation();
  const { stats, isLoading, error, refetch } = useStats();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);
  const { user } = useAuth();
  const router = useRouter();

  return (
    <TabScreen refreshing={refreshing} onRefresh={onRefresh}>
      {error && (
        <Alert icon={CircleAlert} variant="destructive">
          <AlertTitle>{t("home.errorTitle")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading || !stats ? (
        <>
          <Skeleton className="h-72 w-full rounded-card" />
          <Skeleton className="h-56 w-full rounded-card" />
        </>
      ) : (
        <>
          <View className="gap-5 rounded-card bg-card p-5" style={Elevation.level1}>
            <View className="self-center flex-row items-center gap-2 rounded-full bg-success-soft px-4 py-1.5">
              <View className="h-2 w-2 rounded-full bg-success" />
              <Text className="text-label-lg text-success-soft-foreground">
                {t("stats.rhythm", { percent: stats.balance_percent })}
              </Text>
            </View>

            <View className="flex-row items-center gap-5">
              <CycleRing value={stats.cycle.total_points} target={stats.cycle.target_points} />
              <View className="flex-1 gap-2">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-label-lg">{t("stats.cycleTarget", { number: stats.cycle.number })}</Text>
                  <Text variant="muted">
                    {stats.cycle.total_points} / {stats.cycle.target_points}
                  </Text>
                </View>
                <Progress
                  value={
                    stats.cycle.target_points > 0
                      ? Math.min(100, Math.round((stats.cycle.total_points / stats.cycle.target_points) * 100))
                      : 0
                  }
                  indicatorClassName="bg-primary"
                />
                <View className="flex-row items-center gap-1.5">
                  <Icon as={Hourglass} size={14} className="text-muted-foreground" />
                  <Text variant="muted">
                    {t("stats.daysLeftInCycle", { count: daysUntil(stats.cycle.ends_at) })}
                  </Text>
                </View>
              </View>
            </View>

            <View className="h-px bg-border" />

            <View className="gap-1">
              {stats.members.map((member) => (
                <MemberRow key={member.user_id} member={member} />
              ))}
            </View>
          </View>

          <PenaltiesCard
            penalties={stats.penalties}
            period={stats.cycle.period ?? "weekly"}
            currentUserId={user?.id ?? null}
            onRequestSwap={(taskInstanceId) => router.navigate({ pathname: "/", params: { request: String(taskInstanceId) } })}
          />
          <ActivityCard activity={stats.activity} />
        </>
      )}
    </TabScreen>
  );
}
