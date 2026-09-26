import { useHouseholdQuery } from "@/hooks/use-household-query";
import { HouseholdQueries } from "@/lib/queries";

export function useStats() {
  const { data, isLoading, error, refetch } = useHouseholdQuery(HouseholdQueries.stats);
  return { stats: data, isLoading, error, refetch };
}
