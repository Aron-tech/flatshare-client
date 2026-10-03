import { Config } from "@/config/env";
import { HouseState, IHouseService } from "@/types/house";
import { HttpClient } from "./HttpClient";

export class HouseService implements IHouseService {
  private readonly http: HttpClient;

  public constructor(http?: HttpClient) {
    this.http = http ?? new HttpClient(Config.BACKEND_URL);
  }

  public getState(householdId: number, token: string): Promise<HouseState> {
    return this.http.request<HouseState>(`/households/${householdId}/house`, { method: "GET" }, token);
  }
}

export const houseService = new HouseService();
