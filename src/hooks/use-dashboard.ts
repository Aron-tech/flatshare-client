import i18n from "@/i18n";
import { dashboardService } from "@/services/api/DashboardService";
import { taskCompletionService } from "@/services/mock/MockTaskCompletionService";
import { useHouseholdQuery } from "@/hooks/use-household-query";
import { useCallback, useState } from "react";

const fetchDashboard = async (householdId: number, token: string) => {
  const [points, taskInstances] = await Promise.all([
    dashboardService.getMyPoints(householdId, token),
    dashboardService.getTaskInstances(householdId, token),
  ]);
  return { points, taskInstances };
};

const EMPTY_INSTANCES = { available: [], claimed: [] };

export function useDashboard() {
  const query = useHouseholdQuery(fetchDashboard);
  const { householdId, token, reload, setError } = query;

  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);
  /**
   * Helyben teljesítettnek jelölt feladatok és a jóváírt pontjuk. Amíg a
   * teljesítés mock, a backend nem tud róluk – újratöltéskor is megmaradnak.
   */
  const [completed, setCompleted] = useState<Record<number, number>>({});

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

  const complete = useCallback(
    async (taskInstanceId: number, points: number | null) => {
      if (!token || householdId === null) return;
      setCompletingId(taskInstanceId);
      try {
        await taskCompletionService.complete(householdId, taskInstanceId, token);
        setCompleted((prev) => ({ ...prev, [taskInstanceId]: points ?? 0 }));
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : i18n.t("dashboard.actionFailed"));
        return false;
      } finally {
        setCompletingId(null);
      }
    },
    [token, householdId, setError]
  );

  const earned = Object.values(completed).reduce((sum, p) => sum + p, 0);
  const points = query.data?.points ?? null;

  return {
    points: points
      ? {
          balance: points.household_user.points_balance + earned,
          minPoints: points.min_points,
          role: points.household_user.role,
        }
      : null,
    taskInstances: query.data?.taskInstances ?? EMPTY_INSTANCES,
    completedIds: completed,
    isLoading: query.isLoading,
    isRefreshing: query.isRefreshing,
    error: query.error,
    claimingId,
    completingId,
    refresh: query.refresh,
    claim,
    complete,
  };
}
