import { RedemptionList } from "@/components/rewards/redemption-list";
import { TabScreen } from "@/components/screen";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { usePullToRefresh } from "@/hooks/use-household-query";
import { useRewards } from "@/hooks/use-rewards";
import { Reward } from "@/types/reward";
import { useRouter } from "expo-router";
import { CircleAlert, Pencil, Plus, Trash2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert as NativeAlert, View } from "react-native";

export default function RewardsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const {
    rewards,
    redemptions,
    pointsBalance,
    isAdmin,
    isLoading,
    error,
    busyRewardId,
    busyRedemptionId,
    refetch,
    redeem,
    remove,
    fulfillRedemption,
  } = useRewards();
  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  // A szüneteltetett jutalmat csak a feltöltője látja, hogy újra aktiválhassa.
  const visibleRewards = rewards?.filter((reward) => reward.is_active || reward.user_id === user?.id) ?? [];

  const confirmRedeem = (reward: Reward) =>
    NativeAlert.alert(
      t("rewards.redeemTitle"),
      t("rewards.redeemMessage", { name: reward.name, count: reward.points_cost }),
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("rewards.redeem"), onPress: () => void redeem(reward.id) },
      ]
    );

  const confirmDelete = (reward: Reward) =>
    NativeAlert.alert(t("rewards.deleteTitle"), t("rewards.deleteMessage", { name: reward.name }), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: () => void remove(reward.id) },
    ]);

  return (
    <TabScreen refreshing={refreshing} onRefresh={onRefresh}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-headline-lg">{t("tabs.rewards")}</Text>
          {!isLoading && (
            <Text className="text-body-md text-muted-foreground">{t("rewards.balance", { count: pointsBalance })}</Text>
          )}
        </View>
        <Button onPress={() => router.push("/reward-form")} accessibilityLabel={t("rewards.new")}>
          <Icon as={Plus} size={18} className="text-primary-foreground" />
          <Text>{t("chores.new")}</Text>
        </Button>
      </View>

      {error && (
        <Alert icon={CircleAlert} variant="destructive">
          <AlertTitle>{t("home.errorTitle")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {redemptions && (
        <RedemptionList redemptions={redemptions} busyId={busyRedemptionId} onFulfill={(id) => void fulfillRedemption(id)} />
      )}

      {isLoading && !rewards ? (
        <Skeleton className="h-40 w-full rounded-card" />
      ) : visibleRewards.length === 0 ? (
        <EmptyState text={t("rewards.empty")} />
      ) : (
        visibleRewards.map((reward) => {
          const isMine = reward.user_id === user?.id;
          const isBusy = busyRewardId === reward.id;
          const isOutOfStock = reward.stock_quantity !== null && reward.stock_quantity <= 0;
          const canAfford = pointsBalance >= reward.points_cost;
          const level = reward.difficulty?.difficulty;

          return (
            <View key={reward.id} className="gap-4 rounded-card bg-card p-5" style={Elevation.level1}>
              <View className="flex-row items-start justify-between gap-4">
                <View className="flex-1 gap-1">
                  <Text className="text-body-lg font-semibold">{reward.name}</Text>
                  {reward.description ? <Text variant="muted">{reward.description}</Text> : null}
                  <Text variant="muted">
                    {isMine ? t("rewards.mine") : t("rewards.createdBy", { name: reward.user?.name ?? "" })}
                  </Text>
                  {reward.stock_quantity !== null && (
                    <Text variant="muted">{t("rewards.stock", { count: reward.stock_quantity })}</Text>
                  )}
                </View>
                <View className="rounded-full bg-primary-soft px-3 py-1.5">
                  <Text className="text-label-lg text-primary-soft-foreground">
                    {t("rewards.cost", { count: reward.points_cost })}
                  </Text>
                </View>
              </View>

              <View className="flex-row flex-wrap gap-2">
                {level && (
                  <Badge variant="secondary">
                    <Text>{t(`rewards.difficulty.${level}`)}</Text>
                  </Badge>
                )}
                {!reward.is_active && (
                  <Badge variant="outline">
                    <Text>{t("rewards.paused")}</Text>
                  </Badge>
                )}
                {reward.is_editing && (
                  <Badge variant="default">
                    <Text>{t("rewards.editing")}</Text>
                  </Badge>
                )}
              </View>

              <View className="flex-row items-center justify-end gap-2">
                {isBusy && <ActivityIndicator className="text-primary" />}
                {(isMine || isAdmin) && (
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={isBusy}
                    onPress={() => confirmDelete(reward)}
                    accessibilityLabel={t("common.delete")}
                  >
                    <Icon as={Trash2} size={18} className="text-muted-foreground" />
                  </Button>
                )}
                {isMine ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isBusy}
                    onPress={() => router.push({ pathname: "/reward-form", params: { id: String(reward.id) } })}
                  >
                    <Icon as={Pencil} size={16} />
                    <Text>{t("rewards.edit")}</Text>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={isBusy || reward.is_editing || isOutOfStock || !canAfford}
                    onPress={() => confirmRedeem(reward)}
                  >
                    <Text>
                      {reward.is_editing
                        ? t("rewards.editing")
                        : isOutOfStock
                          ? t("rewards.outOfStock")
                          : canAfford
                            ? t("rewards.redeem")
                            : t("rewards.missingPoints", { count: reward.points_cost - pointsBalance })}
                    </Text>
                  </Button>
                )}
              </View>
            </View>
          );
        })
      )}
    </TabScreen>
  );
}
