export interface Household {
  id: number;
  name: string;
  join_code: string;
  min_points: number;
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

export interface HouseholdResponse {
  household: Household;
}

export interface HouseholdListResponse {
  households: Household[];
}

export interface IHouseholdStorage {
  getActiveHouseholdId(): Promise<number | null>;
  setActiveHouseholdId(id: number): Promise<void>;
  clearActiveHouseholdId(): Promise<void>;
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
  leave(householdId: number, token: string): Promise<void>;
  destroy(householdId: number, token: string): Promise<void>;
  getQrCode(householdId: number, token: string): Promise<string>;
}
