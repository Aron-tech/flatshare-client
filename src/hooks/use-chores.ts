import { dashboardService } from "@/services/api/DashboardService";
import { taskService } from "@/services/api/TaskService";
import { useHouseholdQuery } from "@/hooks/use-household-query";
import { emitTasksChanged, subscribeTasksChanged } from "@/lib/task-events";
import { TaskUserWeight } from "@/types/task";
import { useCallback, useEffect, useState } from "react";

const fetchChores = async (householdId: number, token: string) => {
  const [me, tasks] = await Promise.all([
    dashboardService.getMyPoints(householdId, token),
    taskService.getHouseholdTasks(householdId, token),
  ]);
  // Gyerek szerepkör nem szerkesztheti és nem törölheti a feladatokat (a backend 403-mal utasítja el).
  return { canManage: me.household_user.role !== "child", tasks };
};

export function useChores() {
  const query = useHouseholdQuery(fetchChores);
  const { householdId, token, reload } = query;
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);

  useEffect(() => subscribeTasksChanged(() => void reload()), [reload]);

  /** Feladat-művelet: hiba esetén a HttpClient toastot mutat; `true`, ha sikerült. */
  const runTaskAction = useCallback(
    async (taskId: number, action: (householdId: number, token: string) => Promise<void>) => {
      if (!token || householdId === null) return false;
      setBusyTaskId(taskId);
      try {
        await action(householdId, token);
        await reload();
        emitTasksChanged();
        return true;
      } catch {
        return false;
      } finally {
        setBusyTaskId(null);
      }
    },
    [token, householdId, reload]
  );

  const deleteTask = useCallback(
    (taskId: number) =>
      runTaskAction(taskId, (h, tk) => taskService.deleteTask(h, taskId, tk)),
    [runTaskAction]
  );

  /** A pontszámítás a súlyozás alapján változik, ezért utána újratölt. */
  const setWeight = useCallback(
    (taskId: number, weight: TaskUserWeight) =>
      runTaskAction(taskId, (h, tk) => taskService.setUserWeight(h, taskId, weight, tk)),
    [runTaskAction]
  );

  return {
    canManage: query.data?.canManage ?? false,
    tasks: query.data?.tasks ?? null,
    isLoading: query.isLoading,
    isRefreshing: query.isRefreshing,
    error: query.error,
    busyTaskId,
    refresh: query.refresh,
    deleteTask,
    setWeight,
  };
}
