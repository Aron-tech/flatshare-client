import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Elevation, MaxContentWidth } from "@/constants/theme";
import { cn } from "@/lib/utils";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { ChartColumn, House, ListChecks, type LucideIcon, Plus, Settings } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

const TAB_ICONS: Record<string, LucideIcon> = {
  index: House,
  chores: ListChecks,
  stats: ChartColumn,
  settings: Settings,
};

/** A tab bar magassága a safe area nélkül – a képernyők alsó paddingjéhez. */
export const TAB_BAR_HEIGHT = 84;

interface TabBarProps extends BottomTabBarProps {
  onAddPress: () => void;
}

/** DESIGN: lebegő, lekerekített alsó sáv középen kiemelt terrakotta "+" gombbal. */
export function TabBar({ state, descriptors, navigation, insets, onAddPress }: TabBarProps) {
  const { t } = useTranslation();
  const routes = state.routes.filter((route) => route.name in TAB_ICONS);
  const middle = Math.ceil(routes.length / 2);

  const renderTab = (route: (typeof routes)[number]) => {
    const index = state.routes.indexOf(route);
    const focused = state.index === index;
    const { options } = descriptors[route.key];
    const label = options.title ?? route.name;

    const onPress = () => {
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
    };

    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        role="tab"
        aria-selected={focused}
        accessibilityLabel={label}
        className="flex-1 items-center gap-1 py-1"
      >
        <Icon
          as={TAB_ICONS[route.name]}
          size={24}
          strokeWidth={focused ? 2.25 : 1.75}
          className={focused ? "text-primary" : "text-muted-foreground"}
        />
        <Text
          numberOfLines={1}
          className={cn("text-label-md", focused ? "text-primary" : "text-muted-foreground font-medium")}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View
      className="absolute bottom-0 left-0 right-0 items-center px-4"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      pointerEvents="box-none"
    >
      <View
        className="w-full flex-row items-center rounded-full border border-border bg-card px-2 py-2"
        style={[Elevation.level2, { maxWidth: MaxContentWidth }]}
        role="tablist"
      >
        {routes.slice(0, middle).map(renderTab)}
        <View className="w-20 items-center">
          <Pressable
            onPress={onAddPress}
            accessibilityRole="button"
            accessibilityLabel={t("tabs.add")}
            className="-mt-9 h-16 w-16 items-center justify-center rounded-full bg-primary active:bg-primary-active"
            style={{ boxShadow: "0px 10px 24px -6px rgba(198, 106, 77, 0.55)" }}
          >
            <Icon as={Plus} size={30} strokeWidth={2.5} className="text-primary-foreground" />
          </Pressable>
        </View>
        {routes.slice(middle).map(renderTab)}
      </View>
    </View>
  );
}
