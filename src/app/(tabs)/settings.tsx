import { TabScreen } from "@/components/screen";
import { UserAvatar } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { SUPPORTED_LANGUAGES, type AppLanguage } from "@/i18n";
import { useAuth } from "@/context/AuthContext";
import { type ThemePreference, useThemePreference } from "@/hooks/use-theme-preference";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export default function SettingsScreen() {
  const { user, token, updateUser, authService } = useAuth();
  const { t } = useTranslation();
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [saving, setSaving] = useState(false);
  const { preference, setPreference } = useThemePreference();
  const [savingLanguage, setSavingLanguage] = useState(false);
  const language = (user?.language?.slice(0, 2) ?? "hu") as AppLanguage;

  const changeLanguage = async (next: AppLanguage) => {
    if (!token || next === language || savingLanguage) return;
    setSavingLanguage(true);
    try {
      updateUser(await authService.updateLanguage(token, next));
    } catch {
      // A hibát a HttpClient már toastban megjelenítette.
    } finally {
      setSavingLanguage(false);
    }
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
      // A hibát a HttpClient már toastban megjelenítette.
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
        <Text className="text-label-md uppercase text-muted-foreground">{t("settings.theme")}</Text>
        <SegmentedControl
          options={themeOptions.map((value) => ({ value, label: t(`settings.theme_${value}`) }))}
          value={preference}
          onChange={setPreference}
        />
      </View>

      <View className="gap-3 rounded-card bg-card p-5" style={Elevation.level1}>
        <Text className="text-label-md uppercase text-muted-foreground">{t("settings.language")}</Text>
        <SegmentedControl
          options={SUPPORTED_LANGUAGES.map((value) => ({ value, label: t(`settings.language_${value}`) }))}
          value={language}
          onChange={changeLanguage}
        />
      </View>
    </TabScreen>
  );
}
