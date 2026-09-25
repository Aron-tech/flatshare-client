import { useHouseholdQuery } from "@/hooks/use-household-query";
import { subscribeRewardsChanged } from "@/lib/reward-events";
import { dashboardService } from "@/services/api/DashboardService";
import { rewardService } from "@/services/api/RewardService";
import { useCallback, useEffect, useState } from "react";

const fetchRewards = async (householdId: number, token: string) => {
  const [rewards, me] = await Promise.all([
    rewardService.getByHousehold(householdId, token),
    dashboardService.getMyPoints(householdId, token),
  ]);
  return { rewards, pointsBalance: me.household_user.points_balance, isAdmin: me.household_user.role === "admin" };
};

export function useRewards() {
  const query = useHouseholdQuery(fetchRewards);
  const { householdId, token, reload } = query;
  const [busyRewardId, setBusyRewardId] = useState<number | null>(null);

  useEffect(() => subscribeRewardsChanged(() => void reload()), [reload]);

  /** Jutalom-művelet: hiba esetén a HttpClient toastot mutat; `true`, ha sikerült. */
  const runRewardAction = useCallback(
    async (rewardId: number, action: (householdId: number, token: string) => Promise<unknown>) => {
      if (!token || householdId === null) return false;
      setBusyRewardId(rewardId);
      try {
        await action(householdId, token);
        return true;
      } catch {
        return false;
      } finally {
        // Hiba után is frissít, pl. ha közben szerkesztés alá került a jutalom.
        await reload();
        setBusyRewardId(null);
      }
    },
    [token, householdId, reload]
  );

  const redeem = useCallback(
    (rewardId: number) => runRewardAction(rewardId, (h, tk) => rewardService.redeem(h, rewardId, tk)),
    [runRewardAction]
  );

  const remove = useCallback(
    (rewardId: number) => runRewardAction(rewardId, (h, tk) => rewardService.remove(h, rewardId, tk)),
    [runRewardAction]
  );

  return {
    rewards: query.data?.rewards ?? null,
    pointsBalance: query.data?.pointsBalance ?? 0,
    isAdmin: query.data?.isAdmin ?? false,
    isLoading: query.isLoading,
    isRefreshing: query.isRefreshing,
    error: query.error,
    busyRewardId,
    refresh: query.refresh,
    redeem,
    remove,
  };
}
