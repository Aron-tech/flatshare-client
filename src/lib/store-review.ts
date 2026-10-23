import type { TaskCompletionResponse } from "@/types/dashboard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

const COMPLETIONS_KEY = "store_review_completions";
const LAST_REQUEST_KEY = "store_review_last_request";

/** Ask only once the user has some history with the app, not on the very first chore. */
const MIN_COMPLETIONS = 3;
/** iOS shows the prompt at most 3 times a year anyway; spacing out the calls keeps them for good moments. */
const MIN_DAYS_BETWEEN = 120;
/** Let the closing modal and the success toast settle before the system sheet appears. */
const REQUEST_DELAY_MS = 1500;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Called after every completed chore. Uses the system review sheet (SKStoreReviewController on iOS),
 * which decides on its own whether to show anything; there is no custom pre-prompt on purpose.
 */
export async function requestReviewAfterChore(result: TaskCompletionResponse) {
  try {
    const completions = Number((await AsyncStorage.getItem(COMPLETIONS_KEY)) ?? 0) + 1;
    await AsyncStorage.setItem(COMPLETIONS_KEY, String(completions));
    if (completions < MIN_COMPLETIONS) return;

    // The sticker popup would cover the review sheet; the next chore gets the chance instead.
    if (result.new_sticker) return;

    const lastRequest = Number((await AsyncStorage.getItem(LAST_REQUEST_KEY)) ?? 0);
    if (Date.now() - lastRequest < MIN_DAYS_BETWEEN * DAY_MS) return;

    if (!(await StoreReview.isAvailableAsync())) return;

    await AsyncStorage.setItem(LAST_REQUEST_KEY, String(Date.now()));
    setTimeout(() => {
      StoreReview.requestReview().catch(() => {});
    }, REQUEST_DELAY_MS);
  } catch {
    // A review request must never break the completion flow.
  }
}
