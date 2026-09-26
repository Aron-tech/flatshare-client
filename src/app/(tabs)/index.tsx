import { ClaimRequestSheet } from "@/components/dashboard/claim-request-sheet";
import { MemberDepartureBanner } from "@/components/dashboard/member-departure-banner";
import { MyTaskCard } from "@/components/dashboard/my-task-card";
import { OfferedTaskCard } from "@/components/dashboard/offered-task-card";
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
import { useHousehold } from "@/context/HouseholdContext";
import { useDashboard } from "@/hooks/use-dashboard";
import { usePullToRefresh } from "@/hooks/use-household-query";
import { useStats } from "@/hooks/use-stats";
import { currentLocale } from "@/i18n";
import { currentCycle, resetPeriodOf } from "@/lib/cycle";
import { greetingKey } from "@/lib/format";
import { TaskInstance } from "@/types/dashboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CircleAlert, Sprout } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type DashboardView = "mine" | "pool";

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeHousehold } = useHousehold();
  const {
    points,
    taskInstances,
    completedIds,
    isLoading,
    error,
    claimingId,
    completingId,
    refetch,
    claim,
    claimAndComplete,
    complete,
    requestBusyId,
    requestGraceDay,
    createOffer,
    cancelOffer,
    acceptOffer,
  } = useDashboard();
  const { stats, refetch: refetchStats } = useStats();
  const { refreshing, onRefresh } = usePullToRefresh(refetch, refetchStats);
  const [view, setView] = useState<DashboardView>("mine");
  // A Stats büntetés-kártyája `?request={task_instance_id}` paraméterrel nyitja meg a kérés-sheetet.
  const router = useRouter();
  const params = useLocalSearchParams<{ request?: string }>();
  const [requestId, setRequestId] = useState<number | null>(null);
  const activeRequestId = requestId ?? (params.request ? Number(params.request) : null);
  /** A sheet mindig a friss (újratöltött) adatot mutatja, pl. a nyitott ajánlatot. */
  const requestItem: TaskInstance | null = taskInstances.claimed.find((i) => i.id === activeRequestId) ?? null;
  const closeRequest = () => {
    setRequestId(null);
    if (params.request) router.setParams({ request: undefined });
  };

  const cycle = currentCycle(activeHousehold?.settings);
  const openCount = taskInstances.claimed.filter((i) => !(i.id in completedIds)).length;
  const weekday = new Date().toLocaleDateString(currentLocale(), { weekday: "long" });

  return (
    <TabScreen refreshing={refreshing} onRefresh={onRefresh}>
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

      {points?.role === "admin" && <MemberDepartureBanner />}

      <WeeklyGoalCard
        weeklyPoints={points?.weeklyPoints ?? null}
        minPoints={points?.minPoints ?? null}
        spendablePoints={points?.spendablePoints ?? null}
        period={resetPeriodOf(activeHousehold?.settings)}
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
            count: isLoading ? undefined : taskInstances.available.length + taskInstances.offered.length,
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
                onRequest={() => setRequestId(item.id)}
              />
            ))
          )
        ) : taskInstances.available.length === 0 && taskInstances.offered.length === 0 ? (
          <EmptyState text={t("home.availableEmpty")} />
        ) : (
          <>
            {taskInstances.offered.length > 0 && (
              <Text className="px-1 text-label-md uppercase text-muted-foreground">{t("request.offeredSection")}</Text>
            )}
            {taskInstances.offered.map((item) => (
              <OfferedTaskCard
                key={`offer-${item.offer!.id}`}
                item={item}
                isBusy={requestBusyId === item.id}
                onAccept={() => acceptOffer(item.id, item.offer!.id)}
              />
            ))}
            {taskInstances.available.map((item) => (
              <PoolTaskCard
                key={item.id}
                item={item}
                isClaiming={claimingId === item.id}
                onClaim={() => claim(item.id)}
                onFinish={() => claimAndComplete(item.id)}
              />
            ))}
          </>
        )}

        {view === "mine" && stats && <PresenceStrip activity={stats.activity} />}
      </View>

      <ClaimRequestSheet
        item={requestItem}
        graceDaysLeft={points?.graceDaysLeft ?? 0}
        spendablePoints={points?.spendablePoints ?? 0}
        isBusy={requestItem !== null && requestBusyId === requestItem.id}
        onClose={closeRequest}
        onGraceDay={async () => {
          if (requestItem && (await requestGraceDay(requestItem.id))) closeRequest();
        }}
        onOffer={async (dto) => {
          if (requestItem && (await createOffer(requestItem.id, dto))) closeRequest();
        }}
        onCancelOffer={(offerId) => {
          if (requestItem) void cancelOffer(requestItem.id, offerId);
        }}
      />
    </TabScreen>
  );
}
