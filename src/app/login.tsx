import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/api/HttpClient";
import { OAuthProvider } from "@/types/auth";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const { login, authService } = useAuth();
  const [loading, setLoading] = useState(false);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "flatshare",
    path: "callback",
  });

  const handleLogin = useCallback(
    async (provider?: OAuthProvider) => {
      try {
        setLoading(true);
        const authUrl = authService.buildWorkOSAuthUrl(redirectUri, provider);

        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          redirectUri,
          {
            preferEphemeralSession: true,
          },
        );

        if (result.type !== "success" || !result.url) {
          return;
        }

        const parsedUrl = new URL(result.url);
        const code = parsedUrl.searchParams.get("code");
        if (!code) {
          throw new Error(t("login.noCode"));
        }

        const { token, user } = await authService.exchangeWorkOSCode(
          code,
          i18n.language,
        );
        await login(token, user);
      } catch (error) {
        if (error instanceof ApiError) return;
        const message =
          error instanceof Error ? error.message : t("login.unknownError");
        Alert.alert(t("login.errorTitle"), message);
      } finally {
        setLoading(false);
      }
    },
    [authService, login, redirectUri, t, i18n.language],
  );

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Text variant="h1" className="mb-8">
        {t("login.title")}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" className="text-primary" />
      ) : (
        <View className="w-full gap-3">
          <Button
            size="lg"
            variant="outline"
            onPress={() => handleLogin("GoogleOAuth")}
          >
            <Text>{t("login.google")}</Text>
          </Button>

          <Button
            size="lg"
            variant="secondary"
            onPress={() => handleLogin("AppleOAuth")}
          >
            <Text>{t("login.apple")}</Text>
          </Button>
        </View>
      )}
    </View>
  );
}
