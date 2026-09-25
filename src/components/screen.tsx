import { AppHeader } from "@/components/app-header";
import { TAB_BAR_HEIGHT } from "@/components/tab-bar";
import { Gutter, MaxContentWidth } from "@/constants/theme";
import { useThemeColors } from "@/hooks/use-theme";
import type { ReactNode } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

interface TabScreenProps {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}

/** Tab képernyő váz: fejléc, görgethető tartalom, hely a lebegő tab barnak. */
export function TabScreen({ children, refreshing = false, onRefresh }: TabScreenProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 flex-row justify-center bg-background">
      <SafeAreaView edges={["top"]} className="w-full flex-1" style={{ maxWidth: MaxContentWidth }}>
        <View style={{ paddingHorizontal: Gutter }}>
          <AppHeader />
        </View>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: Gutter,
            paddingTop: 8,
            paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 32,
            gap: 24,
          }}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
