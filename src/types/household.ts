export const RESET_PERIODS = ["weekly", "monthly"] as const;
export type ResetPeriod = (typeof RESET_PERIODS)[number];

export interface HouseholdSettings {
  reset?: {
    period?: ResetPeriod;
    /** ISO nap: 1 = hétfő, 7 = vasárnap. */
    day_of_week?: number;
    /** A hónap napja (1–28). */
    day_of_month?: number;
  };
}

export interface Household {
  id: number;
  name: string;
  join_code: string;
  min_points: number;
  settings: HouseholdSettings | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CreateHouseholdDto {
  name: string;
}

export interface JoinHouseholdDto {
  code: string;
}

export interface RenameHouseholdDto {
  name: string;
}

export interface UpdateHouseholdSettingsDto {
  reset_period: ResetPeriod;
  reset_day_of_week?: number;
  reset_day_of_month?: number;
}

export interface HouseholdResponse {
  household: Household;
}

export interface HouseholdListResponse {
  households: Household[];
}

export interface IHouseholdStorage {
  getActiveHouseholdId(): Promise<number | null>;
  setActiveHouseholdId(id: number): Promise<void>;
}

export interface IHouseholdService {
  getAll(token: string): Promise<Household[]>;
  create(dto: CreateHouseholdDto, token: string): Promise<Household>;
  join(dto: JoinHouseholdDto, token: string): Promise<Household>;
  rename(
    householdId: number,
    dto: RenameHouseholdDto,
    token: string
  ): Promise<Household>;
  updateSettings(
    householdId: number,
    dto: UpdateHouseholdSettingsDto,
    token: string
  ): Promise<Household>;
  leave(householdId: number, token: string): Promise<void>;
  destroy(householdId: number, token: string): Promise<void>;
  getQrCode(householdId: number, token: string): Promise<string>;
}
