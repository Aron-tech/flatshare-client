import type { HouseZone, PetId, RoomKey } from "@/lib/house/scene.generated";

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

/** Egy pontokból építhető szoba: a tagok közösen gyűjtenek rá, az ár elérésekor elkészül. */
export interface HouseRoomState {
  key: Exclude<RoomKey, "main">;
  price: number;
  collected: number;
  unlocked: boolean;
  /** A zónák, amelyek a feloldás után ebbe a szobába költöznek. */
  zones: HouseZone[];
  /** Ki mennyit tett bele (a legtöbbet adó elöl). */
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
