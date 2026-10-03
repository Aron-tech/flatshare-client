import type { PetId } from "@/lib/house/scene.generated";

export type HouseMoodBand = "happy" | "content" | "grumpy" | "sad";

export interface HouseMood {
  /** 0–100, a backend számolja (rendetlenség, függő büntetések, tempó). */
  score: number;
  band: HouseMoodBand;
  behind_pace: boolean;
  pending_penalties: number;
}

/** Egy feladat-kategória nyitott példányai; `category_id = null` a kategória nélküli feladatok. */
export interface HouseZoneState {
  category_id: number | null;
  category_icon: string | null;
  category_name: string | null;
  open: number;
  due_today: number;
  overdue: number;
  /** 0 = rendben, 1 = ma esedékes, 2 = egy lejárt, 3 = több lejárt vagy régóta lejárt. */
  mess_level: number;
}

export interface HouseMember {
  user_id: number;
  name: string;
  role: string;
  /** A választott, vagy (ha nincs) az alapértelmezett állat. */
  character: PetId;
  is_me: boolean;
}

export interface HouseCompletion {
  /** A pont-tranzakció azonosítója (növekvő), ezzel jegyzi meg a kliens a már lejátszottakat. */
  id: number;
  user_id: number;
  category_icon: string | null;
  completed_at: string;
}

export interface HouseState {
  mood: HouseMood;
  zones: HouseZoneState[];
  members: HouseMember[];
  recent_completions: HouseCompletion[];
}

export interface IHouseService {
  getState(householdId: number, token: string): Promise<HouseState>;
}
