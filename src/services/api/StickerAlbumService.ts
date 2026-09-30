import { Config } from "@/config/env";
import { IStickerAlbumService, StickerAlbum } from "@/types/sticker-album";
import { HttpClient } from "./HttpClient";

export class StickerAlbumService implements IStickerAlbumService {
  private readonly http: HttpClient;

  public constructor(http?: HttpClient) {
    this.http = http ?? new HttpClient(Config.BACKEND_URL);
  }

  public getAlbum(householdId: number, token: string): Promise<StickerAlbum> {
    return this.http.request<StickerAlbum>(
      `/households/${householdId}/sticker-album`,
      { method: "GET" },
      token
    );
  }

  /** `taskId` nélkül a háztartás összes új matricáját látottnak jelöli. */
  public async markSeen(householdId: number, taskId: number | null, token: string): Promise<void> {
    await this.http.request<unknown>(
      `/households/${householdId}/sticker-album/seen`,
      { method: "POST", body: JSON.stringify(taskId === null ? {} : { task_id: taskId }) },
      token
    );
  }
}

export const stickerAlbumService = new StickerAlbumService();
