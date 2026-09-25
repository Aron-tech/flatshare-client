import { Config } from "@/config/env";
import {
  ITaskCompletionService,
  TaskCompletionResponse,
} from "@/types/dashboard";
import { HttpClient } from "./HttpClient";

export class TaskCompletionService implements ITaskCompletionService {
  private readonly http: HttpClient;

  public constructor(http?: HttpClient) {
    this.http = http ?? new HttpClient(Config.BACKEND_URL);
  }

  public complete(
    householdId: number,
    taskInstanceId: number,
    token: string
  ): Promise<TaskCompletionResponse> {
    return this.http.request<TaskCompletionResponse>(
      `/households/${householdId}/task-instances/${taskInstanceId}/complete`,
      { method: "POST" },
      token
    );
  }
}

export const taskCompletionService = new TaskCompletionService();
