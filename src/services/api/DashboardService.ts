import { Config } from "@/config/env";
import {
  CreateTaskOfferDto,
  GraceDayResponse,
  IDashboardService,
  MyHouseholdPointsResponse,
  TaskInstanceListResponse,
  TaskOfferResponse,
} from "@/types/dashboard";
import { HttpClient } from "./HttpClient";

export class DashboardService implements IDashboardService {
  private readonly http: HttpClient;

  public constructor(http?: HttpClient) {
    this.http = http ?? new HttpClient(Config.BACKEND_URL);
  }

  public getMyPoints(
    householdId: number,
    token: string
  ): Promise<MyHouseholdPointsResponse> {
    return this.http.request<MyHouseholdPointsResponse>(
      `/households/${householdId}/me`,
      { method: "GET" },
      token
    );
  }

  public getTaskInstances(
    householdId: number,
    token: string
  ): Promise<TaskInstanceListResponse> {
    return this.http.request<TaskInstanceListResponse>(
      `/households/${householdId}/task-instances`,
      { method: "GET" },
      token
    );
  }

  public async claimTaskInstance(
    householdId: number,
    taskInstanceId: number,
    token: string
  ): Promise<void> {
    await this.http.request<unknown>(
      `/households/${householdId}/task-instances/${taskInstanceId}/claim`,
      { method: "POST" },
      token
    );
  }

  public requestGraceDay(householdId: number, taskInstanceId: number, token: string): Promise<GraceDayResponse> {
    return this.http.request<GraceDayResponse>(
      `/households/${householdId}/task-instances/${taskInstanceId}/grace-day`,
      { method: "POST" },
      token
    );
  }

  public createOffer(
    householdId: number,
    taskInstanceId: number,
    dto: CreateTaskOfferDto,
    token: string
  ): Promise<TaskOfferResponse> {
    return this.http.request<TaskOfferResponse>(
      `/households/${householdId}/task-instances/${taskInstanceId}/offers`,
      { method: "POST", body: JSON.stringify(dto) },
      token
    );
  }

  public cancelOffer(householdId: number, offerId: number, token: string): Promise<TaskOfferResponse> {
    return this.http.request<TaskOfferResponse>(
      `/households/${householdId}/task-offers/${offerId}`,
      { method: "DELETE" },
      token
    );
  }

  public async acceptOffer(householdId: number, offerId: number, token: string): Promise<void> {
    await this.http.request<unknown>(
      `/households/${householdId}/task-offers/${offerId}/accept`,
      { method: "POST" },
      token
    );
  }
}

export const dashboardService = new DashboardService();
