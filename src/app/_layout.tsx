import { AppearanceProvider } from "@/context/AppearanceContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { HouseholdProvider, useHousehold } from "@/context/HouseholdContext";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { ToastHost } from "@/components/ui/toast";
import { useNavTheme } from "@/hooks/use-theme";
import { useApplyStoredTheme } from "@/hooks/use-theme-preference";
import { queryClient } from "@/lib/query-client";
import { PortalHost } from "@rn-primitives/portal";
import { QueryClientProvider } from "@tanstack/react-query";
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
        <Stack.Screen name="member-departures" options={{ presentation: "modal" }} />
      </Stack>
      <PortalHost />
      <ToastHost />
    </>
  );
}

function AppShell() {
  const navTheme = useNavTheme();
  useApplyStoredTheme();

  return (
    <ThemeProvider value={navTheme}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <HouseholdProvider>
            <StatusBar style="auto" />
            <RootNavigation />
          </HouseholdProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

const hideSplash = () => SplashScreen.hideAsync();

export default function RootLayout() {
  // A tárolt kinézet (paletta, font, ikonkészlet) betöltéséig a splash marad.
  return (
    <AppearanceProvider onReady={hideSplash}>
      <AppShell />
    </AppearanceProvider>
  );
}
