import { useHouseholdQuery } from "@/hooks/use-household-query";
import { HouseholdQueries } from "@/lib/queries";
import { HouseholdMember } from "@/types/household-user";

const NO_MEMBERS: HouseholdMember[] = [];

/** Az aktív háztartás tagjai (név + user_id), bármely tag lekérheti. */
export function useHouseholdMembers() {
  return useHouseholdQuery(HouseholdQueries.members).data ?? NO_MEMBERS;
}
