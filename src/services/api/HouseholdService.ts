import i18n from "@/i18n";
import { Config } from "@/config/env";
import {
  CreateHouseholdDto,
  Household,
  HouseholdListResponse,
  HouseholdResponse,
  IHouseholdService,
  JoinHouseholdDto,
  RenameHouseholdDto,
} from "@/types/household";
import { HttpClient } from "./HttpClient";

export class HouseholdService implements IHouseholdService {
  private readonly http: HttpClient;

  public constructor(http?: HttpClient) {
    this.http = http ?? new HttpClient(Config.BACKEND_URL);
  }

  public async getAll(token: string): Promise<Household[]> {
    const response = await this.http.request<HouseholdListResponse>(
      "/households",
      { method: "GET" },
      token
    );
    return response.households;
  }

  public async create(
    dto: CreateHouseholdDto,
    token: string
  ): Promise<Household> {
    const response = await this.http.request<HouseholdResponse>(
      "/households",
      {
        method: "POST",
        body: JSON.stringify(dto),
      },
      token
    );
    return response.household;
  }

  public async join(dto: JoinHouseholdDto, token: string): Promise<Household> {
    const sanitizedCode = dto.code.trim();
    if (!/^\d{10}$/.test(sanitizedCode)) {
      throw new Error(
        i18n.t("errors.invalidCode")
      );
    }

    const response = await this.http.request<HouseholdResponse>(
      "/households/join",
      {
        method: "POST",
        body: JSON.stringify({ code: sanitizedCode }),
      },
      token
    );
    return response.household;
  }

  public async rename(
    householdId: number,
    dto: RenameHouseholdDto,
    token: string
  ): Promise<Household> {
    const response = await this.http.request<HouseholdResponse>(
      `/households/${householdId}`,
      {
        method: "PUT",
        body: JSON.stringify(dto),
      },
      token
    );
    return response.household;
  }

  public async leave(householdId: number, token: string): Promise<void> {
    await this.http.request<unknown>(
      `/households/leave/${householdId}`,
      { method: "DELETE" },
      token
    );
  }

  public async destroy(householdId: number, token: string): Promise<void> {
    await this.http.request<unknown>(
      `/households/${householdId}`,
      { method: "DELETE" },
      token
    );
  }

  public async getQrCode(householdId: number, token: string): Promise<string> {
    const response = await fetch(
      `${Config.BACKEND_URL}/households/${householdId}/qrcode`,
      {
        headers: {
          Accept: "image/svg+xml",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(i18n.t("errors.qrLoadFailed"));
    }

    return response.text();
  }
}

export const householdService = new HouseholdService();
