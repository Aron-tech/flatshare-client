import { Config } from "@/config/env";
import { TaskCompletionResponse } from "@/types/dashboard";
import {
  CreateTaskDto,
  CreateTaskFromTemplateDto,
  CustomTaskFieldsDto,
  HouseholdTask,
  HouseholdTaskListResponse,
  ITaskService,
  LogTaskFromTemplateDto,
  OneOffHouseholdTask,
  OneOffHouseholdTaskListResponse,
  TaskUserWeight,
  UpdateTaskDto,
} from "@/types/task";
import { HttpClient, RequestOptions } from "./HttpClient";

/** A feladat-űrlapok a validációs hibákat a mezők mellett jelenítik meg. */
const INLINE_VALIDATION: RequestOptions = { inlineValidation: true };

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

  public async createTask(
    householdId: number,
    dto: CreateTaskDto,
    token: string
  ): Promise<void> {
    await this.http.request<unknown>(
      `/households/${householdId}/tasks`,
      { method: "POST", body: JSON.stringify(dto) },
      token,
      INLINE_VALIDATION
    );
  }

  public async updateTask(
    householdId: number,
    taskId: number,
    dto: UpdateTaskDto,
    token: string
  ): Promise<void> {
    await this.http.request<unknown>(
      `/households/${householdId}/tasks/${taskId}`,
      { method: "PUT", body: JSON.stringify(dto) },
      token,
      INLINE_VALIDATION
    );
  }

  public async createTaskFromTemplate(
    householdId: number,
    templateId: number,
    dto: CreateTaskFromTemplateDto,
    token: string
  ): Promise<void> {
    await this.http.request<unknown>(
      `/households/${householdId}/tasks/${templateId}`,
      { method: "POST", body: JSON.stringify(dto) },
      token
    );
  }

  public async getOneOffTasks(
    householdId: number,
    token: string
  ): Promise<OneOffHouseholdTask[]> {
    const response = await this.http.request<OneOffHouseholdTaskListResponse>(
      `/households/${householdId}/tasks/one-off`,
      { method: "GET" },
      token
    );
    return response.tasks;
  }

  public async openTask(
    householdId: number,
    taskId: number,
    token: string
  ): Promise<void> {
    await this.http.request<unknown>(
      `/households/${householdId}/tasks/${taskId}/open`,
      { method: "POST" },
      token
    );
  }

  public logTask(
    householdId: number,
    taskId: number,
    token: string
  ): Promise<TaskCompletionResponse> {
    return this.http.request<TaskCompletionResponse>(
      `/households/${householdId}/tasks/${taskId}/log`,
      { method: "POST" },
      token
    );
  }

  public logNewTask(
    householdId: number,
    dto: CustomTaskFieldsDto,
    token: string
  ): Promise<TaskCompletionResponse> {
    return this.http.request<TaskCompletionResponse>(
      `/households/${householdId}/tasks/log`,
      { method: "POST", body: JSON.stringify(dto) },
      token,
      INLINE_VALIDATION
    );
  }

  public logTaskFromTemplate(
    householdId: number,
    templateId: number,
    dto: LogTaskFromTemplateDto,
    token: string
  ): Promise<TaskCompletionResponse> {
    return this.http.request<TaskCompletionResponse>(
      `/households/${householdId}/tasks/templates/${templateId}/log`,
      { method: "POST", body: JSON.stringify(dto) },
      token
    );
  }

  public async deleteTask(
    householdId: number,
    taskId: number,
    token: string
  ): Promise<void> {
    await this.http.request<unknown>(
      `/households/${householdId}/tasks/${taskId}`,
      { method: "DELETE" },
      token
    );
  }

  public async setUserWeight(
    householdId: number,
    taskId: number,
    weight: TaskUserWeight,
    token: string
  ): Promise<void> {
    await this.http.request<unknown>(
      `/households/${householdId}/tasks/${taskId}/user-weight`,
      { method: "POST", body: JSON.stringify({ weight }) },
      token
    );
  }
}

export const taskService = new TaskService();
