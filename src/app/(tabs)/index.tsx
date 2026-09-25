import { MyTaskCard } from "@/components/dashboard/my-task-card";
import { TaskActionsSheet, TaskActionsTarget } from "@/components/chores/task-actions-sheet";
import { PoolTaskCard } from "@/components/dashboard/pool-task-card";
import { PresenceStrip } from "@/components/dashboard/presence-strip";
import { WeeklyGoalCard } from "@/components/dashboard/weekly-goal-card";
import { TabScreen } from "@/components/screen";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/hooks/use-dashboard";
import { useStats } from "@/hooks/use-stats";
import { currentLocale } from "@/i18n";
import { currentCycle } from "@/lib/cycle";
import { greetingKey } from "@/lib/format";
import { CircleAlert, Sprout } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type DashboardView = "mine" | "pool";

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    points,
    taskInstances,
    completedIds,
    isLoading,
    isRefreshing,
    error,
    claimingId,
    completingId,
    weightingTaskId,
    refresh,
    claim,
    claimAndComplete,
    complete,
    setWeight,
  } = useDashboard();
  const { stats, refresh: refreshStats } = useStats();
  const [view, setView] = useState<DashboardView>("mine");
  const [weightTarget, setWeightTarget] = useState<TaskActionsTarget | null>(null);

  const cycle = currentCycle();
  const openCount = taskInstances.claimed.filter((i) => !(i.id in completedIds)).length;
  const weekday = new Date().toLocaleDateString(currentLocale(), { weekday: "long" });

  return (
    <TabScreen
      refreshing={isRefreshing}
      onRefresh={() => {
        refresh();
        refreshStats();
      }}
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-headline-lg">
            {t(`dashboard.greeting.${greetingKey()}`, { name: user?.name ?? "" })}
          </Text>
          <Text className="text-body-lg text-muted-foreground">
            {weekday.charAt(0).toUpperCase() + weekday.slice(1)} •{" "}
            {openCount === 0
              ? t("dashboard.cadenceQuiet")
              : t("dashboard.cadenceOpen", { count: openCount })}
          </Text>
        </View>
        <View className="h-14 w-14 items-center justify-center rounded-full bg-success-soft">
          <Icon as={Sprout} size={26} className="text-success-active" />
        </View>
      </View>

      {error && (
        <Alert icon={CircleAlert} variant="destructive">
          <AlertTitle>{t("home.errorTitle")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <WeeklyGoalCard
        balance={points?.balance ?? null}
        minPoints={points?.minPoints ?? null}
        daysLeft={cycle.daysLeft}
        elapsedFraction={cycle.elapsedFraction}
        flatBalance={stats?.balance_percent ?? null}
        isLoading={isLoading}
      />

      <SegmentedControl
        value={view}
        onChange={setView}
        options={[
          { value: "mine", label: t("dashboard.myTasks"), count: isLoading ? undefined : openCount },
          {
            value: "pool",
            label: t("dashboard.instantPool"),
            count: isLoading ? undefined : taskInstances.available.length,
          },
        ]}
      />

      <View className="gap-3">
        <View className="flex-row items-center justify-between px-1">
          <Text className="text-label-md uppercase text-muted-foreground">
            {view === "mine" ? t("dashboard.committedDuties") : t("dashboard.poolPickups")}
          </Text>
          <Text className="text-label-md font-medium text-success-soft-foreground">
            {view === "mine" ? t("dashboard.tapToResolve") : t("dashboard.instantPoints")}
          </Text>
        </View>

        {isLoading ? (
          <>
            <Skeleton className="h-28 w-full rounded-card" />
            <Skeleton className="h-28 w-full rounded-card" />
          </>
        ) : view === "mine" ? (
          taskInstances.claimed.length === 0 ? (
            <EmptyState text={t("home.claimedEmpty")} />
          ) : (
            taskInstances.claimed.map((item) => (
              <MyTaskCard
                key={item.id}
                item={item}
                done={item.id in completedIds}
                isCompleting={completingId === item.id}
                onComplete={() => complete(item.id)}
              />
            ))
          )
        ) : taskInstances.available.length === 0 ? (
          <EmptyState text={t("home.availableEmpty")} />
        ) : (
          taskInstances.available.map((item) => (
            <PoolTaskCard
              key={item.id}
              item={item}
              isClaiming={claimingId === item.id}
              onClaim={() => claim(item.id)}
              onFinish={() => claimAndComplete(item.id)}
              onWeight={() =>
                setWeightTarget({
                  taskId: item.task_id,
                  name: item.task.name,
                  category: item.task.category ?? null,
                  iconHint: item.task.icon ?? null,
                  canManage: false,
                })
              }
            />
          ))
        )}

        {view === "mine" && stats && <PresenceStrip activity={stats.activity} />}
      </View>

      <TaskActionsSheet
        target={weightTarget}
        isBusy={weightTarget !== null && weightingTaskId === weightTarget.taskId}
        onClose={() => setWeightTarget(null)}
        onWeight={async (weight) => {
          if (weightTarget && (await setWeight(weightTarget.taskId, weight))) setWeightTarget(null);
        }}
      />
    </TabScreen>
  );
}
