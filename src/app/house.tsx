import { HouseMoodCard } from "@/components/house/house-mood-card";
import { HouseScene3D, type HouseSceneHandle } from "@/components/house/house-scene-3d";
import { HouseSettingsSheet } from "@/components/house/house-settings-sheet";
import type { HouseJob } from "@/components/house/three/house-pet";
import { HouseZoneList } from "@/components/house/house-zone-list";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Elevation, Gutter, MaxContentWidth } from "@/constants/theme";
import { useHouseholdQuery, useHouseholdSession, usePullToRefresh } from "@/hooks/use-household-query";
import { useThemeColors, useThemeName } from "@/hooks/use-theme";
import { pendingReplays, readLastReplayed, saveLastReplayed } from "@/lib/house/replay";
import { HOUSE_ZONES } from "@/lib/house/scene.generated";
import { summarizeZones, zoneOf, type ZoneLevels } from "@/lib/house/zones";
import { HouseholdQueries } from "@/lib/queries";
import { useRouter } from "expo-router";
import { Settings2, X } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

/** Tagonként a lejátszásra váró takarítások sora. */
type JobQueues = Record<number, HouseJob[]>;

/**
 * A háztartás háza: a feladatok állapota rendetlenségként látszik a szobában, a tagok állatai
 * a közös hangulat szerint viselkednek. A legutóbbi megnyitás óta elvégzett feladatoknál
 * a teljesítő állata odamegy és rendet rak (eszközönként egyszer).
 */
export default function HouseScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useThemeName();
  const colors = useThemeColors();
  const window = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const { householdId } = useHouseholdSession();
  const { data: house, isLoading, error, refetch } = useHouseholdQuery(HouseholdQueries.house);
  const { refreshing, onRefresh } = usePullToRefresh(refetch);
  const [width, setWidth] = useState(0);
  const [queues, setQueues] = useState<JobQueues>({});
  const replayedFor = useRef<number | null>(null);
  const scene = useRef<HouseSceneHandle>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // A jelenet fix magasságú (nem görög), hogy a forgatás ne akadjon össze a görgetéssel.
  const sceneHeight = Math.round(Math.min(width * 0.95, window.height * 0.48));

  const { levels, summaries } = useMemo(() => summarizeZones(house?.zones ?? []), [house]);

  // Egyszer, az első betöltéskor: a legutóbbi megnyitás óta történt teljesítések lejátszása.
  useEffect(() => {
    if (!house || householdId === null || replayedFor.current === householdId) return;
    replayedFor.current = householdId;
    const memberIds = new Set(house.members.map((member) => member.user_id));
    const latest = Math.max(0, ...house.recent_completions.map((completion) => completion.id));
    void readLastReplayed(householdId).then((lastReplayed) => {
      const next: JobQueues = {};
      for (const completion of pendingReplays(house.recent_completions, lastReplayed)) {
        if (!memberIds.has(completion.user_id)) continue;
        (next[completion.user_id] ??= []).push({ id: completion.id, zone: zoneOf([completion.category_icon]) });
      }
      setQueues(next);
      if (latest > 0) void saveLastReplayed(householdId, latest);
    });
  }, [house, householdId]);

  /** Amíg egy zóna takarítása le nem játszódott, a zóna egy szinttel rendetlenebbnek látszik. */
  const displayLevels = useMemo(() => {
    const result = { ...levels } as ZoneLevels;
    for (const queue of Object.values(queues)) {
      for (const job of queue) if (job.zone) result[job.zone] = Math.min(3, result[job.zone] + 1);
    }
    return result;
  }, [levels, queues]);

  const currentJobs = useMemo(
    () => Object.fromEntries(Object.entries(queues).map(([userId, queue]) => [userId, queue[0]])) as Record<number, HouseJob | undefined>,
    [queues]
  );

  const finishJob = (userId: number, job: HouseJob) =>
    setQueues((current) => ({ ...current, [userId]: (current[userId] ?? []).filter((queued) => queued.id !== job.id) }));

  /** A rendetlenséget a kezdőlap Azonnali listájában lehet elvállalni. */
  const openTasks = () => router.dismissTo({ pathname: "/", params: { view: "pool" } });

  const messyZones = HOUSE_ZONES.filter((zone) => levels[zone] > 0).length;

  return (
    <View className="flex-1 flex-row justify-center bg-background">
      <SafeAreaView edges={["top", "bottom"]} className="w-full flex-1" style={{ maxWidth: MaxContentWidth }}>
        <View className="flex-row items-center justify-between gap-3 py-4" style={{ paddingHorizontal: Gutter }}>
          <Text className="flex-1 text-headline-lg">{t("house.title")}</Text>
          <Button size="icon" variant="ghost" onPress={() => router.back()} accessibilityLabel={t("common.close")}>
            <Icon as={X} size={20} />
          </Button>
        </View>

        <View style={{ paddingHorizontal: Gutter, paddingBottom: 16 }}>
          <View
            className="overflow-hidden rounded-card bg-secondary"
            style={Elevation.level1}
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          >
            {isLoading || !house || width === 0 ? (
              <Skeleton className="w-full rounded-card" style={{ height: sceneHeight || 320 }} />
            ) : (
              <HouseScene3D
                ref={scene}
                width={width}
                height={sceneHeight}
                levels={displayLevels}
                members={house.members}
                mood={house.mood.band}
                jobs={currentJobs}
                onJobDone={finishJob}
                onZonePress={openTasks}
                reducedMotion={reducedMotion}
                dark={theme === "dark"}
                background={colors.secondary}
              />
            )}
            {house && (
              <Button
                size="icon"
                variant="secondary"
                className="absolute right-3 top-3 rounded-full"
                style={Elevation.level1}
                onPress={() => setSettingsOpen(true)}
                accessibilityLabel={t("house.settings.title")}
              >
                <Icon as={Settings2} size={18} />
              </Button>
            )}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: Gutter, paddingBottom: 32, gap: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {error && <Text className="text-body-md text-destructive">{error}</Text>}

          {house && (
            <>
              <HouseMoodCard mood={house.mood} messyZones={messyZones} />

              <Text className="px-1 text-label-md uppercase text-muted-foreground">{t("house.zonesTitle")}</Text>
              {summaries.length === 0 ? (
                <EmptyState text={t("house.allClean")} />
              ) : (
                <HouseZoneList summaries={summaries} onPress={openTasks} />
              )}

              <Text className="px-1 text-center text-body-sm text-muted-foreground">{t("house.credits")}</Text>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {settingsOpen && (
        <HouseSettingsSheet
          onClose={() => setSettingsOpen(false)}
          onChooseCharacter={() => {
            setSettingsOpen(false);
            router.push("/character");
          }}
          onResetCamera={() => {
            setSettingsOpen(false);
            scene.current?.resetCamera();
          }}
        />
      )}
    </View>
  );
}
