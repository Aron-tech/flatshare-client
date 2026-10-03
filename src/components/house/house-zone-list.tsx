import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import type { HouseZone, RoomKey } from "@/lib/house/scene.generated";
import type { ZoneSummary } from "@/lib/house/zones";
import { cn } from "@/lib/utils";
import { Bath, ChevronRight, Shirt, ShoppingCart, Sparkles, SprayCan, Trash2, Utensils, type LucideIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

export const ZONE_ICONS: Record<HouseZone, LucideIcon> = {
  kitchen: Utensils,
  cleaning: SprayCan,
  trash: Trash2,
  laundry: Shirt,
  shopping: ShoppingCart,
  bathroom: Bath,
};

/** Text state of the zones (also the accessible counterpart of the image). Tapping leads to the tasks. */
interface HouseZoneListProps {
  summaries: ZoneSummary[];
  /** Which built room the zone is in (the main room has no label). */
  zoneRooms?: Partial<Record<HouseZone, RoomKey>>;
  onPress: () => void;
}

export function HouseZoneList({ summaries, zoneRooms, onPress }: HouseZoneListProps) {
  const { t } = useTranslation();

  const status = (summary: ZoneSummary) => {
    if (summary.overdue > 0) return t("house.status.overdue", { count: summary.overdue });
    if (summary.dueToday > 0) return t("house.status.dueToday", { count: summary.dueToday });
    return t("house.status.open", { count: summary.open });
  };

  return (
    <View className="overflow-hidden rounded-card bg-card" style={Elevation.level1}>
      {summaries.map((summary, index) => (
        <Pressable
          key={summary.zone ?? "other"}
          accessibilityRole="button"
          onPress={onPress}
          className={cn(
            "flex-row items-center gap-3 px-5 py-4 active:bg-secondary",
            index > 0 && "border-t border-border"
          )}
        >
          <View
            className={cn(
              "h-10 w-10 items-center justify-center rounded-full",
              summary.level >= 2 ? "bg-primary-soft" : "bg-secondary"
            )}
          >
            <Icon
              as={summary.zone ? ZONE_ICONS[summary.zone] : Sparkles}
              size={18}
              className={summary.level >= 2 ? "text-primary" : "text-muted-foreground"}
            />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-body-lg font-medium">
              {t(`house.zones.${summary.zone ?? "other"}`)}
              {summary.zone && zoneRooms?.[summary.zone] && zoneRooms[summary.zone] !== "main" && (
                <Text className="text-body-sm text-muted-foreground">
                  {"  ·  "}
                  {t(`house.rooms.names.${zoneRooms[summary.zone]}`)}
                </Text>
              )}
            </Text>
            <Text className={cn("text-body-sm", summary.overdue > 0 ? "text-primary" : "text-muted-foreground")}>
              {status(summary)}
            </Text>
          </View>
          <View className="flex-row gap-1" accessibilityLabel={t("house.messLevel", { level: summary.level })}>
            {[1, 2, 3].map((dot) => (
              <View
                key={dot}
                className={cn("h-2 w-2 rounded-full", dot <= summary.level ? "bg-primary" : "bg-secondary-active")}
              />
            ))}
          </View>
          <Icon as={ChevronRight} size={16} className="text-muted-foreground" />
        </Pressable>
      ))}
    </View>
  );
}
