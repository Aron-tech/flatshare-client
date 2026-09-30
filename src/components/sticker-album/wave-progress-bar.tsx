import { Icon } from "@/components/ui/icon";
import { Sailboat } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { type LayoutChangeEvent, View } from "react-native";
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

/** A hullámminta vízszintes hullámhossza (px); egy teljes kör ennyivel tolja el a mintát, varratmentesen. */
const WAVE_PERIOD = 34;

/**
 * Sima, kerekded hullámgörbe (nyitott SVG path, `M`-mel kezdve): félperiódusonként egyetlen, a
 * csúcsra/völgybe húzott kubikus Bézier-vezérlőponttal – ez ad valódi, lekerekített szinusz-hatást
 * (nem a sok egyenes szakaszból álló, szögletes vonalat, ami korábban nem nézett ki jól).
 */
function waveCurve(width: number, midline: number, amplitude: number, crestFirst: boolean): string {
  const half = WAVE_PERIOD / 2;
  let d = `M 0 ${midline.toFixed(1)}`;
  let crest = crestFirst;
  for (let x = 0; x < width; x += half) {
    const peakY = (crest ? midline - amplitude : midline + amplitude).toFixed(1);
    const controlX = (x + half / 2).toFixed(1);
    const nextX = Math.min(x + half, width).toFixed(1);
    d += ` C ${controlX} ${peakY} ${controlX} ${peakY} ${nextX} ${midline.toFixed(1)}`;
    crest = !crest;
  }
  return d;
}

interface WaveLayerProps {
  /** A sáv teljes szélessége (a réteg mindig ennyi + egy periódus szélesre rajzol, a szülő vágja a láthatóra). */
  width: number;
  height: number;
  midline: number;
  amplitude: number;
  color: string;
  opacity: number;
  /** Egy hurok ideje (ms) – a két réteg más sebességgel fut, ettől érződik igazi hullámzásnak. */
  duration: number;
  reverse?: boolean;
  crestFirst?: boolean;
  /** Fényes "tarajvonal" a hullám tetején – alacsony sávmagasságnál enélkül alig látszana a mozgás. */
  foam?: boolean;
}

/**
 * Egy hullámréteg: a mintázat a teljes szélességre (és egy periódussal tovább) megrajzolva,
 * majd végtelenített, lineáris `translateX`-szel csúsztatva – így a görbét sosem kell újraszámolni,
 * csak a kompozitor tolja, ez indokolja a sima, akadásmentes mozgást natív száldeon is.
 */
function WaveLayer({
  width,
  height,
  midline,
  amplitude,
  color,
  opacity,
  duration,
  reverse = false,
  crestFirst = true,
  foam = false,
}: WaveLayerProps) {
  const svgWidth = width + WAVE_PERIOD;
  const curve = useMemo(
    () => waveCurve(svgWidth, midline, amplitude, crestFirst),
    [svgWidth, midline, amplitude, crestFirst]
  );
  const fillPath = `${curve} L ${svgWidth.toFixed(1)} ${height} L 0 ${height} Z`;
  const loop = useSharedValue(0);

  useEffect(() => {
    loop.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
  }, [duration, loop]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: (reverse ? 1 : -1) * loop.value * WAVE_PERIOD }],
  }));

  return (
    <Animated.View style={[{ position: "absolute", top: 0, left: 0, width: svgWidth, height }, style]}>
      <Svg width={svgWidth} height={height}>
        <Path d={fillPath} fill={color} opacity={opacity} />
        {foam && <Path d={curve} fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={1.4} strokeLinecap="round" />}
      </Svg>
    </Animated.View>
  );
}

/** Aprócska vitorlás, ami a haladás jelenlegi végén lovagolja a hullámokat – "ezt gyűjtjük épp". */
function SeaBuoy({ x, tint, size }: { x: SharedValue<number>; tint: string; size: number }) {
  const bob = useSharedValue(0);
  const rock = useSharedValue(0);

  useEffect(() => {
    bob.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }), -1, true);
    rock.value = withRepeat(withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [bob, rock]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value - size / 2 },
      { translateY: (bob.value - 0.5) * size * 0.3 },
      { rotate: `${(rock.value - 0.5) * 14}deg` },
    ],
  }));

  return (
    <Animated.View style={[{ position: "absolute", top: 0, left: 0 }, style]}>
      <Icon as={Sailboat} size={size} color={tint} strokeWidth={2.25} />
    </Animated.View>
  );
}

interface WaveProgressBarProps {
  /** 0–1. */
  progress: number;
  /** A kitöltés színe (kategória szín vagy elsődleges). */
  tint: string;
  /** A ki nem töltött rész (sáv háttér) színe. */
  trackColor: string;
  /** Két hullámréteg + a haladás végén lovagló vitorlás; kikapcsolva a megszokott sima sáv marad. */
  animated?: boolean;
  height?: number;
}

/**
 * Haladássáv a matricaalbum folyamatban lévő matricájához: a kitöltés két, eltérő sebességű és
 * fázisú hullámréteggel ténylegesen hullámzik (nem csak sávozott minta), a végén egy apró vitorlás
 * lovagolja a habokat, jelezve, hogy éppen ott tartunk. A kitöltés szélessége rugalmasan (`withSpring`)
 * követi a haladást, sosem ugrik. Kikapcsolva sima, statikus sáv (a vitorlás és a hullámok nélkül).
 */
export function WaveProgressBar({ progress, tint, trackColor, animated = true, height = 10 }: WaveProgressBarProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const clamped = Math.min(1, Math.max(0, progress));
  const targetWidth = Math.round(trackWidth * clamped);
  const boatSize = Math.round(height * 1.9);

  const fillWidth = useSharedValue(targetWidth);
  useEffect(() => {
    fillWidth.value = withSpring(targetWidth, { damping: 16, stiffness: 110, mass: 0.6 });
  }, [targetWidth, fillWidth]);

  const waterStyle = useAnimatedStyle(() => ({ width: fillWidth.value }));

  const onLayout = (event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width);

  const midline = height * 0.42;

  return (
    <View style={{ paddingTop: animated ? boatSize * 0.55 : 0 }}>
      <View onLayout={onLayout} className="w-full overflow-hidden rounded-full" style={{ height, backgroundColor: trackColor }}>
        <Animated.View style={[{ height, overflow: "hidden" }, waterStyle]}>
          {animated ? (
            <>
              <WaveLayer
                width={trackWidth}
                height={height}
                midline={midline}
                amplitude={height * 0.18}
                color={tint}
                opacity={0.3}
                duration={4200}
                crestFirst={false}
              />
              <WaveLayer
                width={trackWidth}
                height={height}
                midline={midline}
                amplitude={height * 0.3}
                color={tint}
                opacity={1}
                duration={2300}
                reverse
                foam
              />
            </>
          ) : (
            <View style={{ width: "100%", height, backgroundColor: tint }} />
          )}
        </Animated.View>
      </View>
      {animated && targetWidth > boatSize * 0.5 && <SeaBuoy x={fillWidth} tint={tint} size={boatSize} />}
    </View>
  );
}
