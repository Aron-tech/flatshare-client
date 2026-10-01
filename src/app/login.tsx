import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/services/api/HttpClient";
import { OAuthProvider } from "@/types/auth";
import * as AppleAuthentication from "expo-apple-authentication";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useColorScheme } from "nativewind";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Platform, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { t, i18n } = useTranslation();
  const { login, authService } = useAuth();
  const { colorScheme } = useColorScheme();
  const [loading, setLoading] = useState(false);
  // iOS-en a natív Apple ablakot kell használni (App Review 4.8), máshol a WorkOS webes loginja marad.
  const [nativeAppleAvailable, setNativeAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    AppleAuthentication.isAvailableAsync().then(setNativeAppleAvailable);
  }, []);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "flatshare",
    path: "callback",
  });

  const showError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError) return;
      const message =
        error instanceof Error ? error.message : t("login.unknownError");
      Alert.alert(t("login.errorTitle"), message);
    },
    [t],
  );

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
        showError(error);
      } finally {
        setLoading(false);
      }
    },
    [authService, login, redirectUri, t, i18n.language, showError],
  );

  const handleNativeAppleLogin = useCallback(async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken || !credential.authorizationCode) {
        throw new Error(t("login.noCode"));
      }

      setLoading(true);
      const { token, user } = await authService.authenticateWithApple(
        {
          identityToken: credential.identityToken,
          authorizationCode: credential.authorizationCode,
          firstName: credential.fullName?.givenName ?? null,
          lastName: credential.fullName?.familyName ?? null,
        },
        i18n.language,
      );
      await login(token, user);
    } catch (error) {
      if ((error as { code?: string })?.code === "ERR_REQUEST_CANCELED") return;
      showError(error);
    } finally {
      setLoading(false);
    }
  }, [authService, login, t, i18n.language, showError]);

  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Text variant="h1" className="mb-8">
        {t("login.title")}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" className="text-primary" />
      ) : (
        <View className="w-full gap-3">
          {nativeAppleAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={
                colorScheme === "dark"
                  ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                  : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={12}
              style={{ width: "100%", height: 48 }}
              onPress={handleNativeAppleLogin}
            />
          ) : (
            <Button
              size="lg"
              variant="secondary"
              onPress={() => handleLogin("AppleOAuth")}
            >
              <Text>{t("login.apple")}</Text>
            </Button>
          )}

          <Button
            size="lg"
            variant="outline"
            onPress={() => handleLogin("GoogleOAuth")}
          >
            <Text>{t("login.google")}</Text>
          </Button>
        </View>
      )}
    </View>
  );
}
