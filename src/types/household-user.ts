import { User } from "./auth";

export type HouseholdRole = "admin" | "user" | "child" | string;

export interface HouseholdUser {
  id: number;
  household_id: number;
  user_id: number;
  role: HouseholdRole;
  points_balance: number;
  created_at?: string;
  updated_at?: string;

  user: User;
}

export interface AddHouseholdUserDto {
  user_id: number;
  role: HouseholdRole;
}

export interface UpdateHouseholdUserDto {
  role?: HouseholdRole;
  points_balance?: number;
}

export interface HouseholdUserResponse {
  member: HouseholdUser;
}

export interface HouseholdUserListResponse {
  members: HouseholdUser[];
}

export interface IHouseholdUserService {
  getByHousehold(householdId: number, token: string): Promise<HouseholdUser[]>;
  getById(
    householdId: number,
    userId: number,
    token: string
  ): Promise<HouseholdUser>;
  addMember(
    householdId: number,
    dto: AddHouseholdUserDto,
    token: string
  ): Promise<HouseholdUser>;
  updateMember(
    householdId: number,
    userId: number,
    dto: UpdateHouseholdUserDto,
    token: string
  ): Promise<HouseholdUser>;
  removeMember(
    householdId: number,
    userId: number,
    token: string
  ): Promise<void>;
}
