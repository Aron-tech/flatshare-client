import { calendarService } from "@/services/api/CalendarService";
import { dashboardService } from "@/services/api/DashboardService";
import { householdUserService } from "@/services/api/HouseholdUserService";
import { houseService } from "@/services/api/HouseService";
import { rewardService } from "@/services/api/RewardService";
import { statsService } from "@/services/api/StatsService";
import { stickerAlbumService } from "@/services/api/StickerAlbumService";
import { taskService } from "@/services/api/TaskService";
import type { CalendarScope } from "@/types/calendar";
import type { QueryClient, QueryKey } from "@tanstack/react-query";

/** Common key prefix of all of a household's queries (for invalidation). */
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

/** A household's queries: the key and the fetch function in one place. */
export const HouseholdQueries = {
  /** Own membership: role, weekly points, spendable points, grace days. */
  me: householdQuery("me", (h, token) => dashboardService.getMyPoints(h, token)),
  taskInstances: householdQuery("task-instances", (h, token) => dashboardService.getTaskInstances(h, token)),
  tasks: householdQuery("tasks", (h, token) => taskService.getHouseholdTasks(h, token)),
  oneOffTasks: householdQuery("one-off-tasks", (h, token) => taskService.getOneOffTasks(h, token)),
  stats: householdQuery("stats", (h, token) => statsService.getStats(h, token)),
  /** The House view: mess per zone, shared mood, the members' pets. */
  house: householdQuery("house", (h, token) => houseService.getState(h, token)),
  rewards: householdQuery("rewards", (h, token) => rewardService.getByHousehold(h, token)),
  redemptions: householdQuery("redemptions", (h, token) => rewardService.getRedemptions(h, token)),
  /** Name + user_id, any member can fetch it. */
  members: householdQuery("members", (h, token) => householdUserService.getMembers(h, token)),
  /** Memberships with roles (admins only). */
  householdUsers: householdQuery("household-users", (h, token) => householdUserService.getByHousehold(h, token)),
  /** Csak adminnak. */
  departures: householdQuery("member-departures", (h, token) => householdUserService.getDepartures(h, token)),
  /** Own sticker album (the fetch backfills the stickers of earlier completions). */
  stickerAlbum: householdQuery("sticker-album", (h, token) => stickerAlbumService.getAlbum(h, token)),
  /** The calendar feed's links (the first request creates them). */
  calendarSubscription: householdQuery("calendar-subscription", (h, token) => calendarService.getSubscription(h, token)),
} as const;

/** The calendar's events for the view's period; the key is under the household, so it also refreshes after actions. */
export function calendarEventsQuery(scope: CalendarScope, from: Date, to: Date) {
  return {
    key: (householdId: number) => [...householdKey(householdId), "calendar", scope, from.toISOString(), to.toISOString()],
    fetch: (householdId: number, token: string) => calendarService.getEvents(householdId, scope, from, to, token),
  } satisfies HouseholdQuery<unknown>;
}

/** Returns the data from the cache if fresh; otherwise fetches it (e.g. to prefill an edit form). */
export function fetchHouseholdQuery<T>(
  client: QueryClient,
  query: HouseholdQuery<T>,
  householdId: number,
  token: string
): Promise<T> {
  return client.fetchQuery({ queryKey: query.key(householdId), queryFn: () => query.fetch(householdId, token) });
}
