import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import i18n from "@/i18n";
import { householdKey, HouseholdQuery } from "@/lib/queries";
import { skipToken, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

/** Az aktív háztartás azonosítója és a bejelentkezési token. */
export function useHouseholdSession() {
  const { token } = useAuth();
  const { activeHousehold } = useHousehold();
  return { householdId: activeHousehold?.id ?? null, token };
}

/** Az aktív háztartás összes lekérdezését elavultnak jelöli (a láthatók azonnal újratöltenek). */
export function useInvalidateHousehold() {
  const queryClient = useQueryClient();
  const { householdId } = useHouseholdSession();
  return () =>
    householdId === null ? Promise.resolve() : queryClient.invalidateQueries({ queryKey: householdKey(householdId) });
}

/**
 * Az aktív háztartáshoz tartozó adat. Háztartásváltáskor a másik kulcs miatt nem a régi
 * háztartás adatát mutatja. `enabled: false` mellett nem tölt (pl. csak adminnak elérhető végpont).
 */
export function useHouseholdQuery<T>(query: HouseholdQuery<T>, { enabled = true }: { enabled?: boolean } = {}) {
  const { householdId, token } = useHouseholdSession();
  const canFetch = enabled && token !== null && householdId !== null;

  const result = useQuery({
    queryKey: query.key(householdId ?? 0),
    queryFn: canFetch ? () => query.fetch(householdId, token) : skipToken,
  });

  return {
    data: result.data ?? null,
    // Betöltés alatt van, amíg az aktuális háztartás adata meg nem érkezett.
    isLoading: result.isPending && !result.isError,
    error: result.error ? result.error.message || i18n.t("dashboard.loadFailed") : null,
    refetch: result.refetch,
  };
}

/**
 * Háztartás-művelet. Utána (hiba esetén is, pl. ha közben megváltozott az állapot) a háztartás
 * adatai újratöltődnek. A hibát a `HttpClient` már toastban megjelenítette.
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
    /** A művelet eredménye, vagy `null`, ha nem sikerült. */
    run: async (variables: V): Promise<R | null> => {
      try {
        return await mutation.mutateAsync(variables);
      } catch {
        return null;
      }
    },
    /** A futó művelet paramétere (pl. a feladat azonosítója), különben `null`. */
    pending: mutation.isPending ? mutation.variables : null,
  };
}

/** Lehúzásos frissítés: csak a felhasználó által indított frissítés alatt pörög a jelző. */
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
