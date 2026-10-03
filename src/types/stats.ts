import { ResetPeriod } from "@/types/household";

import { HouseholdRole } from "./household-user";

export interface StatsMember {
  user_id: number;
  name: string;
  role: HouseholdRole;
  points: number;
  target: number;
  is_me: boolean;
}

export type PenaltyStatus = "pending" | "resolved";

export interface Penalty {
  /** `weekly-goal-{task_instance_user_id}`, `pending-{task_instance_user_id}` vagy `resolved-{point_transaction_id}`. */
  id: string;
  /** For a pending penalty the task instance (for requesting a swap / grace day); null for a completed one. */
  task_instance_id: number | null;
  user_id: number;
  user_name: string;
  task_name: string;
  status: PenaltyStatus;
  /** Due date (for pending). */
  due_at: string | null;
}

export interface ActivityEntry {
  id: number;
  user_id: number;
  user_name: string;
  is_me: boolean;
  task_name: string;
  category_icon: string | null;
  points: number;
  completed_at: string;
}

export interface HouseholdStats {
  cycle: {
    period: ResetPeriod;
    /** ISO week for a weekly cycle, the starting month's number for a monthly one. */
    number: number;
    starts_at: string;
    ends_at: string;
    /** The household's total points in the cycle. */
    total_points: number;
    /** The household's shared goal in the cycle. */
    target_points: number;
  };
  /** 0–100: how even the distribution among members is. */
  balance_percent: number;
  members: StatsMember[];
  penalties: Penalty[];
  activity: ActivityEntry[];
}

export interface ActivityPage {
  data: ActivityEntry[];
  /** Cursor of the next page; null if there are no more completions. */
  next_cursor: number | null;
}

export interface IStatsService {
  getStats(householdId: number, token: string): Promise<HouseholdStats>;
  getActivity(householdId: number, token: string, cursor: number | null, limit: number): Promise<ActivityPage>;
}
