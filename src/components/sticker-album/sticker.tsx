import { resolveCategoryIcon } from "@/components/category-icon";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useEffect, useId } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from "react-native-svg";

export type StickerTier = "bronze" | "silver" | "gold" | "legendary";

interface TierStyle {
  /** A rozetta színátmenete (holo matricánál szivárvány). */
  stops: string[];
  /** A belső korong színe. */
  inner: string;
  /** Ikon és felirat színe. */
  ink: string;
  ribbon: string;
}

const TIERS: Record<StickerTier, TierStyle> = {
  bronze: { stops: ["#E3A677", "#B8743F", "#8E5230"], inner: "#FBEADC", ink: "#7A4424", ribbon: "#9A5A33" },
  silver: { stops: ["#F4F6F8", "#BCC3CC", "#8D96A1"], inner: "#FFFFFF", ink: "#4C5563", ribbon: "#6F7885" },
  gold: { stops: ["#FFE9A3", "#E7B84A", "#B98522"], inner: "#FFF8E1", ink: "#8A5D0B", ribbon: "#B07A16" },
  legendary: {
    stops: ["#F9A8D4", "#C4B5FD", "#93C5FD", "#86EFAC", "#FDE68A", "#FDBA74"],
    inner: "#FFFFFF",
    ink: "#6D28D9",
    ribbon: "#7C3AED",
  },
};

export type StickerAppear = "static" | "hidden" | "animate";

const TIER_ORDER: StickerTier[] = ["bronze", "silver", "gold", "legendary"];

/** A mérföldkő helye a sorban adja a szintet: 1. bronz, 2. ezüst, 3. arany, 4. legendás. */
export function stickerTier(milestone: number, milestones: number[]): StickerTier {
  const index = Math.max(0, milestones.indexOf(milestone));
  return TIER_ORDER[Math.min(index, TIER_ORDER.length - 1)];
}

/** Stabil, enyhe dőlés (−6…6 fok), mintha kézzel ragasztották volna be. */
export function stickerTilt(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return Math.round((x - Math.floor(x)) * 12 - 6);
}

/** Csipkés szélű rozetta (a matrica kivágott formája) egy 100×100-as nézetben. */
function rosettePath(radius: number, scallops = 18): string {
  const center = 50;
  const base = radius * 0.92;
  const bulge = radius * 1.08;
  const point = (r: number, angle: number) =>
    `${(center + r * Math.cos(angle)).toFixed(2)} ${(center + r * Math.sin(angle)).toFixed(2)}`;

  let d = `M ${point(base, 0)}`;
  for (let i = 0; i < scallops; i++) {
    const mid = ((i + 0.5) / scallops) * Math.PI * 2;
    const end = ((i + 1) / scallops) * Math.PI * 2;
    d += ` Q ${point(bulge, mid)} ${point(base, end)}`;
  }
  return `${d} Z`;
}

const OUTER = rosettePath(46);
const INNER = rosettePath(40);

interface StickerProps {
  milestone: number;
  tier: StickerTier;
  categoryHints: (string | null | undefined)[];
  size?: number;
  /** Fok; a beragasztott matrica enyhén ferde. */
  tilt?: number;
  /**
   * `static`: a helyén van; `hidden`: még nem ragasztották be (új matrica, az oldal nem látszik);
   * `animate`: most kerül fel ("rácsapás").
   */
  appear?: StickerAppear;
  /** Az animáció késleltetése (ms), hogy egy oldalon egymás után kerüljenek fel. */
  delay?: number;
}

/** Egy megszerzett matrica: fehér kivágott szél, szint szerinti csillogó rozetta, a kategória ikonja és a mérföldkő. */
export function Sticker({ milestone, tier, categoryHints, size = 112, tilt = 0, appear = "static", delay = 0 }: StickerProps) {
  const style = TIERS[tier];
  const gradientId = `sticker-${useId().replace(/:/g, "")}`;

  const scale = useSharedValue(1);
  const rotate = useSharedValue(tilt);
  const opacity = useSharedValue(appear === "static" ? 1 : 0);

  useEffect(() => {
    if (appear === "hidden") {
      opacity.value = 0;
    } else if (appear === "animate") {
      // Nagyban, elforgatva indul, és rugósan a helyére "csapódik".
      const instant = { duration: 0 };
      opacity.value = withSequence(withTiming(0, instant), withDelay(delay, withTiming(1, { duration: 180 })));
      scale.value = withSequence(
        withTiming(1.8, instant),
        withDelay(delay, withSequence(withSpring(0.92, { damping: 9, stiffness: 180 }), withSpring(1)))
      );
      rotate.value = withSequence(
        withTiming(tilt - 25, instant),
        withDelay(delay, withSpring(tilt, { damping: 10, stiffness: 120 }))
      );
    }
  }, [appear, delay, tilt, opacity, scale, rotate]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  const iconSize = Math.round(size * 0.3);
  const ribbonHeight = Math.max(18, Math.round(size * 0.2));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          shadowColor: "#2C2B29",
          shadowOpacity: 0.22,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
          elevation: 4,
        },
        animatedStyle,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            {style.stops.map((color, index) => (
              <Stop key={color} offset={index / (style.stops.length - 1)} stopColor={color} />
            ))}
          </LinearGradient>
        </Defs>
        <Path d={OUTER} fill="#FFFFFF" />
        <Path d={INNER} fill={`url(#${gradientId})`} />
        <Circle cx={50} cy={50} r={27} fill={style.inner} />
        <Circle cx={50} cy={50} r={27} fill="none" stroke={style.ribbon} strokeOpacity={0.35} strokeWidth={1.5} />
        {/* Fényes csillanás a bal felső részen. */}
        <Ellipse cx={36} cy={30} rx={16} ry={8} fill="#FFFFFF" opacity={0.45} transform="rotate(-35 36 30)" />
      </Svg>

      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <Icon as={resolveCategoryIcon(...categoryHints)} size={iconSize} color={style.ink} strokeWidth={2} />
      </View>

      <View
        pointerEvents="none"
        className="absolute items-center justify-center rounded-full"
        style={{
          left: size * 0.22,
          right: size * 0.22,
          bottom: size * 0.04,
          height: ribbonHeight,
          backgroundColor: style.ribbon,
          borderWidth: 2,
          borderColor: "#FFFFFF",
        }}
      >
        <Text
          className="font-bold text-white"
          style={{ fontSize: Math.round(ribbonHeight * 0.6), lineHeight: Math.round(ribbonHeight * 0.8) }}
        >
          {milestone}×
        </Text>
      </View>
    </Animated.View>
  );
}
