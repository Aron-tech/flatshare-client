import type { HouseZone, PetId, RoomKey } from "@/lib/house/scene.generated";

export type HouseMoodBand = "happy" | "content" | "grumpy" | "sad";

export interface HouseMood {
  /** 0–100, computed by the backend (mess, pending penalties, pace). */
  score: number;
  band: HouseMoodBand;
  behind_pace: boolean;
  pending_penalties: number;
}

/** Open instances of a task category; `category_id = null` is the tasks without a category. */
export interface HouseZoneState {
  category_id: number | null;
  category_icon: string | null;
  category_name: string | null;
  open: number;
  due_today: number;
  overdue: number;
  /** 0 = fine, 1 = due today, 2 = one overdue, 3 = several overdue or overdue for long. */
  mess_level: number;
}

export interface HouseMember {
  user_id: number;
  name: string;
  role: string;
  /** The chosen pet, or (if none) the default one. */
  character: PetId;
  is_me: boolean;
}

export interface HouseCompletion {
  /** The point transaction's id (increasing), which the client uses to remember the already played ones. */
  id: number;
  user_id: number;
  category_icon: string | null;
  completed_at: string;
}

/** A room buildable from points: members collect for it together, it is built when the price is reached. */
export interface HouseRoomState {
  key: Exclude<RoomKey, "main">;
  price: number;
  collected: number;
  unlocked: boolean;
  /** The zones that move into this room after unlocking. */
  zones: HouseZone[];
  /** Who put in how much (the biggest giver first). */
  contributors: { user_id: number; amount: number }[];
}

export interface HouseState {
  mood: HouseMood;
  zones: HouseZoneState[];
  members: HouseMember[];
  recent_completions: HouseCompletion[];
  rooms: HouseRoomState[];
}

/** `POST /households/{h}/house/rooms/{room}/contribute` */
export interface ContributeToRoomResponse {
  points_balance: number;
  room: HouseRoomState;
  message: string;
}

export interface IHouseService {
  getState(householdId: number, token: string): Promise<HouseState>;
  contributeToRoom(householdId: number, room: HouseRoomState["key"], amount: number, token: string): Promise<ContributeToRoomResponse>;
}
