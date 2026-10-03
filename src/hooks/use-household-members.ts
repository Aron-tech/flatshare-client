import { useHouseholdQuery } from "@/hooks/use-household-query";
import { HouseholdQueries } from "@/lib/queries";
import { HouseholdMember } from "@/types/household-user";

const NO_MEMBERS: HouseholdMember[] = [];

/** Members of the active household (name + user_id), any member can fetch them. */
export function useHouseholdMembers() {
  return useHouseholdQuery(HouseholdQueries.members).data ?? NO_MEMBERS;
}
