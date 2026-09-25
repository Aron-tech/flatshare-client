import { ITaskCompletionService } from "@/types/dashboard";

/**
 * MOCK – a backenden még nincs "feladat teljesítése" végpont.
 * Ha elkészül, egy valódi `ITaskCompletionService` implementációra kell cserélni
 * (pl. `POST /households/{h}/task-instances/{id}/complete`).
 */
export class MockTaskCompletionService implements ITaskCompletionService {
  public async complete(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
}

export const taskCompletionService: ITaskCompletionService =
  new MockTaskCompletionService();
