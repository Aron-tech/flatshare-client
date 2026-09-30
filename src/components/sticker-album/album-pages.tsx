import { resolveCategoryIcon } from "@/components/category-icon";
import { Sticker, type StickerAppear, stickerTier, stickerTilt } from "@/components/sticker-album/sticker";
import { WaveProgressBar } from "@/components/sticker-album/wave-progress-bar";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useAppearance } from "@/context/AppearanceContext";
import { useThemeColors, useThemeName } from "@/hooks/use-theme";
import { currentLocale } from "@/i18n";
import type { StickerAlbum, StickerAlbumPage, StickerSlot } from "@/types/sticker-album";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";

const PAPER = {
  light: { page: "#F8F1E4", edge: "#E9DDC8", ink: "#5B4A3A", faint: "#CDBEA6", spine: "#2C2B29" },
  dark: { page: "#2B2824", edge: "#3A352F", ink: "#E6DCCD", faint: "#5E554A", spine: "#000000" },
} as const;

function usePaper() {
  return PAPER[useThemeName()];
}

/** Egy albumlap: krémszínű papír, bal oldalt a gerinc árnyéka és a varrás, alul az oldalszám. */
export function AlbumSheet({ pageNumber, children }: { pageNumber?: number; children: ReactNode }) {
  const paper = usePaper();

  return (
    <View
      className="flex-1 overflow-hidden"
      style={{
        backgroundColor: paper.page,
        borderColor: paper.edge,
        borderWidth: 1,
        borderTopLeftRadius: 6,
        borderBottomLeftRadius: 6,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
      }}
    >
      {/* A gerinc felé sötétedő árnyék. */}
      {[0.14, 0.08, 0.04, 0.02].map((opacity, index) => (
        <View
          key={opacity}
          pointerEvents="none"
          className="absolute bottom-0 top-0"
          style={{ left: index * 4, width: 4, backgroundColor: paper.spine, opacity }}
        />
      ))}
      <View
        pointerEvents="none"
        className="absolute bottom-3 top-3"
        style={{ left: 22, borderLeftWidth: 1.5, borderStyle: "dashed", borderColor: paper.faint }}
      />
      {/* Behajlott sarok. */}
      <View
        pointerEvents="none"
        className="absolute bottom-0 right-0"
        style={{
          width: 0,
          height: 0,
          borderStyle: "solid",
          borderLeftWidth: 26,
          borderTopWidth: 26,
          borderLeftColor: "transparent",
          borderTopColor: paper.edge,
          borderBottomRightRadius: 20,
        }}
      />

      <View className="flex-1" style={{ paddingLeft: 36, paddingRight: 20, paddingTop: 20, paddingBottom: 8 }}>
        {children}
      </View>
      {pageNumber !== undefined && (
        <Text className="pb-3 text-center font-serif text-body-sm italic" style={{ color: paper.ink }}>
          — {pageNumber} —
        </Text>
      )}
    </View>
  );
}

/** Borító: cím, gyűjtő, a gyűjtés állása. */
export function CoverPage({ album, collectorName, householdName }: { album: StickerAlbum; collectorName: string; householdName: string }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const progress = album.total === 0 ? 0 : album.collected / album.total;

  return (
    <View
      className="flex-1 overflow-hidden"
      style={{
        backgroundColor: colors.primary,
        borderTopLeftRadius: 6,
        borderBottomLeftRadius: 6,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
      }}
    >
      <View className="absolute bottom-0 left-0 top-0 w-5" style={{ backgroundColor: "#00000026" }} />
      <View
        className="flex-1 items-center justify-between rounded-container py-8"
        style={{ margin: 18, marginLeft: 34, borderWidth: 1.5, borderColor: "#FFFFFF80" }}
      >
        <View className="items-center gap-1 px-4">
          <Text className="text-label-md uppercase tracking-widest" style={{ color: "#FFFFFFCC" }}>
            {householdName}
          </Text>
          <Text className="text-center font-serif text-headline-xl text-white">{t("stickerAlbum.coverTitle")}</Text>
          <Text className="font-serif text-body-lg italic" style={{ color: "#FFFFFFD9" }}>
            {t("stickerAlbum.coverSubtitle")}
          </Text>
        </View>

        <Sticker milestone={album.milestones.at(-1) ?? 100} tier="legendary" categoryHints={[]} size={150} tilt={-8} />

        <View className="w-full items-center gap-2 px-6">
          <Text className="text-label-lg text-white">{t("stickerAlbum.collector", { name: collectorName })}</Text>
          <View className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "#FFFFFF40" }}>
            <View className="h-full rounded-full bg-white" style={{ width: `${Math.round(progress * 100)}%` }} />
          </View>
          <Text className="text-body-sm" style={{ color: "#FFFFFFE6" }}>
            {t("stickerAlbum.collected", { collected: album.collected, total: album.total })}
          </Text>
          {album.new_count > 0 && (
            <View className="mt-1 rounded-full bg-white px-3 py-1">
              <Text className="text-label-md" style={{ color: colors.primary }}>
                {t("stickerAlbum.newStickers", { count: album.new_count })}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

/** Tartalomjegyzék: feladatonként a megszerzett matricák és az oldalszám; koppintásra odalapoz. */
export function ContentsPage({
  album,
  pageNumber,
  firstTaskPage,
  onOpen,
}: {
  album: StickerAlbum;
  pageNumber: number;
  firstTaskPage: number;
  onOpen: (pageIndex: number) => void;
}) {
  const { t } = useTranslation();
  const paper = usePaper();

  return (
    <AlbumSheet pageNumber={pageNumber}>
      <Text className="font-serif text-headline-md" style={{ color: paper.ink }}>
        {t("stickerAlbum.contents")}
      </Text>
      <Text className="mb-3 text-body-sm" style={{ color: paper.ink, opacity: 0.75 }}>
        {t("stickerAlbum.howItWorks")}
      </Text>
      {album.pages.length === 0 ? (
        <Text className="mt-6 text-center text-body-md" style={{ color: paper.ink }}>
          {t("stickerAlbum.empty")}
        </Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
          {album.pages.map((page, index) => (
            <Pressable
              key={page.task_id}
              onPress={() => onOpen(firstTaskPage + index)}
              className="flex-row items-center gap-2 py-2 active:opacity-60"
              accessibilityRole="button"
            >
              <Text className="shrink font-serif text-body-md" numberOfLines={1} style={{ color: paper.ink }}>
                {page.task_name}
              </Text>
              {page.stickers.some((slot) => slot.is_new) && <NewTag />}
              <View className="mx-1 flex-1 border-b border-dotted" style={{ borderColor: paper.faint }} />
              <View className="flex-row gap-1">
                {page.stickers.map((slot) => (
                  <TierDot key={slot.milestone} slot={slot} milestones={album.milestones} />
                ))}
              </View>
              <Text className="w-7 text-right text-label-md" style={{ color: paper.ink }}>
                {firstTaskPage + index + 1}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </AlbumSheet>
  );
}

const TIER_DOT: Record<string, string> = {
  bronze: "#B8743F",
  silver: "#A3ABB5",
  gold: "#E0AE3A",
  legendary: "#A78BFA",
};

function TierDot({ slot, milestones }: { slot: StickerSlot; milestones: number[] }) {
  const paper = usePaper();
  const filled = slot.unlocked_at !== null;
  return (
    <View
      className="h-2.5 w-2.5 rounded-full"
      style={
        filled
          ? { backgroundColor: TIER_DOT[stickerTier(slot.milestone, milestones)] }
          : { borderWidth: 1, borderColor: paper.faint }
      }
    />
  );
}

function NewTag() {
  const { t } = useTranslation();
  return (
    <View className="rounded-full bg-primary px-2 py-0.5">
      <Text className="text-label-sm text-primary-foreground">{t("stickerAlbum.new")}</Text>
    </View>
  );
}

/** Az oldal n-edik új matricájának késleltetése: egymás után kerülnek fel. */
export function stickerDelay(index: number): number {
  return 350 + 450 * index;
}

/** Egy feladat oldala: fejléc washi szalaggal, haladás, és a mérföldkövek matrica-helyei 2×2-es rácsban. */
export function TaskPage({
  page,
  milestones,
  pageNumber,
  newStickers,
  width,
}: {
  page: StickerAlbumPage;
  milestones: number[];
  pageNumber: number;
  /** Az új (még be nem ragasztott) matricák állapota: rejtve várnak, vagy most kerülnek fel. */
  newStickers: Exclude<StickerAppear, "static"> | null;
  width: number;
}) {
  const { t } = useTranslation();
  const paper = usePaper();
  const colors = useThemeColors();
  const { stickerWaves } = useAppearance();
  const tint = page.category?.color && /^#[0-9a-f]{6}$/i.test(page.category.color) ? page.category.color : colors.primary;
  const hints = [page.category?.icon, page.category?.name, page.task_name];

  const previousMilestone = [...milestones].reverse().find((milestone) => milestone <= page.completions) ?? 0;
  const progress =
    page.next_milestone === null
      ? 1
      : (page.completions - previousMilestone) / (page.next_milestone - previousMilestone);

  // A lap belső szélessége (a papír és a margók nélkül) a 2 oszlophoz.
  const slotWidth = Math.floor((width - 56 - 12) / 2);
  const stickerSize = Math.min(118, Math.round(slotWidth * 0.78));
  let newIndex = 0;

  return (
    <AlbumSheet pageNumber={pageNumber}>
      <View className="mb-4 items-start">
        {/* Washi szalag a kategória színével. */}
        <View
          className="mb-2 flex-row items-center gap-1.5 px-3 py-1"
          style={{ backgroundColor: `${tint}55`, transform: [{ rotate: "-2deg" }], borderRadius: 2 }}
        >
          <Icon as={resolveCategoryIcon(...hints)} size={12} color={paper.ink} />
          <Text className="text-label-sm uppercase tracking-widest" style={{ color: paper.ink }}>
            {page.category?.name ?? t("stickerAlbum.uncategorized")}
          </Text>
        </View>
        <Text className="font-serif text-headline-md" numberOfLines={2} style={{ color: paper.ink }}>
          {page.task_name}
        </Text>
        <View className="mt-2 w-full gap-1.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-label-lg" style={{ color: paper.ink }}>
              {t("stickerAlbum.completions", { count: page.completions })}
            </Text>
          </View>
          <WaveProgressBar
            progress={progress}
            tint={tint}
            trackColor={paper.edge}
            // A hullám csak a folyamatban lévő matricánál fut; kész oldalon a sáv úgyis tele van.
            animated={stickerWaves && page.next_milestone !== null}
          />
          <Text className="text-body-sm" style={{ color: paper.ink, opacity: 0.75 }}>
            {page.next_milestone === null
              ? t("stickerAlbum.pageComplete")
              : t("stickerAlbum.toNext", {
                  count: page.next_milestone - page.completions,
                  milestone: page.next_milestone,
                })}
          </Text>
        </View>
      </View>

      <View className="flex-1 flex-row flex-wrap content-center justify-between" style={{ rowGap: 16 }}>
        {page.stickers.map((slot) => {
          const tier = stickerTier(slot.milestone, milestones);
          const appear: StickerAppear = slot.is_new && newStickers ? newStickers : "static";
          const delay = appear === "animate" ? stickerDelay(newIndex++) : 0;
          return (
            <View key={slot.milestone} className="items-center gap-1.5" style={{ width: slotWidth }}>
              {slot.unlocked_at ? (
                <View>
                  <Sticker
                    milestone={slot.milestone}
                    tier={tier}
                    categoryHints={hints}
                    size={stickerSize}
                    tilt={stickerTilt(page.task_id * 7 + slot.milestone)}
                    appear={appear}
                    delay={delay}
                  />
                  {slot.is_new && (
                    <View className="absolute -right-1 -top-1">
                      <NewTag />
                    </View>
                  )}
                </View>
              ) : (
                <EmptySlot milestone={slot.milestone} size={stickerSize} hints={hints} />
              )}
              <Text className="text-label-md" style={{ color: paper.ink }}>
                {slot.unlocked_at ? t(`stickerAlbum.tiers.${tier}`) : t("stickerAlbum.slotLabel", { milestone: slot.milestone })}
              </Text>
              {/* Üres helynél nincs dátum; a sor helye NBSP-vel marad meg, hogy a rács ne ugráljon. */}
              <Text className="text-label-sm" style={{ color: paper.ink, opacity: 0.6 }}>
                {slot.unlocked_at
                  ? new Date(slot.unlocked_at).toLocaleDateString(currentLocale(), { year: "numeric", month: "short", day: "numeric" })
                  : " "}
              </Text>
            </View>
          );
        })}
      </View>
    </AlbumSheet>
  );
}

/** Üres matrica-hely: szaggatott körvonal, halvány ikon és a szükséges elvégzések száma. */
function EmptySlot({ milestone, size, hints }: { milestone: number; size: number; hints: (string | null | undefined)[] }) {
  const paper = usePaper();
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{ width: size, height: size, borderWidth: 2, borderStyle: "dashed", borderColor: paper.faint }}
    >
      <View className="absolute" style={{ opacity: 0.12 }}>
        <Icon as={resolveCategoryIcon(...hints)} size={Math.round(size * 0.5)} color={paper.ink} />
      </View>
      <Text className="font-serif" style={{ color: paper.faint, fontSize: Math.round(size * 0.3), lineHeight: Math.round(size * 0.36) }}>
        {milestone}
      </Text>
    </View>
  );
}
