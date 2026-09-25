import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import i18n from "@/i18n";
import { statsService } from "@/services/api/StatsService";
import { ActivityEntry } from "@/types/stats";
import { useCallback, useEffect, useRef, useState } from "react";

const PAGE_SIZE = 50;

/**
 * A háztartás teljesítéseinek oldalankénti betöltése. Az első oldal a megnyitáskor
 * töltődik, a következők a `loadMore` hívásakor (görgetés a lista végére).
 */
export function useActivityFeed(enabled: boolean) {
  const { token } = useAuth();
  const { activeHousehold } = useHousehold();
  const householdId = activeHousehold?.id ?? null;

  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<number | null>(null);
  const hasMoreRef = useRef(true);
  const inFlightRef = useRef(false);
  // Megnyitásonként új generáció: a lezárt/lecserélt kérések válasza eldobásra kerül.
  const generationRef = useRef(0);

  const fetchPage = useCallback(
    async (reset: boolean) => {
      if (!token || householdId === null || inFlightRef.current) return;
      if (!reset && !hasMoreRef.current) return;

      const generation = generationRef.current;
      inFlightRef.current = true;
      try {
        const page = await statsService.getActivity(householdId, token, reset ? null : cursorRef.current, PAGE_SIZE);
        if (generation !== generationRef.current) return;
        cursorRef.current = page.next_cursor;
        hasMoreRef.current = page.next_cursor !== null;
        setEntries((current) => (reset ? page.data : [...current, ...page.data]));
        setError(null);
      } catch (e) {
        if (generation !== generationRef.current) return;
        setError(e instanceof Error ? e.message : i18n.t("dashboard.loadFailed"));
        // Hiba után ne próbálkozzon végtelenül az onEndReached; újranyitáskor újra indul.
        hasMoreRef.current = false;
      } finally {
        if (generation === generationRef.current) {
          inFlightRef.current = false;
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [token, householdId],
  );

  useEffect(() => {
    generationRef.current += 1;
    inFlightRef.current = false;
    cursorRef.current = null;
    hasMoreRef.current = true;
    setEntries([]);
    setError(null);
    if (!enabled) {
      setIsLoading(false);
      setIsLoadingMore(false);
      return;
    }
    setIsLoading(true);
    void fetchPage(true);
    return () => {
      generationRef.current += 1;
    };
  }, [enabled, fetchPage]);

  const loadMore = useCallback(() => {
    if (inFlightRef.current || !hasMoreRef.current) return;
    setIsLoadingMore(true);
    void fetchPage(false);
  }, [fetchPage]);

  return { entries, isLoading, isLoadingMore, error, loadMore };
}
