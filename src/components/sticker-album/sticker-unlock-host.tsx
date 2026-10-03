import { Sticker, stickerTier } from "@/components/sticker-album/sticker";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { subscribeStickers } from "@/lib/sticker-events";
import type { UnlockedSticker } from "@/types/sticker-album";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";

/** The order of the backend `TaskSticker::MILESTONES` gives the sticker's level. */
const MILESTONES = [10, 25, 50, 100];

/** Show after the modal that closes when a task is logged (otherwise it would stay behind it). */
const SHOW_DELAY_MS = 600;

/**
 * Popup about the just-earned sticker (not a push). Tapping opens the album at that task;
 * with several stickers they come one after the other.
 */
export function StickerUnlockHost() {
  const { t } = useTranslation();
  const router = useRouter();
  /** The first is visible, the others follow. */
  const [queue, setQueue] = useState<UnlockedSticker[]>([]);
  const visible = queue[0];

  useEffect(() => {
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const unsubscribe = subscribeStickers((sticker) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        setQueue((prev) => [...prev, sticker]);
      }, SHOW_DELAY_MS);
      timers.add(timer);
    });
    return () => {
      unsubscribe();
      timers.forEach(clearTimeout);
    };
  }, []);

  if (!visible) return null;

  const close = () => setQueue((prev) => prev.slice(1));
  const open = () => {
    close();
    router.push({ pathname: "/sticker-album", params: { task_id: String(visible.task_id) } });
  };

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(150)}
      className="absolute inset-0 items-center justify-center px-8"
      style={{ backgroundColor: "#00000059" }}
    >
      <Pressable className="absolute inset-0" onPress={close} accessibilityLabel={t("stickerAlbum.unlock.later")} />
      <Animated.View entering={ZoomIn.springify().damping(14)} style={Elevation.level2} className="w-full max-w-sm">
        <Pressable
          onPress={open}
          accessibilityRole="button"
          className="items-center gap-3 rounded-card bg-card px-6 pb-5 pt-7"
        >
          <Sticker
            key={`${visible.task_id}-${visible.milestone}`}
            milestone={visible.milestone}
            tier={stickerTier(visible.milestone, MILESTONES)}
            categoryHints={[visible.category_icon, visible.task_name]}
            size={140}
            tilt={-6}
            appear="animate"
            delay={150}
          />
          <Text className="mt-2 text-label-md uppercase tracking-widest text-primary">
            {t(`stickerAlbum.tiers.${stickerTier(visible.milestone, MILESTONES)}`)}
          </Text>
          <Text className="font-serif text-headline-md">{t("stickerAlbum.unlock.title")}</Text>
          <Text className="text-center text-body-md text-muted-foreground">
            {t("stickerAlbum.unlock.body", { task: visible.task_name, count: visible.milestone })}
          </Text>
          <View className="mt-2 w-full gap-2">
            <Button onPress={open}>
              <Text>{t("stickerAlbum.unlock.view")}</Text>
            </Button>
            <Button variant="ghost" onPress={close}>
              <Text>{t("stickerAlbum.unlock.later")}</Text>
            </Button>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}
