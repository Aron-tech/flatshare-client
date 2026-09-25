import { Config } from "@/config/env";
import {
  ITaskTemplateService,
  TaskTemplate,
  TaskTemplateListResponse,
} from "@/types/task";
import { HttpClient } from "./HttpClient";

export class TaskTemplateService implements ITaskTemplateService {
  private readonly http: HttpClient;

  public constructor(http?: HttpClient) {
    this.http = http ?? new HttpClient(Config.BACKEND_URL);
  }

  public async getAll(token: string): Promise<TaskTemplate[]> {
    const response = await this.http.request<TaskTemplateListResponse>(
      "/task-templates",
      { method: "GET" },
      token
    );
    return Object.values(response.task_templates).flat();
  }
}

export const taskTemplateService = new TaskTemplateService();
