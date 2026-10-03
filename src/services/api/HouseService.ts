import { Config } from "@/config/env";
import { ContributeToRoomResponse, HouseRoomState, HouseState, IHouseService } from "@/types/house";
import { HttpClient } from "./HttpClient";

export class HouseService implements IHouseService {
  private readonly http: HttpClient;

  public constructor(http?: HttpClient) {
    this.http = http ?? new HttpClient(Config.BACKEND_URL);
  }

  public getState(householdId: number, token: string): Promise<HouseState> {
    return this.http.request<HouseState>(`/households/${householdId}/house`, { method: "GET" }, token);
  }

  public contributeToRoom(
    householdId: number,
    room: HouseRoomState["key"],
    amount: number,
    token: string
  ): Promise<ContributeToRoomResponse> {
    return this.http.request<ContributeToRoomResponse>(
      `/households/${householdId}/house/rooms/${room}/contribute`,
      { method: "POST", body: JSON.stringify({ amount }) },
      token
    );
  }
}

export const houseService = new HouseService();
