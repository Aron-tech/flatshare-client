import { Config } from "@/config/env";
import { ActivityPage, HouseholdStats, IStatsService } from "@/types/stats";
import { HttpClient } from "./HttpClient";

export class StatsService implements IStatsService {
  private readonly http: HttpClient;

  public constructor(http?: HttpClient) {
    this.http = http ?? new HttpClient(Config.BACKEND_URL);
  }

  public getStats(householdId: number, token: string): Promise<HouseholdStats> {
    return this.http.request<HouseholdStats>(
      `/households/${householdId}/stats`,
      { method: "GET" },
      token
    );
  }

  public getActivity(householdId: number, token: string, cursor: number | null, limit: number): Promise<ActivityPage> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor !== null) params.set("cursor", String(cursor));
    return this.http.request<ActivityPage>(
      `/households/${householdId}/activity?${params}`,
      { method: "GET" },
      token
    );
  }
}

export const statsService = new StatsService();
