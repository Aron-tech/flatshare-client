import { PetSprite } from "@/components/house/pet-sprite";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import {
  depthOf,
  distance,
  facingBetween,
  floorToImage,
  imageToFloor,
  randomWalkPoint,
  seeded,
  type FloorPoint,
} from "@/lib/house/geometry";
import { PET_ATLAS, ZONE_SPOTS, type Facing, type HouseZone, type PetAnimation } from "@/lib/house/scene.generated";
import type { HouseMember, HouseMoodBand } from "@/types/house";
import { Frown, Heart, Sparkles, type LucideIcon } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

/** Padló egység / mp. */
const WALK_SPEED = 0.55;
const WORK_MS = 2600;
const CHEER_MS = 900;
/** A névcímke ennyivel lehet szélesebb a képkockánál mindkét oldalon (pt). */
const NAME_OVERHANG = 24;

/** Egy lejátszandó takarítás: a zóna, ahova odamegy (`null`: csak örül a helyén). */
export interface HouseJob {
  id: number;
  zone: HouseZone | null;
}

/** Szétszórt kezdőhelyek (a tagok sorrendjében), hogy a nevek ne takarják egymást. */
const START_POINTS: readonly FloorPoint[] = [
  { x: 1.4, z: 1.5 },
  { x: 3.0, z: 1.6 },
  { x: 1.5, z: 3.2 },
  { x: 3.2, z: 3.1 },
  { x: 2.3, z: 2.3 },
  { x: 1.0, z: 2.4 },
  { x: 3.4, z: 2.3 },
  { x: 2.3, z: 3.5 },
];

function startPoint(index: number, userId: number): FloorPoint {
  const base = START_POINTS[index % START_POINTS.length];
  // Sok tagnál a második kör kicsit eltolva, mindig ugyanoda.
  const jitter = index >= START_POINTS.length ? 0.35 : 0.12;
  return {
    x: base.x + (seeded(userId) - 0.5) * jitter,
    z: base.z + (seeded(userId + 101) - 0.5) * jitter,
  };
}

interface HouseCharacterProps {
  member: HouseMember;
  /** A tag sorszáma (a kezdőhelyhez). */
  index: number;
  mood: HouseMoodBand;
  scale: number;
  job: HouseJob | null;
  onJobDone: (job: HouseJob) => void;
  reducedMotion: boolean;
}

interface Pose {
  animation: PetAnimation;
  facing: Facing;
}

/** Álldogálás közben a hangulat szerinti mozdulat. */
function restingAnimation(mood: HouseMoodBand): PetAnimation {
  const roll = Math.random();
  switch (mood) {
    case "happy":
      return roll < 0.45 ? "happy" : roll < 0.6 ? "cheer" : "idle";
    case "content":
      return roll < 0.15 ? "cheer" : "idle";
    case "grumpy":
      return roll < 0.4 ? "sad" : "idle";
    case "sad":
      return roll < 0.7 ? "sad" : "idle";
  }
}

const BUBBLES: Partial<Record<PetAnimation, { icon: LucideIcon; className: string }>> = {
  happy: { icon: Heart, className: "bg-success-soft text-success-active" },
  sad: { icon: Frown, className: "bg-primary-soft text-primary" },
  work: { icon: Sparkles, className: "bg-card text-success-active" },
};

/**
 * Egy tag állata a házban: sétálgat a bejárható padlón, a közös hangulat szerint mozdul,
 * és ha `job` van, odamegy a zónához, rendet rak, majd örül (`onJobDone`).
 */
export function HouseCharacter({ member, index, mood, scale, job, onJobDone, reducedMotion }: HouseCharacterProps) {
  const start = useMemo(() => startPoint(index, member.user_id), [index, member.user_id]);
  const position = useRef<FloorPoint>(start);
  const [pose, setPose] = useState<Pose>({ animation: "idle", facing: member.user_id % 2 ? "se" : "sw" });
  const [depth, setDepth] = useState(() => depthOf(start));
  const u = useSharedValue(floorToImage(start).u);
  const v = useSharedValue(floorToImage(start).v);
  const onJobDoneRef = useRef(onJobDone);
  useEffect(() => {
    onJobDoneRef.current = onJobDone;
  }, [onJobDone]);

  useEffect(() => {
    if (reducedMotion) {
      if (job) onJobDoneRef.current(job);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const wait = (ms: number) => new Promise<void>((resolve) => (timer = setTimeout(resolve, ms)));

    const walkTo = async (target: FloorPoint) => {
      const from = position.current;
      const length = distance(from, target);
      if (length < 0.05) return;
      const duration = (length / WALK_SPEED) * 1000;
      setPose({ animation: "walk", facing: facingBetween(from, target) });
      setDepth(Math.max(depthOf(from), depthOf(target)));
      const to = floorToImage(target);
      u.value = withTiming(to.u, { duration, easing: Easing.linear });
      v.value = withTiming(to.v, { duration, easing: Easing.linear });
      position.current = target;
      await wait(duration);
      if (!cancelled) setDepth(depthOf(target));
    };

    const run = async () => {
      if (job) {
        if (job.zone) {
          const spot = ZONE_SPOTS[job.zone];
          await walkTo(spot);
          if (cancelled) return;
          setPose({ animation: "work", facing: spot.facing });
          await wait(WORK_MS);
          if (cancelled) return;
        }
        setPose((current) => ({ animation: "cheer", facing: current.facing }));
        await wait(CHEER_MS);
        if (!cancelled) onJobDoneRef.current(job);
        return;
      }
      while (!cancelled) {
        if (Math.random() < 0.5) {
          await walkTo(randomWalkPoint());
        } else {
          setPose((current) => ({ animation: restingAnimation(mood), facing: current.facing }));
          await wait(1800 + Math.random() * 2400);
        }
        if (cancelled) return;
        setPose((current) => ({ animation: "idle", facing: current.facing }));
        await wait(700 + Math.random() * 1600);
      }
    };
    void run();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      cancelAnimation(u);
      cancelAnimation(v);
      // Séta közben megszakítva onnan folytatja, ahol éppen áll.
      position.current = imageToFloor(u.value, v.value);
    };
  }, [job, mood, reducedMotion, u, v]);

  const { frame } = PET_ATLAS;
  const placement = useAnimatedStyle(() => ({
    transform: [{ translateX: (u.value - frame.anchorX) * scale }, { translateY: (v.value - frame.anchorY) * scale }],
  }));

  const bubble = BUBBLES[pose.animation];

  return (
    <Animated.View
      accessible
      accessibilityLabel={member.name}
      style={[{ position: "absolute", left: 0, top: 0, zIndex: 10 + depth }, placement]}
    >
      <PetSprite pet={member.character} animation={pose.animation} facing={pose.facing} scale={scale} paused={reducedMotion} />
      {bubble && (
        <View
          pointerEvents="none"
          className={`absolute h-6 w-6 items-center justify-center rounded-full ${bubble.className}`}
          style={{ left: frame.anchorX * scale + 8, top: frame.height * 0.12 * scale }}
        >
          <Icon as={bubble.icon} size={13} className={bubble.className} />
        </View>
      )}
      <View
        pointerEvents="none"
        className="absolute items-center"
        style={{ left: -NAME_OVERHANG, width: frame.width * scale + NAME_OVERHANG * 2, top: frame.anchorY * scale + 2 }}
      >
        <View className={`rounded-full px-2 py-0.5 ${member.is_me ? "bg-primary" : "bg-card"}`}>
          <Text
            numberOfLines={1}
            className={`text-label-sm ${member.is_me ? "text-primary-foreground" : "text-foreground"}`}
            style={{ fontSize: 10, lineHeight: 13 }}
          >
            {member.name}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
