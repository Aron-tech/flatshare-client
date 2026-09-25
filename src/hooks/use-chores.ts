import i18n from "@/i18n";
import { dashboardService } from "@/services/api/DashboardService";
import { taskService } from "@/services/api/TaskService";
import { useHouseholdQuery } from "@/hooks/use-household-query";
import { useCallback, useState } from "react";

const fetchChores = async (householdId: number, token: string) => {
  const [me, taskInstances] = await Promise.all([
    dashboardService.getMyPoints(householdId, token),
    dashboardService.getTaskInstances(householdId, token),
  ]);
  // A feladat-definíciókat csak admin kérheti le (különben 403 + hiba toast).
  const isAdmin = me.household_user.role === "admin";
  const tasks = isAdmin ? await taskService.getHouseholdTasks(householdId, token) : null;
  return { isAdmin, tasks, pool: taskInstances.available };
};

export function useChores() {
  const query = useHouseholdQuery(fetchChores);
  const { householdId, token, reload, setError } = query;
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const claim = useCallback(
    async (taskInstanceId: number) => {
      if (!token || householdId === null) return;
      setClaimingId(taskInstanceId);
      try {
        await dashboardService.claimTaskInstance(householdId, taskInstanceId, token);
      } catch (e) {
        setError(e instanceof Error ? e.message : i18n.t("dashboard.actionFailed"));
      } finally {
        await reload();
        setClaimingId(null);
      }
    },
    [token, householdId, reload, setError]
  );

  return {
    isAdmin: query.data?.isAdmin ?? false,
    tasks: query.data?.tasks ?? null,
    pool: query.data?.pool ?? [],
    isLoading: query.isLoading,
    isRefreshing: query.isRefreshing,
    error: query.error,
    claimingId,
    refresh: query.refresh,
    claim,
  };
}
