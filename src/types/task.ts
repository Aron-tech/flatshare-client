import type { TaskCompletionResponse } from "@/types/dashboard";

export type RecurrenceUnit = "hour" | "day" | "week" | "month" | "year";

/** Backend `TaskAssignmentModeEnum` – ki a felelős az ismétlődő feladat példányaiért. */
export type TaskAssignmentMode = "none" | "fixed" | "rotating";

export const TASK_ASSIGNMENT_MODES: TaskAssignmentMode[] = ["none", "fixed", "rotating"];

export type TaskDifficulty = "easy" | "medium" | "hard" | string;

export const TASK_DIFFICULTIES = ["easy", "medium", "hard"] as const;

export const RECURRENCE_UNITS: RecurrenceUnit[] = ["hour", "day", "week", "month", "year"];

/** Backend `TaskUserWeightEnum` – mennyire szereti a user a feladatot (pontszorzó). */
export type TaskUserWeight = "hate" | "dislike" | "neutral" | "like" | "love";

export const TASK_USER_WEIGHTS: TaskUserWeight[] = ["hate", "dislike", "neutral", "like", "love"];

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
  assignment_mode: TaskAssignmentMode;
  fixed_user_id: number | null;
  /** A rotáció tagjai sorrendben (csak rotáló feladatnál nem üres). */
  rotations?: { user_id: number; rotation_order: number }[];
  /** A bejelentkezett user súlyozása (üres, ha még nem adta meg). */
  user_weights?: { weight: TaskUserWeight }[];
}

/** `GET /households/{h}/tasks` – kategórianév szerint csoportosítva. */
export interface HouseholdTaskListResponse {
  tasks: Record<string, HouseholdTask[]>;
}

/** Globális feladatsablon (`task_templates`) – a `name`/`description` a kérés nyelvén jön. */
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

/** `GET /task-templates` – kategórianév szerint csoportosítva. */
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
  /** Üres vagy hiányzó lista rotációnál az összes tagot jelenti. */
  rotation_user_ids: number[] | null;
}

/** Egyedi feladat alapmezői (ismétlődés nélkül). */
export interface CustomTaskFieldsDto {
  name: string;
  description: string | null;
  category_id: number | null;
  duration_minutes: number;
  difficulty: TaskDifficulty;
  /** A sablon, amiből az egyedi feladat adatai származnak (nem kötelező). */
  task_template_id: number | null;
  icon: string | null;
  max_user: number;
}

/** `POST /households/{h}/tasks` */
export interface CreateTaskDto extends CustomTaskFieldsDto, TaskRecurrenceDto, Partial<TaskAssignmentDto> {}

/** `PUT /households/{h}/tasks/{task}` */
export type UpdateTaskDto = Omit<CreateTaskDto, "task_template_id">;

/** `POST /households/{h}/tasks/{task_template}` – a sablon értékeit felülírja. */
export interface CreateTaskFromTemplateDto extends TaskRecurrenceDto {
  max_user: number | null;
}

/** Nem ismétlődő háztartási feladat, amit bármelyik tag elvégzettként rögzíthet. */
export interface OneOffHouseholdTask extends HouseholdTask {
  /** A user pontja a feladatért (súly nélkül a semleges súllyal számolva). */
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
  /** Bármelyik tag hívhatja; a user saját súlyozásával. */
  getHouseholdTasks(householdId: number, token: string): Promise<HouseholdTask[]>;
  createTask(householdId: number, dto: CreateTaskDto, token: string): Promise<void>;
  /** Gyerek szerepkör nem szerkeszthet (403). */
  updateTask(householdId: number, taskId: number, dto: UpdateTaskDto, token: string): Promise<void>;
  createTaskFromTemplate(
    householdId: number,
    templateId: number,
    dto: CreateTaskFromTemplateDto,
    token: string
  ): Promise<void>;
  /** Bármelyik tag hívhatja. */
  getOneOffTasks(householdId: number, token: string): Promise<OneOffHouseholdTask[]>;
  /** Új, senki által el nem vállalt task instance-t nyit a nem ismétlődő feladatból. */
  openTask(householdId: number, taskId: number, token: string): Promise<void>;
  /** Új, befejezett task instance-t hoz létre a nem ismétlődő feladatból. */
  logTask(householdId: number, taskId: number, token: string): Promise<TaskCompletionResponse>;
  /** Nem ismétlődő egyedi feladatot vesz fel, és egyből befejezettként rögzíti. */
  logNewTask(householdId: number, dto: CustomTaskFieldsDto, token: string): Promise<TaskCompletionResponse>;
  /** Nem ismétlődő feladatot vesz fel sablonból, és egyből befejezettként rögzíti. */
  logTaskFromTemplate(
    householdId: number,
    templateId: number,
    dto: LogTaskFromTemplateDto,
    token: string
  ): Promise<TaskCompletionResponse>;
  /** Gyerek szerepkör nem törölhet (403). */
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
