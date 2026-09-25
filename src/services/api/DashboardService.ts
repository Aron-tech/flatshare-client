import { Config } from "@/config/env";
import {
  IDashboardService,
  MyHouseholdPointsResponse,
  TaskInstanceListResponse,
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
}

export const dashboardService = new DashboardService();
