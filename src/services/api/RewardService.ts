import { Config } from "@/config/env";
import {
  RedeemRewardResponse,
  Reward,
  RewardDifficulty,
  RewardDto,
  RewardListResponse,
  RewardRedemptionListResponse,
  RewardResponse,
} from "@/types/reward";
import { HttpClient } from "./HttpClient";

export class RewardService {
  private readonly http: HttpClient;

  public constructor(http?: HttpClient) {
    this.http = http ?? new HttpClient(Config.BACKEND_URL);
  }

  public async getByHousehold(householdId: number, token: string): Promise<Reward[]> {
    const response = await this.http.request<RewardListResponse>(
      `/households/${householdId}/rewards`,
      { method: "GET" },
      token
    );
    return response.rewards;
  }

  /** Nehézség előnézet a pontár megadása közben. */
  public getDifficulty(householdId: number, pointsCost: number, token: string): Promise<RewardDifficulty> {
    return this.http.request<RewardDifficulty>(
      `/households/${householdId}/rewards/difficulty?points_cost=${pointsCost}`,
      { method: "GET" },
      token
    );
  }

  public async create(householdId: number, dto: RewardDto, token: string): Promise<Reward> {
    const response = await this.http.request<RewardResponse>(
      `/households/${householdId}/rewards`,
      { method: "POST", body: JSON.stringify(dto) },
      token
    );
    return response.reward;
  }

  /** Mentéskor a backend a szerkesztést is lezárja (`is_editing = false`). */
  public async update(householdId: number, rewardId: number, dto: RewardDto, token: string): Promise<Reward> {
    const response = await this.http.request<RewardResponse>(
      `/households/${householdId}/rewards/${rewardId}`,
      { method: "PUT", body: JSON.stringify(dto) },
      token
    );
    return response.reward;
  }

  public async remove(householdId: number, rewardId: number, token: string): Promise<void> {
    await this.http.request<unknown>(
      `/households/${householdId}/rewards/${rewardId}`,
      { method: "DELETE" },
      token
    );
  }

  /** `is_editing = true`; a backend egy idő után magától visszaállítja. */
  public async startEditing(householdId: number, rewardId: number, token: string): Promise<Reward> {
    const response = await this.http.request<RewardResponse>(
      `/households/${householdId}/rewards/${rewardId}/editing`,
      { method: "POST" },
      token
    );
    return response.reward;
  }

  /** Mentés nélküli kilépés a szerkesztésből. */
  public async stopEditing(householdId: number, rewardId: number, token: string): Promise<void> {
    await this.http.request<unknown>(
      `/households/${householdId}/rewards/${rewardId}/editing`,
      { method: "DELETE" },
      token
    );
  }

  public async redeem(householdId: number, rewardId: number, token: string): Promise<number> {
    const response = await this.http.request<RedeemRewardResponse>(
      `/households/${householdId}/rewards/${rewardId}/redeem`,
      { method: "POST" },
      token
    );
    return response.points_balance;
  }

  public getRedemptions(householdId: number, token: string): Promise<RewardRedemptionListResponse> {
    return this.http.request<RewardRedemptionListResponse>(
      `/households/${householdId}/reward-redemptions`,
      { method: "GET" },
      token
    );
  }

  /** A feltöltő (átadta) vagy a beváltó (megkapta) jelöli teljesítettnek. */
  public async fulfillRedemption(householdId: number, redemptionId: number, token: string): Promise<void> {
    await this.http.request<unknown>(
      `/households/${householdId}/reward-redemptions/${redemptionId}/fulfill`,
      { method: "POST" },
      token
    );
  }
}

export const rewardService = new RewardService();
