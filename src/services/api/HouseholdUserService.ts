import { Config } from "@/config/env";
import {
  AddHouseholdUserDto,
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
    return response.members;
  }

  public async getById(
    householdId: number,
    userId: number,
    token: string
  ): Promise<HouseholdUser> {
    const response = await this.http.request<HouseholdUserResponse>(
      `/households/${householdId}/users/${userId}`,
      { method: "GET" },
      token
    );
    return response.member;
  }

  public async addMember(
    householdId: number,
    dto: AddHouseholdUserDto,
    token: string
  ): Promise<HouseholdUser> {
    const response = await this.http.request<HouseholdUserResponse>(
      `/households/${householdId}/users`,
      {
        method: "POST",
        body: JSON.stringify(dto),
      },
      token
    );
    return response.member;
  }

  public async updateMember(
    householdId: number,
    userId: number,
    dto: UpdateHouseholdUserDto,
    token: string
  ): Promise<HouseholdUser> {
    const response = await this.http.request<HouseholdUserResponse>(
      `/households/${householdId}/users/${userId}`,
      {
        method: "PUT",
        body: JSON.stringify(dto),
      },
      token
    );
    return response.member;
  }

  public async removeMember(
    householdId: number,
    userId: number,
    token: string
  ): Promise<void> {
    await this.http.request<unknown>(
      `/households/${householdId}/users/${userId}`,
      { method: "DELETE" },
      token
    );
  }
}

export const householdUserService = new HouseholdUserService();
