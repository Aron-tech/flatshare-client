import { useHouseholdMutation, useHouseholdQuery } from "@/hooks/use-household-query";
import { HouseholdQueries } from "@/lib/queries";
import { householdUserService } from "@/services/api/HouseholdUserService";
import { MemberDeparture } from "@/types/member-departure";

const NO_DEPARTURES: MemberDeparture[] = [];

/**
 * A távozott tagok, akiknek a feladatairól az adminnak döntenie kell.
 * `enabled: false` mellett nem tölt (a végpont nem adminnak 403).
 */
export function useMemberDepartures({ enabled = true }: { enabled?: boolean } = {}) {
  const query = useHouseholdQuery(HouseholdQueries.departures, { enabled });

  /** A törölt feladatok számát adja vissza, hiba esetén `null`-t. */
  const resolve = useHouseholdMutation(
    (h, token, { departureId, taskIds }: { departureId: number; taskIds: number[] }) =>
      householdUserService.resolveDeparture(h, departureId, taskIds, token)
  );

  return { departures: query.data ?? NO_DEPARTURES, isLoading: query.isLoading, resolve: resolve.run };
}
