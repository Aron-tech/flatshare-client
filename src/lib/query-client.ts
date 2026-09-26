import { focusManager, QueryClient } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";

/**
 * Közös lekérdezés-cache. A hibákat a `HttpClient` már toastban jelzi, ezért nincs
 * automatikus újrapróbálás (különben ugyanaz a hiba többször is felugrana).
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

// Natívan nincs `window` fókusz: az app előtérbe kerülésekor frissülnek az elavult adatok.
if (Platform.OS !== "web") {
  focusManager.setEventListener((setFocused) => {
    const subscription = AppState.addEventListener("change", (state) => setFocused(state === "active"));
    return () => subscription.remove();
  });
}
