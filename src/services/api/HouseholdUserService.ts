import { Config } from "@/config/env";
import {
  HouseholdMember,
  HouseholdMemberListResponse,
  HouseholdUser,
  HouseholdUserListResponse,
  HouseholdUserResponse,
  IHouseholdUserService,
  UpdateHouseholdUserDto,
} from "@/types/household-user";
import { HttpClient } from "./HttpClient";

export class HouseholdUserService implements IHouseholdUserService {
  private readonly http: HttpClient;

  public constructor(http?: HttpClient) {
    this.http = http ?? new HttpClient(Config.BACKEND_URL);
  }

  public async getByHousehold(
    householdId: number,
    token: string
  ): Promise<HouseholdUser[]> {
    const response = await this.http.request<HouseholdUserListResponse>(
      `/households/${householdId}/users`,
      { method: "GET" },
      token
    );
    return response.household_users;
  }

  public async getMembers(householdId: number, token: string): Promise<HouseholdMember[]> {
    const response = await this.http.request<HouseholdMemberListResponse>(
      `/households/${householdId}/members`,
      { method: "GET" },
      token
    );
    return response.members;
  }

  public async update(
    householdUserId: number,
    dto: UpdateHouseholdUserDto,
    token: string
  ): Promise<HouseholdUser> {
    const response = await this.http.request<HouseholdUserResponse>(
      `/household-users/${householdUserId}`,
      { method: "PUT", body: JSON.stringify(dto) },
      token
    );
    return response.household_user;
  }

  public async remove(householdUserId: number, token: string): Promise<void> {
    await this.http.request<unknown>(
      `/household-users/${householdUserId}`,
      { method: "DELETE" },
      token
    );
  }
}

export const householdUserService = new HouseholdUserService();
