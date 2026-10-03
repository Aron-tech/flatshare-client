import { useHouseholdMutation, useHouseholdQuery } from "@/hooks/use-household-query";
import { HouseholdQueries } from "@/lib/queries";
import { householdUserService } from "@/services/api/HouseholdUserService";
import { MemberDeparture } from "@/types/member-departure";

const NO_DEPARTURES: MemberDeparture[] = [];

/**
 * Departed members whose tasks the admin has to decide about.
 * With `enabled: false` it does not load (the endpoint returns 403 for non-admins).
 */
export function useMemberDepartures({ enabled = true }: { enabled?: boolean } = {}) {
  const query = useHouseholdQuery(HouseholdQueries.departures, { enabled });

  /** Returns the number of deleted tasks, `null` on an error. */
  const resolve = useHouseholdMutation(
    (h, token, { departureId, taskIds }: { departureId: number; taskIds: number[] }) =>
      householdUserService.resolveDeparture(h, departureId, taskIds, token)
  );

  return { departures: query.data ?? NO_DEPARTURES, isLoading: query.isLoading, resolve: resolve.run };
}
