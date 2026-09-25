import { TabBar } from "@/components/tab-bar";
import { useRouter } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <TabBar {...props} onAddPress={() => router.push("/log-task")} />
      )}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.home") }} />
      <Tabs.Screen name="chores" options={{ title: t("tabs.chores") }} />
      <Tabs.Screen name="stats" options={{ title: t("tabs.stats") }} />
      <Tabs.Screen name="rewards" options={{ title: t("tabs.rewards") }} />
      <Tabs.Screen name="settings" options={{ title: t("tabs.settings") }} />
    </Tabs>
  );
}
