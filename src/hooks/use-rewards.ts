import { useHouseholdMutation, useHouseholdQuery } from "@/hooks/use-household-query";
import { HouseholdQueries } from "@/lib/queries";
import { rewardService } from "@/services/api/RewardService";

export function useRewards() {
  const rewards = useHouseholdQuery(HouseholdQueries.rewards);
  const redemptions = useHouseholdQuery(HouseholdQueries.redemptions);
  const me = useHouseholdQuery(HouseholdQueries.me);

  const redeem = useHouseholdMutation((h, token, rewardId: number) => rewardService.redeem(h, rewardId, token));
  const remove = useHouseholdMutation((h, token, rewardId: number) => rewardService.remove(h, rewardId, token));
  const fulfill = useHouseholdMutation((h, token, redemptionId: number) =>
    rewardService.fulfillRedemption(h, redemptionId, token)
  );

  return {
    rewards: rewards.data,
    redemptions: redemptions.data,
    pointsBalance: me.data?.spendable_points ?? 0,
    isAdmin: me.data?.household_user.role === "admin",
    isLoading: rewards.isLoading || me.isLoading,
    error: rewards.error ?? redemptions.error ?? me.error,
    refetch: () => Promise.all([rewards.refetch(), redemptions.refetch(), me.refetch()]),
    busyRewardId: redeem.pending ?? remove.pending ?? null,
    busyRedemptionId: fulfill.pending ?? null,
    redeem: redeem.run,
    remove: remove.run,
    fulfillRedemption: fulfill.run,
  };
}
