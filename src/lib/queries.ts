import { dashboardService } from "@/services/api/DashboardService";
import { householdUserService } from "@/services/api/HouseholdUserService";
import { rewardService } from "@/services/api/RewardService";
import { statsService } from "@/services/api/StatsService";
import { taskService } from "@/services/api/TaskService";
import type { QueryClient, QueryKey } from "@tanstack/react-query";

/** Egy háztartás összes lekérdezésének közös kulcs-előtagja (érvénytelenítéshez). */
export const householdKey = (householdId: number) => ["household", householdId] as const;

export const HOUSEHOLDS_KEY = ["households"] as const;

type HouseholdFetcher<T> = (householdId: number, token: string) => Promise<T>;

export interface HouseholdQuery<T> {
  key: (householdId: number) => QueryKey;
  fetch: HouseholdFetcher<T>;
}

function householdQuery<T>(scope: string, fetch: HouseholdFetcher<T>): HouseholdQuery<T> {
  return { key: (householdId) => [...householdKey(householdId), scope], fetch };
}

/** Egy háztartáshoz tartozó lekérdezések: a kulcs és a lekérő függvény egy helyen. */
export const HouseholdQueries = {
  /** A saját tagság: szerepkör, heti pont, költhető pont, türelmi napok. */
  me: householdQuery("me", (h, token) => dashboardService.getMyPoints(h, token)),
  taskInstances: householdQuery("task-instances", (h, token) => dashboardService.getTaskInstances(h, token)),
  tasks: householdQuery("tasks", (h, token) => taskService.getHouseholdTasks(h, token)),
  oneOffTasks: householdQuery("one-off-tasks", (h, token) => taskService.getOneOffTasks(h, token)),
  stats: householdQuery("stats", (h, token) => statsService.getStats(h, token)),
  rewards: householdQuery("rewards", (h, token) => rewardService.getByHousehold(h, token)),
  redemptions: householdQuery("redemptions", (h, token) => rewardService.getRedemptions(h, token)),
  /** Név + user_id, bármely tag lekérheti. */
  members: householdQuery("members", (h, token) => householdUserService.getMembers(h, token)),
  /** Tagság szerepkörrel (csak adminnak). */
  householdUsers: householdQuery("household-users", (h, token) => householdUserService.getByHousehold(h, token)),
  /** Csak adminnak. */
  departures: householdQuery("member-departures", (h, token) => householdUserService.getDepartures(h, token)),
} as const;

/** Cache-ből adja az adatot, ha friss; különben lekéri (pl. szerkesztő űrlap előtöltéséhez). */
export function fetchHouseholdQuery<T>(
  client: QueryClient,
  query: HouseholdQuery<T>,
  householdId: number,
  token: string
): Promise<T> {
  return client.fetchQuery({ queryKey: query.key(householdId), queryFn: () => query.fetch(householdId, token) });
}
