import { Config } from "@/config/env";
import {
  ITaskCompletionService,
  TaskCompletionResponse,
} from "@/types/dashboard";
import { announceSticker } from "@/lib/sticker-events";
import { HttpClient } from "./HttpClient";

export class TaskCompletionService implements ITaskCompletionService {
  private readonly http: HttpClient;

  public constructor(http?: HttpClient) {
    this.http = http ?? new HttpClient(Config.BACKEND_URL);
  }

  public async complete(
    householdId: number,
    taskInstanceId: number,
    token: string
  ): Promise<TaskCompletionResponse> {
    const result = await this.http.request<TaskCompletionResponse>(
      `/households/${householdId}/task-instances/${taskInstanceId}/complete`,
      { method: "POST" },
      token
    );
    announceSticker(result.new_sticker);
    return result;
  }
}

export const taskCompletionService = new TaskCompletionService();
