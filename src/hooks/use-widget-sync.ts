import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { clearWidgetSession, reloadWidgets, syncWidgetSession } from "@/services/widgets/WidgetSync";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/** The data the widgets show; a fresh load of any of these refreshes them. */
const WIDGET_SCOPES = new Set(["me", "task-instances", "house"]);

/** Keeps the iOS widgets on the signed-in account, the active household and the app's language. */
export function useWidgetSync() {
  const { token, isLoading: authLoading } = useAuth();
  const { activeHousehold, isLoading: householdLoading } = useHousehold();
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      void clearWidgetSession();
    } else if (activeHousehold) {
      void syncWidgetSession(token, {
        householdId: activeHousehold.id,
        language: i18n.language,
        settings: activeHousehold.settings,
      });
    } else if (!householdLoading) {
      // Left the last household: the widgets must not keep showing it.
      void clearWidgetSession();
    }
  }, [token, authLoading, activeHousehold, householdLoading, i18n.language]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== "updated" || event.action.type !== "success") return;
      if (!WIDGET_SCOPES.has(String(event.query.queryKey[2]))) return;
      // Several queries load together after an action; one reload is enough.
      clearTimeout(timer);
      timer = setTimeout(reloadWidgets, 1000);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [queryClient]);
}
