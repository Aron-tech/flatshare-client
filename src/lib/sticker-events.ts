import type { UnlockedSticker } from "@/types/sticker-album";

type Listener = (sticker: UnlockedSticker) => void;

const listeners = new Set<Listener>();

/** Hands the new sticker received in the completion response to the popup (`StickerUnlockHost`). */
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
