import { HouseholdUser } from "./household-user";
import { Category, TaskDifficulty, TaskUserWeight } from "./task";
import type { UnlockedSticker } from "./sticker-album";

export interface TaskInstanceTask {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  difficulty: TaskDifficulty;
  max_user: number;
  icon?: string | null;
  /** Only present if the backend loads the `task.category` relation. */
  category?: Category | null;
  /** The signed-in user's weighting; empty if they have not given a difficulty yet. */
  user_weights?: { weight: TaskUserWeight }[];
}

export interface TaskInstance {
  id: number;
  task_id: number;
  household_id: number;
  status: string;
  due_at: string | null;
  completed_at: string | null;
  /** The signed-in user's share of the points (split among the claimers); null if there is no weighting. */
  points: number | null;
  /** This many share the points (the signed-in user too, if they have not claimed it yet). */
  claimers?: number;
  /** A penalty task assigned for missing the weekly minimum: only the points above the part covering the shortfall are awarded (this is `points`). */
  is_penalty?: boolean;
  /** For a claimed task: the own open hand-over offer. */
  my_offer?: MyTaskOffer | null;
  /** For a claimed task: the offer's minimum (the covered shortfall for a penalty, otherwise 0). */
  min_offer_points?: number;
  /** For a claimed task: when a grace day was requested for it (it can be requested once). */
  grace_granted_at?: string | null;
  /** For a claimed task: the reward due on completion for a task taken over from an offer. */
  offer_points?: number;
  /** In the `offered` list: another member's offer you can take over. */
  offer?: IncomingTaskOffer;
  task: TaskInstanceTask;
}

export interface MyTaskOffer {
  id: number;
  points: number;
  /** null: anyone can take it over. */
  target_user_id: number | null;
  target_name: string | null;
}

export interface IncomingTaskOffer {
  id: number;
  /** The reward due on completion on top of the task's points. */
  points: number;
  offered_by: number;
  offered_by_name: string;
  is_penalty: boolean;
  /** Only for you. */
  is_targeted: boolean;
}

export interface TaskInstanceListResponse {
  available: TaskInstance[];
  claimed: TaskInstance[];
  /** Others' offers you can take over until the deadline. */
  offered: TaskInstance[];
}

/** `POST /households/{h}/task-instances/{ti}/offers` */
export interface CreateTaskOfferDto {
  points: number;
  target_user_id?: number | null;
}

export interface TaskOfferResponse {
  spendable_points: number;
}

/** `POST /households/{h}/task-instances/{ti}/grace-day` */
export interface GraceDayResponse {
  due_at: string;
  grace_days_left: number;
}

export interface MyHouseholdPointsResponse {
  household_user: Pick<
    HouseholdUser,
    "id" | "household_id" | "user_id" | "points_balance" | "role"
  >;
  /** The signed-in user's minimum points for this week (tasks added mid-week count proportionally). */
  min_points: number;
  /** Points earned for this week's tasks, measured against the weekly minimum. */
  weekly_points: number;
  /** Points spendable on rewards: without the points covering the minimum of the not yet closed week (the week's closing deducts them). */
  spendable_points: number;
  /** Grace days still usable in the current cycle. */
  grace_days_left: number;
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
  requestGraceDay(householdId: number, taskInstanceId: number, token: string): Promise<GraceDayResponse>;
  createOffer(householdId: number, taskInstanceId: number, dto: CreateTaskOfferDto, token: string): Promise<TaskOfferResponse>;
  cancelOffer(householdId: number, offerId: number, token: string): Promise<TaskOfferResponse>;
  acceptOffer(householdId: number, offerId: number, token: string): Promise<void>;
}

/** `POST /households/{h}/task-instances/{id}/complete` */
export interface TaskCompletionResponse {
  points: number;
  /** The reward paid for a task taken over from an offer (on top of `points`). */
  offer_points: number;
  /** The user's new point balance in the household. */
  points_balance: number;
  /** The user's points for this week after the completion. */
  weekly_points: number;
  /** Spendable points after the completion. */
  spendable_points: number;
  /** The sticker of the milestone reached with the completion (10 / 25 / 50 / 100 completions), otherwise `null`. */
  new_sticker: UnlockedSticker | null;
}

export interface ITaskCompletionService {
  complete(
    householdId: number,
    taskInstanceId: number,
    token: string
  ): Promise<TaskCompletionResponse>;
}
