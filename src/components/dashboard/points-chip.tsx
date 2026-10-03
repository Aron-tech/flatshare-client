import { Text } from "@/components/ui/text";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface PointsChipProps {
  /** The user's actual share of the points; null if there is no weighting. */
  points: number | null;
  /** Ennyien osztoznak a ponton. */
  claimers?: number;
}

/** Points actually earned for the task (shared, weighted, with the bonus recorded at claim time). */
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
