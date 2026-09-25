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

export interface UpdateHouseholdUserDto {
  role: HouseholdRole;
}

/** `PUT /household-users/{id}` */
export interface HouseholdUserResponse {
  household_user: HouseholdUser;
}

/** `GET /households/{h}/users` – csak admin kérheti le. */
export interface HouseholdUserListResponse {
  household_users: HouseholdUser[];
}

/** A háztartás egy tagja felelősnek választáshoz. */
export interface HouseholdMember {
  user_id: number;
  name: string;
}

/** `GET /households/{h}/members` – bármelyik tag lekérheti. */
export interface HouseholdMemberListResponse {
  members: HouseholdMember[];
}

export interface IHouseholdUserService {
  getMembers(householdId: number, token: string): Promise<HouseholdMember[]>;
  getByHousehold(householdId: number, token: string): Promise<HouseholdUser[]>;
  /** Saját magát bárki, mást csak admin módosíthat. */
  update(
    householdUserId: number,
    dto: UpdateHouseholdUserDto,
    token: string
  ): Promise<HouseholdUser>;
  remove(householdUserId: number, token: string): Promise<void>;
}
