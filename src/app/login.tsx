import * as AuthSession from "expo-auth-session";
import * as Localization from "expo-localization";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";
import { Button } from "../components/ui/button";
import { Text } from "../components/ui/text";
import { useAuth } from "../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

const WORKOS_CLIENT_ID = "client_01M23QN0EFT8XFXCHDR0PS4Z6B";
const BACKEND_URL = "http://192.168.0.39:8000/api";

export default function LoginScreen() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "flatshare",
    path: "callback",
  });

  const handleLogin = async (provider?: "GoogleOAuth" | "AppleOAuth") => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        client_id: WORKOS_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: "code",
        ...(provider ? { provider } : {}),
      });

      const authUrl = `https://api.workos.com/user_management/authorize?${params.toString()}`;

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
        {
          preferEphemeralSession: true,
        }
      );

      if (result.type === "success" && result.url) {
        const parsedUrl = new URL(result.url);
        const code = parsedUrl.searchParams.get("code");

        if (!code) {
          throw new Error("Nem érkezett authorization code");
        }

        const deviceLanguage =
          Localization.getLocales()[0]?.languageCode?.toLowerCase() || "hu";

        const res = await fetch(`${BACKEND_URL}/auth/workos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            code,
            language: deviceLanguage,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.error || data.message || "Sikertelen bejelentkezés a szerveren"
          );
        }

        await login(data.token, data.user);
      }
    } catch (error: any) {
      Alert.alert("Hiba", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center p-6 bg-background">
      <Text className="text-3xl font-bold tracking-tight mb-8 text-foreground">
        FlatShare Bejelentkezés
      </Text>

      {loading ? (
        <ActivityIndicator size="large" className="text-primary" />
      ) : (
        <View className="w-full gap-3">
          <Button size="lg" variant="default" onPress={() => handleLogin()}>
            <Text className="font-semibold">Folytatás WorkOS fiókkal</Text>
          </Button>

          <Button
            size="lg"
            variant="outline"
            onPress={() => handleLogin("GoogleOAuth")}
          >
            <Text className="font-semibold">Bejelentkezés Google-lel</Text>
          </Button>

          <Button
            size="lg"
            variant="secondary"
            onPress={() => handleLogin("AppleOAuth")}
          >
            <Text className="font-semibold">Bejelentkezés Apple-lel</Text>
          </Button>
        </View>
      )}
    </View>
  );
}
