import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { initials } from "@/lib/format";
import { Elevation } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { LogOut, Settings } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Modal, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function UserAvatar({ size = 40 }: { size?: number }) {
  const { user } = useAuth();

  if (user?.avatar) {
    return (
      <Image
        source={{ uri: user.avatar }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View
      className="items-center justify-center bg-primary"
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      <Text className="text-label-lg text-primary-foreground">
        {initials(user?.name)}
      </Text>
    </View>
  );
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t("menu.profile")}
      >
        <UserAvatar />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable className="flex-1" onPress={() => setOpen(false)}>
          <View
            className="absolute right-4 min-w-52 overflow-hidden rounded-container border border-border bg-popover py-1"
            style={[Elevation.level2, { top: insets.top + 56 }]}
          >
            <View className="px-4 py-3">
              <Text className="text-label-lg text-popover-foreground">
                {user?.name}
              </Text>
            </View>
            <View className="h-px bg-border" />
            <Pressable
              className="flex-row items-center gap-2 px-4 py-3 active:bg-secondary"
              onPress={() => {
                setOpen(false);
                router.push("/settings");
              }}
            >
              <Icon as={Settings} size={16} />
              <Text>{t("menu.settings")}</Text>
            </Pressable>
            <Pressable
              className="flex-row items-center gap-2 px-4 py-3 active:bg-secondary"
              onPress={() => {
                setOpen(false);
                logout();
              }}
            >
              <Icon as={LogOut} size={16} />
              <Text>{t("home.logout")}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
