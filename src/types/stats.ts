import { HouseholdRole } from "./household-user";

export interface StatsMember {
  user_id: number;
  first_name: string;
  last_name: string;
  role: HouseholdRole;
  points: number;
  target: number;
  is_me: boolean;
}

export type PenaltyStatus = "pending" | "resolved";

export interface Penalty {
  id: number;
  user_id: number;
  user_name: string;
  task_name: string;
  status: PenaltyStatus;
  /** Esedékesség (pending esetén). */
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
    number: number;
    starts_at: string;
    ends_at: string;
    /** A háztartás összes pontja a ciklusban. */
    total_points: number;
    /** A háztartás közös célja a ciklusban. */
    target_points: number;
  };
  /** 0–100: mennyire egyenletes a tagok közötti eloszlás. */
  balance_percent: number;
  members: StatsMember[];
  penalties: Penalty[];
  activity: ActivityEntry[];
}

export interface IStatsService {
  getStats(householdId: number, token: string): Promise<HouseholdStats>;
}
