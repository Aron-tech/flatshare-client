import { HouseCharacter, type HouseJob } from "@/components/house/house-character";
import { Icon } from "@/components/ui/icon";
import { floorToImage } from "@/lib/house/geometry";
import {
  HOUSE_ZONES,
  MESS_LAYERS,
  ROOM_IMAGE,
  ZONE_SPOTS,
  type HouseZone,
} from "@/lib/house/scene.generated";
import type { ZoneLevels } from "@/lib/house/zones";
import type { HouseMember, HouseMoodBand } from "@/types/house";
import { Sparkles } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface HouseSceneProps {
  width: number;
  levels: ZoneLevels;
  members: HouseMember[];
  mood: HouseMoodBand;
  /** Tagonként a soron következő lejátszandó takarítás. */
  jobs: Record<number, HouseJob | undefined>;
  onJobDone: (userId: number, job: HouseJob) => void;
  /** A rendetlen zónára koppintva (a feladatokhoz visz). */
  onZonePress: (zone: HouseZone) => void;
  reducedMotion: boolean;
  dark: boolean;
}

/** Felvillanó csillogás a rendbe tett zónán. */
function SparkleBurst({ zone, scale }: { zone: HouseZone; scale: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withSequence(withTiming(1, { duration: 450 }), withTiming(2, { duration: 650 }));
  }, [progress]);
  const point = floorToImage(ZONE_SPOTS[zone]);
  const style = useAnimatedStyle(() => ({
    opacity: progress.value <= 1 ? progress.value : 2 - progress.value,
    transform: [{ scale: 0.6 + Math.min(progress.value, 1) * 0.6 }, { translateY: -progress.value * 10 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", left: point.u * scale - 16, top: point.v * scale - 70 * scale - 16, zIndex: 999 }, style]}
    >
      <Icon as={Sparkles} size={32} className="text-success-active" />
    </Animated.View>
  );
}

/**
 * A háztartás háza: a renderelt szoba, rá a zónák rendetlenség-rétegei (a szintnek megfelelően),
 * és a tagok állatai. A rendetlen zónára koppintva `onZonePress`.
 */
export function HouseScene({ width, levels, members, mood, jobs, onJobDone, onZonePress, reducedMotion, dark }: HouseSceneProps) {
  const { t } = useTranslation();
  const scale = width / ROOM_IMAGE.width;
  const height = ROOM_IMAGE.height * scale;
  const [sparkles, setSparkles] = useState<{ key: number; zone: HouseZone }[]>([]);
  const sparkleTimers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const timers = sparkleTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const finishJob = (userId: number, job: HouseJob) => {
    if (job.zone && !reducedMotion) {
      const zone = job.zone;
      setSparkles((current) => [...current, { key: job.id, zone }]);
      const timer = setTimeout(() => {
        sparkleTimers.current.delete(timer);
        setSparkles((current) => current.filter((s) => s.key !== job.id));
      }, 1200);
      sparkleTimers.current.add(timer);
    }
    onJobDone(userId, job);
  };

  return (
    <View style={{ width, height }}>
      <Image source={ROOM_IMAGE.source} style={{ position: "absolute", width, height }} accessibilityIgnoresInvertColors />

      {HOUSE_ZONES.map((zone) => {
        const level = levels[zone];
        if (level <= 0) return null;
        const layer = MESS_LAYERS[zone][Math.min(level, 3) - 1];
        return (
          <Animated.Image
            key={`${zone}-${level}`}
            entering={reducedMotion ? undefined : FadeIn.duration(400)}
            exiting={reducedMotion ? undefined : FadeOut.duration(800)}
            source={layer.source}
            style={{
              position: "absolute",
              left: layer.x * scale,
              top: layer.y * scale,
              width: layer.width * scale,
              height: layer.height * scale,
              zIndex: 1,
            }}
          />
        );
      })}

      {/* Koppintható terület a rendetlen zónákon (a legnagyobb réteg befoglaló téglalapja). */}
      {HOUSE_ZONES.map((zone) => {
        if (levels[zone] <= 0) return null;
        const area = MESS_LAYERS[zone][2];
        return (
          <Pressable
            key={`hit-${zone}`}
            accessibilityRole="button"
            accessibilityLabel={t(`house.zones.${zone}`)}
            onPress={() => onZonePress(zone)}
            style={{
              position: "absolute",
              left: area.x * scale,
              top: area.y * scale,
              width: area.width * scale,
              height: area.height * scale,
              zIndex: 2,
            }}
          />
        );
      })}

      {members.map((member, index) => (
        <HouseCharacter
          key={member.user_id}
          member={member}
          index={index}
          mood={mood}
          scale={scale}
          job={jobs[member.user_id] ?? null}
          onJobDone={(job) => finishJob(member.user_id, job)}
          reducedMotion={reducedMotion}
        />
      ))}

      {sparkles.map((sparkle) => (
        <SparkleBurst key={sparkle.key} zone={sparkle.zone} scale={scale} />
      ))}

      {/* Sötét témában esti fény. */}
      {dark && (
        <View
          pointerEvents="none"
          style={{ position: "absolute", width, height, zIndex: 1000, backgroundColor: "rgba(28, 30, 48, 0.24)" }}
        />
      )}
    </View>
  );
}
