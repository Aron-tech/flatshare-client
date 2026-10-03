import type { HouseCompletion } from "@/types/house";
import AsyncStorage from "@react-native-async-storage/async-storage";

/** Egy megnyitáskor legfeljebb ennyi takarítás játszódik le (a legújabbak). */
const MAX_REPLAYS = 3;
/** Az első megnyitáskor csak az utóbbi egy nap teljesítései játszódnak le. */
const FIRST_VISIT_WINDOW_MS = 24 * 60 * 60 * 1000;

const storageKey = (householdId: number) => `house_last_completion_${householdId}`;

/** Az utoljára lejátszott teljesítés azonosítója ebben a háztartásban (eszközönként). */
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
    // Legfeljebb a következő megnyitáskor újra lejátszódik.
  }
}

/** A legutóbbi megnyitás óta történt teljesítések, időrendben (a lejátszás sorrendje). */
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
