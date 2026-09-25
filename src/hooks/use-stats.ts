import { statsService } from "@/services/mock/MockStatsService";
import { useHouseholdQuery } from "@/hooks/use-household-query";

const fetchStats = (householdId: number, token: string) =>
  statsService.getStats(householdId, token);

export function useStats() {
  const { data, isLoading, isRefreshing, error, refresh } = useHouseholdQuery(fetchStats);
  return { stats: data, isLoading, isRefreshing, error, refresh };
}
