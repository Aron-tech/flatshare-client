import type { TaskCompletionResponse } from "@/types/dashboard";

export type RecurrenceUnit = "hour" | "day" | "week" | "month" | "year";

/** Backend `TaskAssignmentModeEnum` – who is responsible for a recurring task's instances. */
export type TaskAssignmentMode = "none" | "fixed" | "rotating";

export const TASK_ASSIGNMENT_MODES: TaskAssignmentMode[] = ["none", "fixed", "rotating"];

export type TaskDifficulty = "easy" | "medium" | "hard" | string;

export const TASK_DIFFICULTIES = ["easy", "medium", "hard"] as const;

export const RECURRENCE_UNITS: RecurrenceUnit[] = ["hour", "day", "week", "month", "year"];

/** Backend `TaskUserWeightEnum` – how much the user likes the task (point multiplier). */
export type TaskUserWeight = "hate" | "dislike" | "neutral" | "like" | "love";

export const TASK_USER_WEIGHTS: TaskUserWeight[] = ["hate", "dislike", "neutral", "like", "love"];

/** Backend `categories` – `name` comes in the request's language (spatie/translatable). */
export interface Category {
  id: number;
  name: string;
  icon: string;
  /** Hex color, e.g. `#D87758`. */
  color: string;
  sort_order: number;
}

/** The household's task definition (`tasks` table). */
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
  assignment_mode: TaskAssignmentMode;
  fixed_user_id: number | null;
  /** The rotation's members in order (only non-empty for a rotating task). */
  rotations?: { user_id: number; rotation_order: number }[];
  /** The signed-in user's weighting (empty if not given yet). */
  user_weights?: { weight: TaskUserWeight }[];
  /** The household's shared price for the task per claimer (with the average of the members' weights). */
  points?: number;
}

/** `GET /households/{h}/tasks` – grouped by category name. */
export interface HouseholdTaskListResponse {
  tasks: Record<string, HouseholdTask[]>;
}

/** Global task template (`task_templates`) – `name`/`description` come in the request's language. */
export interface TaskTemplate {
  id: number;
  name: string;
  description: string | null;
  category_id: number | null;
  category: Category | null;
  icon: string | null;
  duration_minutes: number;
  difficulty: TaskDifficulty;
  base_points: number;
  max_user: number;
}

/** `GET /task-templates` – grouped by category name. */
export interface TaskTemplateListResponse {
  task_templates: Record<string, TaskTemplate[]>;
}

export interface TaskRecurrenceDto {
  is_recurring: boolean;
  recurrence_interval: number | null;
  recurrence_unit: RecurrenceUnit | null;
}

export interface TaskAssignmentDto {
  assignment_mode: TaskAssignmentMode;
  fixed_user_id: number | null;
  /** An empty or missing list means all members for a rotation. */
  rotation_user_ids: number[] | null;
}

/** Basic fields of a custom task (without recurrence). */
export interface CustomTaskFieldsDto {
  name: string;
  description: string | null;
  category_id: number | null;
  duration_minutes: number;
  difficulty: TaskDifficulty;
  /** The template the custom task's data comes from (optional). */
  task_template_id: number | null;
  icon: string | null;
  max_user: number;
}

/** `POST /households/{h}/tasks` */
export interface CreateTaskDto extends CustomTaskFieldsDto, TaskRecurrenceDto, Partial<TaskAssignmentDto> {}

/** `PUT /households/{h}/tasks/{task}` */
export type UpdateTaskDto = Omit<CreateTaskDto, "task_template_id">;

/** `POST /households/{h}/tasks/{task_template}` – overrides the template's values. */
export interface CreateTaskFromTemplateDto extends TaskRecurrenceDto {
  max_user: number | null;
}

/** A non-recurring household task that any member can log as done. */
export interface OneOffHouseholdTask extends HouseholdTask {
  /** The user's points for the task (without a weighting, computed with the neutral weight). */
  points: number;
}

/** `GET /households/{h}/tasks/one-off` */
export interface OneOffHouseholdTaskListResponse {
  tasks: OneOffHouseholdTask[];
}

/** `POST /households/{h}/tasks/templates/{task_template}/log` */
export interface LogTaskFromTemplateDto {
  max_user: number | null;
}

export interface ITaskService {
  /** Any member can call it; with the user's own weighting. */
  getHouseholdTasks(householdId: number, token: string): Promise<HouseholdTask[]>;
  createTask(householdId: number, dto: CreateTaskDto, token: string): Promise<void>;
  /** A child role cannot edit (403). */
  updateTask(householdId: number, taskId: number, dto: UpdateTaskDto, token: string): Promise<void>;
  createTaskFromTemplate(
    householdId: number,
    templateId: number,
    dto: CreateTaskFromTemplateDto,
    token: string
  ): Promise<void>;
  getOneOffTasks(householdId: number, token: string): Promise<OneOffHouseholdTask[]>;
  /** Opens a new task instance nobody has claimed from the non-recurring task. */
  openTask(householdId: number, taskId: number, token: string): Promise<void>;
  /** Creates a new completed task instance from the non-recurring task. */
  logTask(householdId: number, taskId: number, token: string): Promise<TaskCompletionResponse>;
  /** Adds a non-recurring custom task and logs it as completed right away. */
  logNewTask(householdId: number, dto: CustomTaskFieldsDto, token: string): Promise<TaskCompletionResponse>;
  /** Adds a non-recurring task from a template and logs it as completed right away. */
  logTaskFromTemplate(
    householdId: number,
    templateId: number,
    dto: LogTaskFromTemplateDto,
    token: string
  ): Promise<TaskCompletionResponse>;
  /** A child role cannot delete (403). */
  deleteTask(householdId: number, taskId: number, token: string): Promise<void>;
  setUserWeight(
    householdId: number,
    taskId: number,
    weight: TaskUserWeight,
    token: string
  ): Promise<void>;
}

export interface ITaskTemplateService {
  getAll(token: string): Promise<TaskTemplate[]>;
}
