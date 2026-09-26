import { useThemeColors } from "@/hooks/use-theme";
import { Text } from "@/components/ui/text";
import Svg, { Circle } from "react-native-svg";
import { View } from "react-native";

interface CycleRingProps {
  value: number;
  target: number;
  size?: number;
}

/** Ciklus-gyűrű: középen az összpont, alatta a százalék. */
export function CycleRing({ value, target, size = 112 }: CycleRingProps) {
  const colors = useThemeColors();
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.secondaryActive} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference * (1 - percent / 100)}
        />
      </Svg>
      <Text className="text-headline-lg">{value}</Text>
      <Text variant="muted">{percent}%</Text>
    </View>
  );
}
