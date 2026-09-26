import { useHouseholdMutation, useHouseholdQuery } from "@/hooks/use-household-query";
import { HouseholdQueries } from "@/lib/queries";
import { taskService } from "@/services/api/TaskService";
import { TaskUserWeight } from "@/types/task";

export function useChores() {
  const me = useHouseholdQuery(HouseholdQueries.me);
  const tasks = useHouseholdQuery(HouseholdQueries.tasks);

  const remove = useHouseholdMutation((h, token, taskId: number) => taskService.deleteTask(h, taskId, token));

  /** A pontszámítás a súlyozás alapján változik, ezért utána újratölt. */
  const weigh = useHouseholdMutation((h, token, { taskId, weight }: { taskId: number; weight: TaskUserWeight }) =>
    taskService.setUserWeight(h, taskId, weight, token)
  );

  return {
    // Gyerek szerepkör nem szerkesztheti és nem törölheti a feladatokat (a backend 403-mal utasítja el).
    canManage: me.data !== null && me.data.household_user.role !== "child",
    tasks: tasks.data,
    isLoading: me.isLoading || tasks.isLoading,
    error: me.error ?? tasks.error,
    refetch: () => Promise.all([me.refetch(), tasks.refetch()]),
    busyTaskId: remove.pending ?? weigh.pending?.taskId ?? null,
    /** `true`, ha sikerült (hiba esetén a HttpClient toastot mutat). */
    deleteTask: async (taskId: number) => (await remove.run(taskId)) !== null,
    setWeight: async (taskId: number, weight: TaskUserWeight) => (await weigh.run({ taskId, weight })) !== null,
  };
}
