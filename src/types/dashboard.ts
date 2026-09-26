import { HouseholdUser } from "./household-user";
import { Category, TaskDifficulty, TaskUserWeight } from "./task";

export interface TaskInstanceTask {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  difficulty: TaskDifficulty;
  max_user: number;
  icon?: string | null;
  /** Csak akkor van, ha a backend betölti a `task.category` relációt. */
  category?: Category | null;
  /** A bejelentkezett user súlyozása; üres, ha még nem adta meg a nehézséget. */
  user_weights?: { weight: TaskUserWeight }[];
}

export interface TaskInstance {
  id: number;
  task_id: number;
  household_id: number;
  status: string;
  due_at: string | null;
  completed_at: string | null;
  /** A bejelentkezett felhasználó része a pontból (a vállalók között megosztva); null, ha nincs súlyozás. */
  points: number | null;
  /** Ennyien osztoznak a ponton (a bejelentkezett user is, ha még nem vállalta). */
  claimers?: number;
  /** A heti minimum elmulasztása miatt kiosztott büntető feladat: csak a hiányt fedező részen felüli pont jár érte (ez a `points`). */
  is_penalty?: boolean;
  /** Vállalt feladatnál: a saját nyitott átadási ajánlat. */
  my_offer?: MyTaskOffer | null;
  /** Vállalt feladatnál: az ajánlat minimuma (büntetésnél a lefedett hiány, különben 0). */
  min_offer_points?: number;
  /** Vállalt feladatnál: mikor kért rá türelmi napot (egyszer kérhető). */
  grace_granted_at?: string | null;
  /** Vállalt feladatnál: ajánlatból átvett feladatért a teljesítéskor járó jutalom. */
  offer_points?: number;
  /** Az `offered` listában: a másik tag ajánlata, amit átvehetsz. */
  offer?: IncomingTaskOffer;
  task: TaskInstanceTask;
}

export interface MyTaskOffer {
  id: number;
  points: number;
  /** null: bárki átveheti. */
  target_user_id: number | null;
  target_name: string | null;
}

export interface IncomingTaskOffer {
  id: number;
  /** A teljesítéskor a feladat pontján felül járó jutalom. */
  points: number;
  offered_by: number;
  offered_by_name: string;
  is_penalty: boolean;
  /** Csak neked szól. */
  is_targeted: boolean;
}

export interface TaskInstanceListResponse {
  available: TaskInstance[];
  claimed: TaskInstance[];
  /** Mások ajánlatai, amelyeket a határidőig átvehetsz. */
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
  /** A bejelentkezett user e heti minimum pontszáma (a hét közben hozzáadott feladatok arányosan számítanak). */
  min_points: number;
  /** Az e heti feladatokért kapott pont, ezt mérjük a heti minimumhoz. */
  weekly_points: number;
  /** Jutalomra költhető pont: a még le nem zárt hét minimumát fedező pontok nélkül (azokat a hét zárása levonja). */
  spendable_points: number;
  /** Az aktuális ciklusban még felhasználható türelmi napok. */
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
  /** A teljesítésért jóváírt pont. */
  points: number;
  /** Ajánlatból átvett feladatnál a kifizetett jutalom (a `points`-on felül). */
  offer_points: number;
  /** A felhasználó új pontállása a háztartásban. */
  points_balance: number;
  /** A felhasználó e heti pontja a teljesítés után. */
  weekly_points: number;
  /** Jutalomra költhető pont a teljesítés után. */
  spendable_points: number;
}

export interface ITaskCompletionService {
  complete(
    householdId: number,
    taskInstanceId: number,
    token: string
  ): Promise<TaskCompletionResponse>;
}
