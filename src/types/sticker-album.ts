/** A sticker slot on the album page; without `unlocked_at` it is still empty. */
export interface StickerSlot {
  /** This many completions earn the sticker (10 / 25 / 50 / 100). */
  milestone: number;
  unlocked_at: string | null;
  /** Not seen in the album yet. */
  is_new: boolean;
}

/** A page of the album: one of the household's tasks. */
export interface StickerAlbumPage {
  task_id: number;
  task_name: string;
  is_recurring: boolean;
  category: { name: string; icon: string | null; color: string | null } | null;
  /** The user's completions of this task so far. */
  completions: number;
  /** The next sticker not earned yet, if any. */
  next_milestone: number | null;
  stickers: StickerSlot[];
}

/** `GET /households/{h}/sticker-album` */
export interface StickerAlbum {
  milestones: number[];
  collected: number;
  total: number;
  new_count: number;
  pages: StickerAlbumPage[];
}

/** In the completion/logging response: the just-earned sticker. */
export interface UnlockedSticker {
  task_id: number;
  task_name: string;
  category_icon: string | null;
  category_color: string | null;
  milestone: number;
}

export interface IStickerAlbumService {
  getAlbum(householdId: number, token: string): Promise<StickerAlbum>;
  markSeen(householdId: number, taskId: number | null, token: string): Promise<void>;
}
