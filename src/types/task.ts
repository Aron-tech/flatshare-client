export type RecurrenceUnit = "hour" | "day" | "week" | "month" | "year";

export type TaskDifficulty = "easy" | "medium" | "hard" | string;

/** Backend `categories` – a `name` a kérés nyelvén jön (spatie/translatable). */
export interface Category {
  id: number;
  name: string;
  icon: string;
  /** Hex szín, pl. `#D87758`. */
  color: string;
  sort_order: number;
}

/** A háztartás feladat-definíciója (`tasks` tábla). */
export interface HouseholdTask {
  id: number;
  task_template_id: number | null;
  household_id: number;
  name: string;
  description: string | null;
  category_id: number | null;
  category: Category | null;
  icon: string | null;
  duration_minutes: number;
  difficulty: TaskDifficulty;
  base_points: number;
  is_recurring: boolean;
  recurrence_interval: number | null;
  recurrence_unit: RecurrenceUnit | null;
  max_user: number;
}

/** `GET /households/{h}/tasks` – kategórianév szerint csoportosítva. */
export interface HouseholdTaskListResponse {
  tasks: Record<string, HouseholdTask[]>;
}

export interface ITaskService {
  /** Csak admin hívhatja (403 egyébként). */
  getHouseholdTasks(householdId: number, token: string): Promise<HouseholdTask[]>;
}
