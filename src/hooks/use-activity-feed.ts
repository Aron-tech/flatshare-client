import { useHouseholdSession } from "@/hooks/use-household-query";
import i18n from "@/i18n";
import { householdKey } from "@/lib/queries";
import { statsService } from "@/services/api/StatsService";
import { skipToken, useInfiniteQuery } from "@tanstack/react-query";

const PAGE_SIZE = 50;

/**
 * A háztartás teljesítéseinek oldalankénti betöltése. Az első oldal a megnyitáskor
 * töltődik, a következők a `loadMore` hívásakor (görgetés a lista végére).
 */
export function useActivityFeed(enabled: boolean) {
  const { householdId, token } = useHouseholdSession();
  const canFetch = enabled && token !== null && householdId !== null;

  const query = useInfiniteQuery({
    queryKey: [...householdKey(householdId ?? 0), "activity"],
    queryFn: canFetch
      ? ({ pageParam }) => statsService.getActivity(householdId, token, pageParam, PAGE_SIZE)
      : skipToken,
    initialPageParam: null as number | null,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
  });

  return {
    entries: query.data?.pages.flatMap((page) => page.data) ?? [],
    isLoading: canFetch && query.isPending,
    isLoadingMore: query.isFetchingNextPage,
    error: query.error ? query.error.message || i18n.t("dashboard.loadFailed") : null,
    loadMore: () => {
      // Hiba után ne próbálkozzon végtelenül az onEndReached.
      if (query.hasNextPage && !query.isFetching && !query.isError) void query.fetchNextPage();
    },
  };
}
