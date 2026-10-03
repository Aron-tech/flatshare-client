import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { HouseMoodBand } from "@/types/house";
import { House } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

/** A Ház nézet megnyitása; a színe a ház hangulatát jelzi (zsálya: rendben, terrakotta: baj van). */
export function HouseButton({ band, onPress }: { band: HouseMoodBand | null; onPress: () => void }) {
  const { t } = useTranslation();
  const troubled = band === "grumpy" || band === "sad";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={band ? `${t("house.open")}: ${t(`house.mood.${band}.title`)}` : t("house.open")}
      onPress={onPress}
      className={cn(
        "h-14 w-14 items-center justify-center rounded-full active:opacity-80",
        troubled ? "bg-primary-soft" : "bg-success-soft"
      )}
    >
      <Icon as={House} size={26} className={troubled ? "text-primary" : "text-success-active"} />
      {troubled && <View className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-background bg-primary" />}
    </Pressable>
  );
}
