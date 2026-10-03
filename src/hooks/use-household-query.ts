import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import i18n from "@/i18n";
import { householdKey, HouseholdQuery } from "@/lib/queries";
import { keepPreviousData, skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

/** The active household's id and the sign-in token. */
export function useHouseholdSession() {
  const { token } = useAuth();
  const { activeHousehold } = useHousehold();
  return { householdId: activeHousehold?.id ?? null, token };
}

/** Marks all queries of the active household as stale (the visible ones refetch immediately). */
export function useInvalidateHousehold() {
  const queryClient = useQueryClient();
  const { householdId } = useHouseholdSession();
  return () =>
    householdId === null ? Promise.resolve() : queryClient.invalidateQueries({ queryKey: householdKey(householdId) });
}

/**
 * Data of the active household. On a household switch the other key means the old household's data is
 * not shown. With `enabled: false` it does not load (e.g. an endpoint only admins can reach).
 */
export function useHouseholdQuery<T>(
  query: HouseholdQuery<T>,
  { enabled = true, keepPrevious = false }: { enabled?: boolean; keepPrevious?: boolean } = {}
) {
  const { householdId, token } = useHouseholdSession();
  const canFetch = enabled && token !== null && householdId !== null;

  const result = useQuery({
    queryKey: query.key(householdId ?? 0),
    queryFn: canFetch ? () => query.fetch(householdId, token) : skipToken,
    // When paging (e.g. calendar) the old data stays visible until the new period loads.
    placeholderData: keepPrevious ? keepPreviousData : undefined,
  });

  return {
    data: result.data ?? null,
    // Loading until the current household's data has arrived.
    isLoading: result.isPending && !result.isError,
    error: result.error ? result.error.message || i18n.t("dashboard.loadFailed") : null,
    refetch: result.refetch,
    /** Fetching in the background (e.g. the previous period's data is visible). */
    isFetching: result.isFetching,
  };
}

/**
 * Household action. Afterwards (also on an error, e.g. if the state changed meanwhile) the household's
 * data reloads. `HttpClient` already showed the error toast.
 */
export function useHouseholdMutation<V, R = unknown>(
  action: (householdId: number, token: string, variables: V) => Promise<R>,
  { invalidate = true }: { invalidate?: boolean } = {}
) {
  const { householdId, token } = useHouseholdSession();
  const invalidateHousehold = useInvalidateHousehold();

  const mutation = useMutation({
    mutationFn: (variables: V) => {
      if (token === null || householdId === null) throw new Error(i18n.t("errors.operationFailed"));
      return action(householdId, token, variables);
    },
    onSettled: invalidate ? invalidateHousehold : undefined,
  });

  return {
    /** The action's result, or `null` if it failed. */
    run: async (variables: V): Promise<R | null> => {
      try {
        return await mutation.mutateAsync(variables);
      } catch {
        return null;
      }
    },
    /** The running action's parameter (e.g. the task id), otherwise `null`. */
    pending: mutation.isPending ? mutation.variables : null,
  };
}

/** Pull-to-refresh: the indicator only spins during a refresh started by the user. */
export function usePullToRefresh(...refetchers: (() => Promise<unknown>)[]) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all(refetchers.map((refetch) => refetch()));
    } finally {
      setRefreshing(false);
    }
  };

  return { refreshing, onRefresh };
}
