import { ContentsPage, CoverPage, stickerDelay, TaskPage } from "@/components/sticker-album/album-pages";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Gutter, MaxContentWidth } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { useHouseholdMutation, useHouseholdQuery, useHouseholdSession } from "@/hooks/use-household-query";
import { HouseholdQueries } from "@/lib/queries";
import { stickerAlbumService } from "@/services/api/StickerAlbumService";
import type { StickerAlbumPage } from "@/types/sticker-album";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AlbumItem =
  | { kind: "cover" }
  | { kind: "contents" }
  | { kind: "task"; page: StickerAlbumPage };

/** The task pages come after the cover and the table of contents. */
const FIRST_TASK_PAGE = 2;

/** The new stickers are marked seen this long after their animation (ms). */
const SEEN_AFTER_ANIMATION_MS = 900;

/**
 * The user's sticker album: a pageable book with a cover, a table of contents and one page per task,
 * where the stickers for 10 / 25 / 50 / 100 completions collect. With `?task_id=` it opens at that task's page.
 */
export default function StickerAlbumScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeHousehold } = useHousehold();
  const { householdId } = useHouseholdSession();
  const params = useLocalSearchParams<{ task_id?: string }>();
  const { data: album, isLoading } = useHouseholdQuery(HouseholdQueries.stickerAlbum);
  const markSeen = useHouseholdMutation(
    (h, token, taskId: number) => stickerAlbumService.markSeen(h, taskId, token),
    { invalidate: false }
  );

  const list = useRef<FlatList<AlbumItem>>(null);
  const [{ width, height }, setSize] = useState({ width: 0, height: 0 });
  const [current, setCurrent] = useState<number | null>(null);
  /** Tasks whose new stickers were already placed in this opening. */
  const [stuck, setStuck] = useState<ReadonlySet<number>>(new Set());

  const items = useMemo<AlbumItem[]>(
    () => [
      { kind: "cover" },
      { kind: "contents" },
      ...(album?.pages ?? []).map((page) => ({ kind: "task" as const, page })),
    ],
    [album]
  );

  const initialIndex = useMemo(() => {
    const taskId = Number(params.task_id);
    const index = album?.pages.findIndex((page) => page.task_id === taskId) ?? -1;
    return index >= 0 ? FIRST_TASK_PAGE + index : 0;
  }, [album, params.task_id]);
  const currentIndex = current ?? initialIndex;
  const currentItem = items[currentIndex];

  // The current page's new stickers are placed, then marked seen.
  const currentTask = currentItem?.kind === "task" ? currentItem.page : null;
  const pendingNew = currentTask && !stuck.has(currentTask.task_id) ? currentTask.stickers.filter((slot) => slot.is_new).length : 0;
  useEffect(() => {
    if (!currentTask || pendingNew === 0) return;
    const taskId = currentTask.task_id;
    const timer = setTimeout(() => {
      setStuck((prev) => new Set(prev).add(taskId));
      void markSeen.run(taskId);
    }, stickerDelay(pendingNew - 1) + SEEN_AFTER_ANIMATION_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `markSeen` is a new object on every render
  }, [currentTask, pendingNew]);

  // The album refreshes on close, so the seen stickers are not new on the next open.
  useEffect(
    () => () => {
      if (householdId !== null) void queryClient.invalidateQueries({ queryKey: HouseholdQueries.stickerAlbum.key(householdId) });
    },
    [householdId, queryClient]
  );

  const goTo = (index: number) => {
    const target = Math.max(0, Math.min(items.length - 1, index));
    list.current?.scrollToIndex({ index: target, animated: true });
    setCurrent(target);
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width > 0) setCurrent(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  const renderItem = ({ item, index }: { item: AlbumItem; index: number }) => {
    if (!album) return null;
    let content;
    if (item.kind === "cover") {
      content = <CoverPage album={album} collectorName={user?.name ?? ""} householdName={activeHousehold?.name ?? ""} />;
    } else if (item.kind === "contents") {
      content = <ContentsPage album={album} pageNumber={index} firstTaskPage={FIRST_TASK_PAGE} onOpen={goTo} />;
    } else {
      const isStuck = stuck.has(item.page.task_id);
      content = (
        <TaskPage
          page={item.page}
          milestones={album.milestones}
          pageNumber={index}
          newStickers={isStuck ? null : index === currentIndex ? "animate" : "hidden"}
          width={width - Gutter * 2}
        />
      );
    }
    return (
      <View style={{ width, height, paddingHorizontal: Gutter, paddingVertical: 8 }}>
        {content}
      </View>
    );
  };

  return (
    <View className="flex-1 flex-row justify-center bg-background">
      <SafeAreaView edges={["top", "bottom"]} className="w-full flex-1" style={{ maxWidth: MaxContentWidth }}>
        <View className="flex-row items-center justify-between gap-3 py-4" style={{ paddingHorizontal: Gutter }}>
          <Text className="flex-1 text-headline-lg">{t("stickerAlbum.title")}</Text>
          <Button size="icon" variant="ghost" onPress={() => router.back()} accessibilityLabel={t("common.close")}>
            <Icon as={X} size={20} />
          </Button>
        </View>

        <View className="flex-1" onLayout={(event) => {
            const { width: layoutWidth, height: layoutHeight } = event.nativeEvent.layout;
            setSize({ width: layoutWidth, height: layoutHeight });
          }}>
          {isLoading || !album || width === 0 ? (
            <View className="flex-1" style={{ paddingHorizontal: Gutter, paddingVertical: 8 }}>
              <Skeleton className="flex-1 rounded-card" />
            </View>
          ) : (
            <FlatList
              ref={list}
              style={{ flex: 1 }}
              data={items}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => (item.kind === "task" ? `task-${item.page.task_id}` : item.kind)}
              renderItem={renderItem}
              extraData={[currentIndex, stuck, width, height]}
              initialScrollIndex={initialIndex}
              getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
              onMomentumScrollEnd={onScrollEnd}
              windowSize={3}
            />
          )}
        </View>

        <View className="flex-row items-center justify-between py-3" style={{ paddingHorizontal: Gutter }}>
          <Button
            size="icon"
            variant="ghost"
            disabled={currentIndex === 0}
            onPress={() => goTo(currentIndex - 1)}
            accessibilityLabel={t("stickerAlbum.previous")}
          >
            <Icon as={ChevronLeft} size={22} />
          </Button>
          <Text className="font-serif text-body-md text-muted-foreground">
            {currentIndex + 1} / {items.length}
          </Text>
          <Button
            size="icon"
            variant="ghost"
            disabled={currentIndex >= items.length - 1}
            onPress={() => goTo(currentIndex + 1)}
            accessibilityLabel={t("stickerAlbum.next")}
          >
            <Icon as={ChevronRight} size={22} />
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}
