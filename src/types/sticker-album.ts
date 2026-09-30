/** Egy matrica-hely az album oldalán; `unlocked_at` nélkül még üres. */
export interface StickerSlot {
  /** Ennyi elvégzés adja a matricát (10 / 25 / 50 / 100). */
  milestone: number;
  unlocked_at: string | null;
  /** Még nem látta az albumban. */
  is_new: boolean;
}

/** Az album egy oldala: a háztartás egy feladata. */
export interface StickerAlbumPage {
  task_id: number;
  task_name: string;
  is_recurring: boolean;
  category: { name: string; icon: string | null; color: string | null } | null;
  /** A user eddigi elvégzései ebből a feladatból. */
  completions: number;
  /** A következő még meg nem szerzett matrica, ha van. */
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

/** A teljesítés/rögzítés válaszában: az épp megszerzett matrica. */
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
