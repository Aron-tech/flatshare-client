import { Text } from "@/components/ui/text";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface PointsChipProps {
  /** A user ténylegesen járó része a pontból; null, ha nincs súlyozás. */
  points: number | null;
  /** Ennyien osztoznak a ponton. */
  claimers?: number;
}

/** A feladatért ténylegesen járó pont (megosztva, súllyal, a vállaláskor rögzített bónusszal). */
export function PointsChip({ points, claimers = 1 }: PointsChipProps) {
  const { t } = useTranslation();

  return (
    <View className="rounded-full bg-success-soft px-2.5 py-0.5">
      <Text className="text-label-md text-success-soft-foreground">
        {points === null
          ? t("dashboard.noPoints")
          : claimers > 1
            ? t("dashboard.sharedPoints", { count: points, people: claimers })
            : t("dashboard.plusPoints", { count: points })}
      </Text>
    </View>
  );
}
