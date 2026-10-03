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

/** Horizontal wavelength of the wave pattern (px); one full cycle shifts the pattern by this much, seamlessly. */
const WAVE_PERIOD = 34;

/**
 * Smooth, rounded wave curve (open SVG path starting with `M`): one cubic Bézier control point pulled to
 * the crest/trough per half period gives a real rounded sine effect (straight segments looked angular).
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
  /** Total bar width (the layer always draws this plus one period, the parent clips it to the visible part). */
  width: number;
  height: number;
  midline: number;
  amplitude: number;
  color: string;
  opacity: number;
  /** Duration of one loop (ms) – the two layers run at different speeds, which makes it feel like real waves. */
  duration: number;
  reverse?: boolean;
  crestFirst?: boolean;
  /** Bright "crest line" on top of the wave – at low bar heights the motion would be barely visible without it. */
  foam?: boolean;
}

/**
 * One wave layer: the pattern is drawn across the full width (and one period more), then slid by an endless
 * linear `translateX` – the curve never has to be recomputed, only the compositor moves it.
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

/** A tiny sailboat riding the waves at the current end of the progress – "this is what we are collecting now". */
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
  /** Fill color (category color or primary). */
  tint: string;
  /** Color of the unfilled part (bar background). */
  trackColor: string;
  /** Two wave layers + the sailboat riding at the end of the progress; when off, the plain bar remains. */
  animated?: boolean;
  height?: number;
}

/**
 * Progress bar for the sticker in progress in the album: the fill ripples with two wave layers of different
 * speed and phase, with a tiny sailboat at the end. The fill width follows the progress with a spring
 * (`withSpring`), it never jumps. When off it is a plain static bar (no sailboat or waves).
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
