import { statsService } from "@/services/api/StatsService";
import { useHouseholdQuery } from "@/hooks/use-household-query";

const fetchStats = (householdId: number, token: string) =>
  statsService.getStats(householdId, token);

export function useStats() {
  const { data, isLoading, isRefreshing, error, refresh } = useHouseholdQuery(fetchStats);
  return { stats: data, isLoading, isRefreshing, error, refresh };
}
