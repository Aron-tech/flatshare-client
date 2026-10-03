import type { HouseCompletion } from "@/types/house";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** At most this many cleanings play per open (the newest ones). */
const MAX_REPLAYS = 3;
/** On the first open only the last day's completions play. */
const FIRST_VISIT_WINDOW_MS = 24 * 60 * 60 * 1000;

const storageKey = (householdId: number) => `house_last_completion_${householdId}`;

/** Id of the last played completion in this household (per device). */
export async function readLastReplayed(householdId: number): Promise<number | null> {
  try {
    const value = await AsyncStorage.getItem(storageKey(householdId));
    return value ? Number(value) : null;
  } catch {
    return null;
  }
}

export async function saveLastReplayed(householdId: number, completionId: number): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(householdId), String(completionId));
  } catch {
    // At worst it plays again on the next open.
  }
}

/** Completions since the last open, in chronological order (the playback order). */
export function pendingReplays(
  completions: readonly HouseCompletion[],
  lastReplayed: number | null,
  now: number = Date.now()
): HouseCompletion[] {
  const fresh = completions.filter((completion) =>
    lastReplayed === null
      ? now - new Date(completion.completed_at).getTime() <= FIRST_VISIT_WINDOW_MS
      : completion.id > lastReplayed
  );
  return fresh.sort((a, b) => a.id - b.id).slice(-MAX_REPLAYS);
}
