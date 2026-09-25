import { Config } from "@/config/env";
import {
  HouseholdTask,
  HouseholdTaskListResponse,
  ITaskService,
} from "@/types/task";
import { HttpClient } from "./HttpClient";

export class TaskService implements ITaskService {
  private readonly http: HttpClient;

  public constructor(http?: HttpClient) {
    this.http = http ?? new HttpClient(Config.BACKEND_URL);
  }

  public async getHouseholdTasks(
    householdId: number,
    token: string
  ): Promise<HouseholdTask[]> {
    const response = await this.http.request<HouseholdTaskListResponse>(
      `/households/${householdId}/tasks`,
      { method: "GET" },
      token
    );
    return Object.values(response.tasks).flat();
  }
}

export const taskService = new TaskService();
