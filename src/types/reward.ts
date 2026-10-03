import { User } from "./auth";

export type RewardDifficultyLevel = "easy" | "medium" | "hard" | "very_hard";

/** How hard it is to collect the point price based on the household's tasks and weightings. */
export interface RewardDifficulty {
  points_cost: number;
  /** `null` if the household has no tasks yet. */
  difficulty: RewardDifficultyLevel | null;
  difficulty_label: string | null;
  weekly_points_per_member: number;
  average_task_points: number | null;
  weeks_needed: number | null;
  tasks_needed: number | null;
}

export interface Reward {
  id: number;
  household_id: number;
  /** The user who uploaded the reward; only they can edit it, and they cannot redeem it. */
  user_id: number;
  name: string;
  description: string | null;
  points_cost: number;
  stock_quantity: number | null;
  is_active: boolean;
  /** The uploader is editing it right now, it cannot be redeemed meanwhile. */
  is_editing: boolean;
  user?: User;
  difficulty?: RewardDifficulty;
}

export interface RewardDto {
  name: string;
  description: string | null;
  points_cost: number;
  stock_quantity: number | null;
  is_active: boolean;
}

export interface RewardListResponse {
  rewards: Reward[];
}

/** `POST /households/{h}/rewards`, `PUT /households/{h}/rewards/{id}` */
export interface RewardResponse {
  reward: Reward;
  difficulty?: RewardDifficulty;
}

/** `POST /households/{h}/rewards/{id}/redeem` */
export interface RedeemRewardResponse {
  points_balance: number;
}

/** A redemption, until the reward's uploader (or the redeemer) marks it fulfilled. */
export interface RewardRedemption {
  id: number;
  household_id: number;
  reward_id: number | null;
  /** The redeeming user. */
  user_id: number;
  points_spent: number;
  fulfilled_at: string | null;
  /** When the uploader leaves, the unfulfilled redemption is refunded. */
  refunded_at: string | null;
  created_at: string;
  reward: Reward | null;
  user?: User;
}

/** `GET /households/{h}/reward-redemptions` */
export interface RewardRedemptionListResponse {
  /** Redemptions of my rewards that I have to fulfil. */
  to_fulfill: RewardRedemption[];
  /** Rewards I redeemed that are not fulfilled yet. */
  waiting: RewardRedemption[];
}
