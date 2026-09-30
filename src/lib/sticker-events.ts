import type { UnlockedSticker } from "@/types/sticker-album";

type Listener = (sticker: UnlockedSticker) => void;

const listeners = new Set<Listener>();

/** A teljesítés válaszában kapott új matricát a felugró értesítésnek adja (`StickerUnlockHost`). */
export function announceSticker(sticker: UnlockedSticker | null | undefined) {
  if (!sticker) return;
  listeners.forEach((listener) => listener(sticker));
}

export function subscribeStickers(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
