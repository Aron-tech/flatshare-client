import { useHouseholdMutation, useHouseholdQuery } from "@/hooks/use-household-query";
import { HouseholdQueries } from "@/lib/queries";
import { taskService } from "@/services/api/TaskService";
import { TaskUserWeight } from "@/types/task";

export function useChores() {
  const me = useHouseholdQuery(HouseholdQueries.me);
  const tasks = useHouseholdQuery(HouseholdQueries.tasks);

  const remove = useHouseholdMutation((h, token, taskId: number) => taskService.deleteTask(h, taskId, token));

  /** Point calculation changes with the weighting, so it reloads afterwards. */
  const weigh = useHouseholdMutation((h, token, { taskId, weight }: { taskId: number; weight: TaskUserWeight }) =>
    taskService.setUserWeight(h, taskId, weight, token)
  );

  return {
    // A child role cannot edit or delete tasks (the backend rejects it with 403).
    canManage: me.data !== null && me.data.household_user.role !== "child",
    tasks: tasks.data,
    isLoading: me.isLoading || tasks.isLoading,
    error: me.error ?? tasks.error,
    refetch: () => Promise.all([me.refetch(), tasks.refetch()]),
    busyTaskId: remove.pending ?? weigh.pending?.taskId ?? null,
    /** `true` if it succeeded (on an error HttpClient shows a toast). */
    deleteTask: async (taskId: number) => (await remove.run(taskId)) !== null,
    setWeight: async (taskId: number, weight: TaskUserWeight) => (await weigh.run({ taskId, weight })) !== null,
  };
}
