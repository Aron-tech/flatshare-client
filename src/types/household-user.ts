import { User } from "./auth";
import { MemberDeparture } from "./member-departure";

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

/** `GET /households/{h}/users` – admins only. */
export interface HouseholdUserListResponse {
  household_users: HouseholdUser[];
}

/** A member of the household, for choosing an assignee. */
export interface HouseholdMember {
  user_id: number;
  name: string;
}

/** `GET /households/{h}/members` – any member can fetch it. */
export interface HouseholdMemberListResponse {
  members: HouseholdMember[];
}

export interface IHouseholdUserService {
  getMembers(householdId: number, token: string): Promise<HouseholdMember[]>;
  getByHousehold(householdId: number, token: string): Promise<HouseholdUser[]>;
  /** Anyone can change themselves, others only an admin. */
  update(
    householdUserId: number,
    dto: UpdateHouseholdUserDto,
    token: string
  ): Promise<HouseholdUser>;
  remove(householdUserId: number, token: string): Promise<void>;
  /** Departed members whose tasks need a decision – admins only. */
  getDepartures(householdId: number, token: string): Promise<MemberDeparture[]>;
  /** Deletes the selected tasks (empty list: all stay), and closes the decision. */
  resolveDeparture(householdId: number, departureId: number, taskIds: number[], token: string): Promise<number>;
}
