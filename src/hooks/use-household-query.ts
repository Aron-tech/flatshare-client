import i18n from "@/i18n";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { useCallback, useEffect, useState } from "react";

type Fetcher<T> = (householdId: number, token: string) => Promise<T>;

interface State<T> {
  householdId: number | null;
  data: T | null;
}

/**
 * Az aktív háztartáshoz tartozó adat betöltése. Háztartásváltáskor újratölt,
 * a régi háztartás adatát nem mutatja. A `fetcher` legyen stabil referencia.
 */
export function useHouseholdQuery<T>(fetcher: Fetcher<T>) {
  const { token } = useAuth();
  const { activeHousehold } = useHousehold();
  const householdId = activeHousehold?.id ?? null;

  const [state, setState] = useState<State<T>>({ householdId: null, data: null });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || householdId === null) return;
    try {
      const data = await fetcher(householdId, token);
      setState({ householdId, data });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : i18n.t("dashboard.loadFailed"));
    }
  }, [token, householdId, fetcher]);

  useEffect(() => {
    if (!token || householdId === null) return;
    let cancelled = false;
    fetcher(householdId, token)
      .then((data) => {
        if (cancelled) return;
        setState({ householdId, data });
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : i18n.t("dashboard.loadFailed"));
      });
    return () => {
      cancelled = true;
    };
  }, [token, householdId, fetcher]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }, [load]);

  const isCurrent = state.householdId === householdId;

  return {
    data: isCurrent ? state.data : null,
    // Betöltés alatt van, amíg az aktuális háztartás adata meg nem érkezett.
    isLoading: !isCurrent && error === null,
    isRefreshing,
    error,
    setError,
    reload: load,
    refresh,
    householdId,
    token,
  };
}
