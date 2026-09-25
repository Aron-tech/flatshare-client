import { AuthProvider, useAuth } from "@/context/AuthContext";
import { HouseholdProvider, useHousehold } from "@/context/HouseholdContext";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { ToastHost } from "@/components/ui/toast";
import { useNavTheme } from "@/hooks/use-theme";
import { useApplyStoredTheme } from "@/hooks/use-theme-preference";
import { FONT_ASSETS } from "@/theme/fonts";
import { PortalHost } from "@rn-primitives/portal";
import { useFonts } from "expo-font";
import { Stack, ThemeProvider, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "../../global.css";

SplashScreen.preventAutoHideAsync();

function RootNavigation() {
  const { token, isLoading: authLoading } = useAuth();
  const {
    households,
    activeHousehold,
    isLoading: householdLoading,
  } = useHousehold();
  const segments = useSegments();
  const router = useRouter();

  usePushNotifications();

  const isGlobalLoading = authLoading || (!!token && householdLoading);

  useEffect(() => {
    if (isGlobalLoading) return;

    const currentSegment = segments[0] as string | undefined;
    const inAuthGroup = currentSegment === "login";
    const inSetup = currentSegment === "household-setup";
    const inSwitch = currentSegment === "household-switch";

    if (!token && !inAuthGroup) {
      router.replace("/login");
    } else if (token) {
      if (households.length === 0 && !inSetup) {
        router.replace("/household-setup");
      } else if (households.length > 0 && !activeHousehold && !inSwitch) {
        router.replace("/household-switch");
      } else if (activeHousehold && inAuthGroup) {
        router.replace("/");
      }
    }
  }, [token, households, activeHousehold, isGlobalLoading, segments, router]);

  if (isGlobalLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" className="text-primary" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" options={{ gestureEnabled: false }} />
        <Stack.Screen
          name="household-setup"
          options={{ gestureEnabled: households.length > 0 }}
        />
        <Stack.Screen
          name="household-switch"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="add-task" options={{ presentation: "modal" }} />
        <Stack.Screen name="log-task" options={{ presentation: "modal" }} />
        <Stack.Screen name="reward-form" options={{ presentation: "modal" }} />
      </Stack>
      <PortalHost />
      <ToastHost />
    </>
  );
}

export default function RootLayout() {
  const navTheme = useNavTheme();
  useApplyStoredTheme();
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider value={navTheme}>
      <AuthProvider>
        <HouseholdProvider>
          <StatusBar style="auto" />
          <RootNavigation />
        </HouseholdProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
