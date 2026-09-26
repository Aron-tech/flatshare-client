import { User } from "./auth";

export type RewardDifficultyLevel = "easy" | "medium" | "hard" | "very_hard";

/** Mennyire nehéz a pontárat összegyűjteni a háztartás feladatai és súlyozásai alapján. */
export interface RewardDifficulty {
  points_cost: number;
  /** `null`, ha a háztartásnak még nincs feladata. */
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
  /** A jutalmat feltöltő user; csak ő szerkesztheti, és ő nem válthatja be. */
  user_id: number;
  name: string;
  description: string | null;
  points_cost: number;
  stock_quantity: number | null;
  is_active: boolean;
  /** A feltöltő éppen szerkeszti, ezalatt nem váltható be. */
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

/** Egy beváltás, amíg a jutalom feltöltője (vagy a beváltó) teljesítettnek nem jelöli. */
export interface RewardRedemption {
  id: number;
  household_id: number;
  reward_id: number | null;
  /** A beváltó user. */
  user_id: number;
  points_spent: number;
  fulfilled_at: string | null;
  /** A feltöltő távozásakor a nem teljesített beváltás visszatérítődik. */
  refunded_at: string | null;
  created_at: string;
  reward: Reward | null;
  user?: User;
}

/** `GET /households/{h}/reward-redemptions` */
export interface RewardRedemptionListResponse {
  /** A saját jutalmaim beváltásai, amelyeket nekem kell teljesítenem. */
  to_fulfill: RewardRedemption[];
  /** Az általam beváltott, még nem teljesített jutalmak. */
  waiting: RewardRedemption[];
}
