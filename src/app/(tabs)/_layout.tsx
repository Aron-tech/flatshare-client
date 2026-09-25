import { TabBar } from "@/components/tab-bar";
import { showToast } from "@/lib/toast";
import { Tabs } from "expo-router/js-tabs";
import { useTranslation } from "react-i18next";

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        // Az "Add Task" képernyő még nincs kész.
        <TabBar {...props} onAddPress={() => showToast(t("tabs.addComingSoon"))} />
      )}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.home") }} />
      <Tabs.Screen name="chores" options={{ title: t("tabs.chores") }} />
      <Tabs.Screen name="stats" options={{ title: t("tabs.stats") }} />
      <Tabs.Screen name="settings" options={{ title: t("tabs.settings") }} />
    </Tabs>
  );
}
