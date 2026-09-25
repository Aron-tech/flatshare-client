import { HouseholdUser } from "./household-user";
import { Category, TaskDifficulty, TaskUserWeight } from "./task";

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
  /** A bejelentkezett user súlyozása; üres, ha még nem adta meg a nehézséget. */
  user_weights?: { weight: TaskUserWeight }[];
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
  /** A heti minimum elmulasztása miatt kiosztott büntető feladat: nem jár érte pont. */
  is_penalty?: boolean;
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
  /** A bejelentkezett user e heti minimum pontszáma (a hét közben hozzáadott feladatok arányosan számítanak). */
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

/** `POST /households/{h}/task-instances/{id}/complete` */
export interface TaskCompletionResponse {
  /** A teljesítésért jóváírt pont. */
  points: number;
  /** A felhasználó új pontállása a háztartásban. */
  points_balance: number;
}

export interface ITaskCompletionService {
  complete(
    householdId: number,
    taskInstanceId: number,
    token: string
  ): Promise<TaskCompletionResponse>;
}
