import { HouseholdUser } from "./household-user";
import { Category, TaskDifficulty } from "./task";

export interface TaskInstanceTask {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  difficulty: TaskDifficulty;
  max_user: number;
  icon?: string | null;
  /** Csak akkor van, ha a backend betölti a `task.category` relációt. */
  category?: Category | null;
}

export interface TaskInstance {
  id: number;
  task_id: number;
  household_id: number;
  status: string;
  due_at: string | null;
  completed_at: string | null;
  /** A bejelentkezett felhasználóra számolt pont; null, ha nincs súlyozás. */
  points: number | null;
  task: TaskInstanceTask;
}

export interface TaskInstanceListResponse {
  available: TaskInstance[];
  claimed: TaskInstance[];
}

export interface MyHouseholdPointsResponse {
  household_user: Pick<
    HouseholdUser,
    "id" | "household_id" | "user_id" | "points_balance" | "role"
  >;
  /** Heti elérendő pont / fő. */
  min_points: number;
}

export interface IDashboardService {
  getMyPoints(
    householdId: number,
    token: string
  ): Promise<MyHouseholdPointsResponse>;
  getTaskInstances(
    householdId: number,
    token: string
  ): Promise<TaskInstanceListResponse>;
  claimTaskInstance(
    householdId: number,
    taskInstanceId: number,
    token: string
  ): Promise<void>;
}

/** Feladat teljesítése – a backenden még nincs végpont (lásd MockTaskCompletionService). */
export interface ITaskCompletionService {
  complete(
    householdId: number,
    taskInstanceId: number,
    token: string
  ): Promise<void>;
}
