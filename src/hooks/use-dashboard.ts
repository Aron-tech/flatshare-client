import i18n from "@/i18n";
import { dashboardService } from "@/services/api/DashboardService";
import { taskCompletionService } from "@/services/api/TaskCompletionService";
import { useHouseholdQuery } from "@/hooks/use-household-query";
import { emitTasksChanged, subscribeTasksChanged } from "@/lib/task-events";
import { taskService } from "@/services/api/TaskService";
import { TaskUserWeight } from "@/types/task";
import { useCallback, useEffect, useState } from "react";

const fetchDashboard = async (householdId: number, token: string) => {
  const [points, taskInstances] = await Promise.all([
    dashboardService.getMyPoints(householdId, token),
    dashboardService.getTaskInstances(householdId, token),
  ]);
  return { points, taskInstances };
};

const EMPTY_INSTANCES = { available: [], claimed: [] };

interface LocalCompletions<T> {
  /** A betöltött adat, amelyhez a teljesítések tartoznak; újratöltéskor érvénytelenek. */
  source: T | null;
  /** Teljesített feladat → jóváírt pont (a kártya "kész" állapotához). */
  points: Record<number, number>;
  /** A legutóbbi teljesítés után a backendtől kapott pontállás. */
  balance: number | null;
}

export function useDashboard() {
  const query = useHouseholdQuery(fetchDashboard);
  const { householdId, token, reload, setError } = query;

  useEffect(() => subscribeTasksChanged(() => void reload()), [reload]);

  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [weightingTaskId, setWeightingTaskId] = useState<number | null>(null);
  /**
   * A frissen teljesített feladatok "kész" állapotban maradnak a listában a
   * következő újratöltésig; utána a backend már nem adja vissza őket.
   */
  const [local, setLocal] = useState<LocalCompletions<typeof query.data>>({
    source: null,
    points: {},
    balance: null,
  });
  const completions =
    local.source === query.data ? local : { points: {}, balance: null };

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
        emitTasksChanged();
      }
    },
    [token, householdId, reload, setError]
  );

  /** Azonnali elvégzés: vállalás, majd rögtön lezárás (a backend a lezáráshoz vállalást kér). */
  const claimAndComplete = useCallback(
    async (taskInstanceId: number) => {
      if (!token || householdId === null) return;
      setClaimingId(taskInstanceId);
      try {
        await dashboardService.claimTaskInstance(householdId, taskInstanceId, token);
        await taskCompletionService.complete(householdId, taskInstanceId, token);
      } catch (e) {
        setError(e instanceof Error ? e.message : i18n.t("dashboard.actionFailed"));
      } finally {
        await reload();
        setClaimingId(null);
        emitTasksChanged();
      }
    },
    [token, householdId, reload, setError]
  );

  /** A pontszámítás a súlyozástól függ, ezért utána újratölt; `true`, ha sikerült (hibát a HttpClient jelez). */
  const setWeight = useCallback(
    async (taskId: number, weight: TaskUserWeight): Promise<boolean> => {
      if (!token || householdId === null) return false;
      setWeightingTaskId(taskId);
      try {
        await taskService.setUserWeight(householdId, taskId, weight, token);
        await reload();
        emitTasksChanged();
        return true;
      } catch {
        return false;
      } finally {
        setWeightingTaskId(null);
      }
    },
    [token, householdId, reload]
  );

  const complete = useCallback(
    /** A jóváírt pontot adja vissza, hiba esetén `null`-t. */
    async (taskInstanceId: number): Promise<number | null> => {
      if (!token || householdId === null) return null;
      setCompletingId(taskInstanceId);
      try {
        const result = await taskCompletionService.complete(householdId, taskInstanceId, token);
        setLocal((prev) => {
          const base = prev.source === query.data ? prev : { points: {}, balance: null };
          return {
            source: query.data,
            points: { ...base.points, [taskInstanceId]: result.points },
            balance: result.points_balance,
          };
        });
        return result.points;
      } catch (e) {
        setError(e instanceof Error ? e.message : i18n.t("dashboard.actionFailed"));
        return null;
      } finally {
        setCompletingId(null);
      }
    },
    [token, householdId, setError, query.data]
  );

  const points = query.data?.points ?? null;

  return {
    points: points
      ? {
          balance: completions.balance ?? points.household_user.points_balance,
          minPoints: points.min_points,
          role: points.household_user.role,
        }
      : null,
    taskInstances: query.data?.taskInstances ?? EMPTY_INSTANCES,
    completedIds: completions.points,
    isLoading: query.isLoading,
    isRefreshing: query.isRefreshing,
    error: query.error,
    claimingId,
    completingId,
    weightingTaskId,
    refresh: query.refresh,
    claim,
    claimAndComplete,
    complete,
    setWeight,
  };
}
