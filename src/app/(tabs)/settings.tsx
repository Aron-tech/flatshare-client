import { TabScreen } from "@/components/screen";
import { UserAvatar } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip-group";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Text } from "@/components/ui/text";
import { Config } from "@/config/env";
import { Elevation } from "@/constants/theme";
import { SUPPORTED_LANGUAGES, type AppLanguage } from "@/i18n";
import { useAppearance } from "@/context/AppearanceContext";
import { useAuth } from "@/context/AuthContext";
import { useNotificationPermissionStatus } from "@/hooks/use-notification-permission-prompt";
import { type ThemePreference, useThemePreference } from "@/hooks/use-theme-preference";
import { useThemeColors } from "@/hooks/use-theme";
import { showToast } from "@/lib/toast";
import { DEFAULT_FONT_SET, FONT_SET_IDS, type FontSetId } from "@/theme/fonts";
import { DEFAULT_ICON_SET, ICON_SET_IDS } from "@/theme/icon-sets";
import { DEFAULT_PALETTE, PALETTES, PALETTE_IDS } from "@/theme/palettes";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Linking, Switch, View } from "react-native";

export default function SettingsScreen() {
  const { user, token, updateUser, authService, deleteAccount } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [saving, setSaving] = useState(false);
  const { preference, setPreference } = useThemePreference();
  const appearance = useAppearance();
  const colors = useThemeColors();
  // The clicked chip shows as selected immediately, even before the font loads.
  const [pendingFont, setPendingFont] = useState<FontSetId | null>(null);

  const changeFont = async (font: FontSetId) => {
    setPendingFont(font);
    try {
      await appearance.setAppearance({ font });
    } catch {
      showToast(t("settings.fontLoadFailed"));
    } finally {
      setPendingFont(null);
    }
  };
  const [savingLanguage, setSavingLanguage] = useState(false);
  const language = (user?.language?.slice(0, 2) ?? "hu") as AppLanguage;

  const changeLanguage = async (next: AppLanguage) => {
    if (!token || next === language || savingLanguage) return;
    setSavingLanguage(true);
    try {
      updateUser(await authService.updateLanguage(token, next));
    } catch {
      // HttpClient already showed the error toast.
    } finally {
      setSavingLanguage(false);
    }
  };

  const [deletingAccount, setDeletingAccount] = useState(false);
  const { status: notificationStatus, enable: enableNotifications } = useNotificationPermissionStatus(token);

  const openPrivacyPolicy = () =>
    WebBrowser.openBrowserAsync(`${Config.WEB_URL}/privacy?lang=${language}`);

  const contactSupport = () =>
    Linking.openURL(`mailto:${Config.SUPPORT_EMAIL}?subject=${encodeURIComponent("FlatShare")}`).catch(() =>
      Alert.alert(t("settings.contactSupport"), Config.SUPPORT_EMAIL),
    );

  const confirmDeleteAccount = () => {
    Alert.alert(t("settings.deleteAccountConfirmTitle"), t("settings.deleteAccountConfirmMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("settings.deleteAccountConfirm"),
        style: "destructive",
        onPress: async () => {
          setDeletingAccount(true);
          try {
            // After a successful deletion the signed-out state leads to the login screen.
            await deleteAccount();
          } catch {
            // HttpClient already showed the error toast.
            setDeletingAccount(false);
          }
        },
      },
    ]);
  };

  const themeOptions: ThemePreference[] = ["system", "light", "dark"];

  const unchanged = nickname.trim() === (user?.nickname ?? "");

  const saveNickname = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const updated = await authService.updateNickname(token, nickname.trim() || null);
      updateUser(updated);
      setNickname(updated.nickname ?? "");
    } catch {
      // HttpClient already showed the error toast.
    } finally {
      setSaving(false);
    }
  };

  return (
    <TabScreen>
      <Text className="text-headline-lg">{t("menu.settings")}</Text>

      <View className="flex-row items-center gap-4 rounded-card bg-card p-5" style={Elevation.level1}>
        <UserAvatar size={56} />
        <View className="flex-1">
          <Text className="text-body-lg font-semibold">
            {user?.name}
          </Text>
          <Text variant="muted">{user?.email}</Text>
        </View>
      </View>

      <View className="gap-3 rounded-card bg-card p-5" style={Elevation.level1}>
        <Text className="text-label-md uppercase text-muted-foreground">{t("settings.nickname")}</Text>
        <Input
          value={nickname}
          onChangeText={setNickname}
          placeholder={t("settings.nicknamePlaceholder")}
          maxLength={255}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={saveNickname}
        />
        <Button onPress={saveNickname} disabled={saving || unchanged}>
          <Text>{t("common.save")}</Text>
        </Button>
      </View>

      <View className="gap-3 rounded-card bg-card p-5" style={Elevation.level1}>
        <Text className="text-label-md uppercase text-muted-foreground">{t("house.character.title")}</Text>
        <Text className="text-body-md">
          {user?.character ? t(`house.pets.${user.character}`) : t("house.character.default")}
        </Text>
        <Button variant="outline" onPress={() => router.push("/character")}>
          <Text>{t("house.chooseCharacter")}</Text>
        </Button>
      </View>

      <View className="gap-5 rounded-card bg-card p-5" style={Elevation.level1}>
        <Text className="text-headline-sm">{t("settings.appearance")}</Text>

        <View className="gap-3">
          <Text className="text-label-md uppercase text-muted-foreground">{t("settings.theme")}</Text>
          <SegmentedControl
            options={themeOptions.map((value) => ({ value, label: t(`settings.theme_${value}`) }))}
            value={preference}
            onChange={setPreference}
          />
        </View>

        <Separator />

        <View className="gap-3">
          <Text className="text-label-md uppercase text-muted-foreground">{t("settings.palette")}</Text>
          <ChipGroup
            value={appearance.palette}
            onChange={(palette) => appearance.setAppearance({ palette })}
            defaultLabel={t("settings.default")}
            options={PALETTE_IDS.map((value) => ({
              value,
              label: t(`settings.palette_${value}`),
              swatch: PALETTES[value].swatch,
              isDefault: value === DEFAULT_PALETTE,
            }))}
          />
        </View>

        <Separator />

        <View className="gap-3">
          <Text className="text-label-md uppercase text-muted-foreground">{t("settings.font")}</Text>
          <ChipGroup
            value={pendingFont ?? appearance.font}
            onChange={changeFont}
            defaultLabel={t("settings.default")}
            options={FONT_SET_IDS.map((value) => ({
              value,
              label: t(`settings.font_${value}`),
              isDefault: value === DEFAULT_FONT_SET,
            }))}
          />
        </View>

        <Separator />

        <View className="gap-3">
          <Text className="text-label-md uppercase text-muted-foreground">{t("settings.icons")}</Text>
          <ChipGroup
            value={appearance.icons}
            onChange={(icons) => appearance.setAppearance({ icons })}
            defaultLabel={t("settings.default")}
            options={ICON_SET_IDS.map((value) => ({
              value,
              label: t(`settings.icons_${value}`),
              isDefault: value === DEFAULT_ICON_SET,
            }))}
          />
        </View>

        <Separator />

        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <Text className="text-body-md">{t("settings.stickerWaveAnimation")}</Text>
            <Text variant="muted" className="text-body-sm">
              {t("settings.stickerWaveAnimationHint")}
            </Text>
          </View>
          <Switch
            value={appearance.stickerWaves}
            onValueChange={(stickerWaves) => appearance.setAppearance({ stickerWaves })}
            trackColor={{ true: colors.primary }}
            accessibilityLabel={t("settings.stickerWaveAnimation")}
          />
        </View>

        <Button variant="ghost" onPress={appearance.reset}>
          <Text>{t("settings.resetAppearance")}</Text>
        </Button>
      </View>

      <View className="gap-3 rounded-card bg-card p-5" style={Elevation.level1}>
        <Text className="text-label-md uppercase text-muted-foreground">{t("settings.language")}</Text>
        <SegmentedControl
          options={SUPPORTED_LANGUAGES.map((value) => ({ value, label: t(`settings.language_${value}`) }))}
          value={language}
          onChange={changeLanguage}
        />
      </View>

      {notificationStatus && notificationStatus !== "loading" && (
        <View className="gap-3 rounded-card bg-card p-5" style={Elevation.level1}>
          <Text className="text-label-md uppercase text-muted-foreground">{t("settings.notifications")}</Text>
          <Text variant="muted" className="text-body-sm">
            {t(`settings.notifications_${notificationStatus}`)}
          </Text>
          {notificationStatus === "undetermined" && (
            <Button variant="secondary" onPress={enableNotifications}>
              <Text>{t("settings.notificationsEnable")}</Text>
            </Button>
          )}
          {notificationStatus === "denied" && (
            <Button variant="secondary" onPress={() => Linking.openSettings()}>
              <Text>{t("settings.notificationsOpenSettings")}</Text>
            </Button>
          )}
        </View>
      )}

      <View className="gap-3 rounded-card bg-card p-5" style={Elevation.level1}>
        <Text className="text-label-md uppercase text-muted-foreground">{t("settings.account")}</Text>
        <Button variant="secondary" onPress={openPrivacyPolicy}>
          <Text>{t("settings.privacyPolicy")}</Text>
        </Button>
        <Button variant="secondary" onPress={contactSupport}>
          <Text>{t("settings.contactSupport")}</Text>
        </Button>
        <Separator />
        <Text variant="muted" className="text-body-sm">
          {t("settings.deleteAccountHint")}
        </Text>
        <Button variant="destructive" onPress={confirmDeleteAccount} disabled={deletingAccount}>
          <Text>{t("settings.deleteAccount")}</Text>
        </Button>
      </View>
    </TabScreen>
  );
}
