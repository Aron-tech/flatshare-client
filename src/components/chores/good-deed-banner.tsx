import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { HandHeart, ListPlus } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

/** "Unlisted good deed" – ad-hoc feladat naplózása (a funkció még nincs bekötve). */
export function GoodDeedBanner({ onLog }: { onLog: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center gap-3 rounded-card border border-border bg-muted p-4">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-success-soft">
        <Icon as={HandHeart} size={24} className="text-success-active" />
      </View>
      <View className="flex-1">
        <Text className="text-label-lg">{t("chores.goodDeedTitle")}</Text>
        <Text variant="muted">{t("chores.goodDeedText")}</Text>
      </View>
      <Button size="sm" variant="success" onPress={onLog}>
        <Icon as={ListPlus} size={14} className="text-success-foreground" />
        <Text>{t("chores.log")}</Text>
      </Button>
    </View>
  );
}
