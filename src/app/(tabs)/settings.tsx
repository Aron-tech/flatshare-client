import { TabScreen } from "@/components/screen";
import { UserAvatar } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { activeHousehold } = useHousehold();
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <TabScreen>
      <Text className="text-headline-lg">{t("menu.settings")}</Text>

      <View className="flex-row items-center gap-4 rounded-card bg-card p-5" style={Elevation.level1}>
        <UserAvatar size={56} />
        <View className="flex-1">
          <Text className="text-body-lg font-semibold">
            {user?.first_name} {user?.last_name}
          </Text>
          <Text variant="muted">{user?.email}</Text>
        </View>
      </View>

      <View className="gap-3 rounded-card bg-card p-5" style={Elevation.level1}>
        <Text className="text-label-md uppercase text-muted-foreground">{t("settings.household")}</Text>
        <Text className="text-headline-sm">{activeHousehold?.name ?? t("home.noHousehold")}</Text>
        <Button variant="secondary" onPress={() => router.push("/household-switch")}>
          <Text>{t("home.switchHousehold")}</Text>
        </Button>
      </View>

      <Button size="lg" variant="destructive" onPress={logout} accessibilityLabel={t("home.logout")}>
        <Text>{t("home.logout")}</Text>
      </Button>
    </TabScreen>
  );
}
