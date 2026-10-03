import { focusManager, QueryClient } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";

/**
 * Shared query cache. `HttpClient` already shows the errors in a toast, so there is no automatic
 * retry (otherwise the same error would pop up several times).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// There is no `window` focus natively: stale data refreshes when the app comes to the foreground.
if (Platform.OS !== "web") {
  focusManager.setEventListener((setFocused) => {
    const subscription = AppState.addEventListener("change", (state) => setFocused(state === "active"));
    return () => subscription.remove();
  });
}
