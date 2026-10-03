import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { Hammer, PawPrint, RotateCcw, Settings2, X } from "lucide-react-native";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, View } from "react-native";

interface HouseSettingsSheetProps {
  onClose: () => void;
  onChooseCharacter: () => void;
  onResetCamera: () => void;
  /** A szobabolt tartalma (szobák, gyűjtés); nélküle a szekció nem látszik. */
  shop?: ReactNode;
}

/**
 * A Ház nézet beállításai (a jelenet fogaskerék gombjáról): karakterválasztás, alapnézet,
 * szobabolt. Csak nyitott állapotban kell renderelni.
 */
export function HouseSettingsSheet({ onClose, onChooseCharacter, onResetCamera, shop }: HouseSettingsSheetProps) {
  const { t } = useTranslation();

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 items-center justify-end bg-black/40 p-4">
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="max-h-[85%] w-full max-w-md rounded-card bg-popover"
          style={Elevation.level2}
        >
          <ScrollView contentContainerClassName="gap-4 p-6">
            <View className="flex-row items-center gap-3">
              <Icon as={Settings2} size={22} className="text-primary" />
              <Text className="flex-1 font-serif text-headline-sm">{t("house.settings.title")}</Text>
              <Button size="icon" variant="ghost" onPress={onClose} accessibilityLabel={t("common.close")}>
                <Icon as={X} size={20} />
              </Button>
            </View>

            <View className="gap-2">
              <Button variant="outline" onPress={onChooseCharacter}>
                <Icon as={PawPrint} size={16} />
                <Text>{t("house.chooseCharacter")}</Text>
              </Button>
              <Button variant="outline" onPress={onResetCamera}>
                <Icon as={RotateCcw} size={16} />
                <Text>{t("house.settings.resetCamera")}</Text>
              </Button>
            </View>

            {shop && (
              <View className="gap-2">
                <View className="flex-row items-center gap-2 px-1">
                  <Icon as={Hammer} size={16} className="text-muted-foreground" />
                  <Text className="text-label-md uppercase text-muted-foreground">{t("house.settings.shop")}</Text>
                </View>
                {shop}
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
