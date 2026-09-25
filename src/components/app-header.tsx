import { Emblem } from "@/components/brand/emblem";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { UserMenu } from "@/components/user-menu";
import { useHousehold } from "@/context/HouseholdContext";
import { useRouter } from "expo-router";
import { ChevronDown } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

/** Közös fejléc: embléma, háztartásváltó pill, profil. */
export function AppHeader() {
  const { t } = useTranslation();
  const { activeHousehold } = useHousehold();
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-between gap-3 py-3">
      <View className="flex-1 flex-row items-center gap-2">
        <View className="h-11 w-11 items-center justify-center rounded-input bg-card">
          <Emblem size={30} />
        </View>
        <Pressable
          onPress={() => router.push("/household-switch")}
          accessibilityRole="button"
          accessibilityLabel={t("home.switchHousehold")}
          className="shrink flex-row items-center gap-1.5 rounded-full bg-secondary py-2.5 pl-4 pr-3 active:bg-secondary-active"
        >
          <Text className="shrink text-label-lg" numberOfLines={1}>
            {activeHousehold?.name ?? t("home.noHousehold")}
          </Text>
          <Icon as={ChevronDown} size={18} />
        </Pressable>
      </View>
      <UserMenu />
    </View>
  );
}
