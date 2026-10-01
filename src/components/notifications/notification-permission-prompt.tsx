import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { useNotificationPermissionPrompt } from "@/hooks/use-notification-permission-prompt";
import { Bell } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal, View } from "react-native";

interface NotificationPermissionPromptProps {
  /** Csak akkor induljon a döntés, ha a felhasználó már túl van a bejelentkezésen/háztartás-választáson. */
  active: boolean;
  authToken: string | null;
}

/**
 * Saját magyarázó képernyő a rendszer push-engedélyablaka előtt (App Review javaslat: a puszta
 * bejelentkezés utáni, magyarázat nélküli kérés kevesebb elfogadást hoz). Legfeljebb egyszer jelenik meg.
 * Egyetlen semleges „Tovább” gombja van, ami mindig a rendszer ablakához visz: kilépő gomb vagy
 * háttérre koppintás nem lehet, mert az App Review 5.1.1(iv) ezt elutasítja.
 */
export function NotificationPermissionPrompt({ active, authToken }: NotificationPermissionPromptProps) {
  const { t } = useTranslation();
  const { visible, requesting, enable } = useNotificationPermissionPrompt(active, authToken);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <View className="flex-1 items-center justify-center bg-black/40 p-6">
        <View
          className="w-full max-w-sm items-center gap-3 rounded-card bg-popover px-6 pb-6 pt-7"
          style={Elevation.level2}
        >
          <View className="items-center justify-center rounded-full bg-primary/10 p-4">
            <Icon as={Bell} size={28} className="text-primary" />
          </View>
          <Text className="text-center font-serif text-headline-sm">
            {t("notifications.prompt.title")}
          </Text>
          <Text className="text-center text-body-md text-muted-foreground">
            {t("notifications.prompt.body")}
          </Text>
          <View className="mt-2 w-full">
            <Button onPress={enable} disabled={requesting}>
              {requesting ? <ActivityIndicator /> : <Text>{t("common.continue")}</Text>}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
