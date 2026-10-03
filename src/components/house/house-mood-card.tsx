import { Icon } from "@/components/ui/icon";
import { Progress } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import type { HouseMood, HouseMoodBand } from "@/types/house";
import { Frown, Heart, Meh, Smile, type LucideIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

const BAND_STYLE: Record<HouseMoodBand, { icon: LucideIcon; badge: string; icon_color: string; bar: string }> = {
  happy: { icon: Heart, badge: "bg-success-soft", icon_color: "text-success-active", bar: "bg-success" },
  content: { icon: Smile, badge: "bg-success-soft", icon_color: "text-success-active", bar: "bg-success" },
  grumpy: { icon: Meh, badge: "bg-primary-soft", icon_color: "text-primary", bar: "bg-primary" },
  sad: { icon: Frown, badge: "bg-primary-soft", icon_color: "text-primary", bar: "bg-primary" },
};

/** A ház közös hangulata és ami rontja (rendetlen zónák, függő büntetések, tempó). */
export function HouseMoodCard({ mood, messyZones }: { mood: HouseMood; messyZones: number }) {
  const { t } = useTranslation();
  const style = BAND_STYLE[mood.band];
  const reasons = [
    messyZones > 0 ? t("house.reasons.mess", { count: messyZones }) : null,
    mood.pending_penalties > 0 ? t("house.reasons.penalties", { count: mood.pending_penalties }) : null,
    mood.behind_pace ? t("house.reasons.behindPace") : null,
  ].filter((reason): reason is string => reason !== null);

  return (
    <View className="gap-4 rounded-card bg-card p-5" style={Elevation.level1}>
      <View className="flex-row items-center gap-4">
        <View className={`h-12 w-12 items-center justify-center rounded-full ${style.badge}`}>
          <Icon as={style.icon} size={22} className={style.icon_color} />
        </View>
        <Text className="flex-1 text-headline-sm">{t(`house.mood.${mood.band}.title`)}</Text>
        <Text className="text-headline-md" accessibilityLabel={t("house.moodScore", { score: mood.score })}>
          {mood.score}
        </Text>
      </View>
      <Text className="text-body-md text-muted-foreground">{t(`house.mood.${mood.band}.body`)}</Text>
      <Progress value={mood.score} indicatorClassName={style.bar} />
      {reasons.length > 0 && (
        <View className="gap-1">
          {reasons.map((reason) => (
            <Text key={reason} className="text-body-sm text-muted-foreground">
              • {reason}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}
