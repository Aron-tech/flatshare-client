import { PetSprite } from "@/components/house/pet-sprite";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Gutter, MaxContentWidth } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useHouseholdQuery, useInvalidateHousehold } from "@/hooks/use-household-query";
import { PET_ATLAS } from "@/lib/house/pet-sprites.generated";
import { PET_IDS, type PetId } from "@/lib/house/scene.generated";
import { HouseholdQueries } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useRouter } from "expo-router";
import { Check, Dices, X } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

/** Egy cella mérete a rácsban (pt). */
const CELL = 96;
const SPRITE_SCALE = 84 / PET_ATLAS.frame.width;

/** "Alapértelmezett" választás: a backend ad állatot (mindig ugyanazt). */
type Choice = PetId | null;

/**
 * Karakterválasztás a Ház nézethez. Nem kötelező: választás nélkül a backend minden tagnak
 * ad egy állandó alapértelmezett állatot.
 */
export default function CharacterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { user, token, updateUser, authService } = useAuth();
  const invalidateHousehold = useInvalidateHousehold();
  const { data: house } = useHouseholdQuery(HouseholdQueries.house);
  const [choice, setChoice] = useState<Choice>(user?.character ?? null);
  const [saving, setSaving] = useState(false);
  /** Választás nélkül ezt az állatot kapja (a ház adataiból), előnézethez. */
  const defaultPet = user?.character ? null : (house?.members.find((member) => member.is_me)?.character ?? null);

  const save = async () => {
    if (!token) return;
    setSaving(true);
    try {
      updateUser(await authService.updateCharacter(token, choice));
      // A ház a háttérben töltődik újra, a választó azonnal bezárul.
      void invalidateHousehold();
      router.back();
    } catch {
      // A hibát a HttpClient már toastban megjelenítette.
    } finally {
      setSaving(false);
    }
  };

  const renderCell = (pet: Choice, key: string) => {
    const selected = choice === pet;
    const preview = pet ?? defaultPet;
    return (
      <Pressable
        key={key}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={pet ? t(`house.pets.${pet}`) : t("house.character.default")}
        onPress={() => setChoice(pet)}
        className={cn(
          "items-center justify-end rounded-container border-2 pb-1",
          selected ? "border-primary bg-primary-soft" : "border-transparent bg-card"
        )}
        style={{ width: CELL, height: CELL + 22 }}
      >
        {preview ? (
          <PetSprite
            pet={preview}
            animation={selected ? "happy" : "idle"}
            facing="se"
            scale={SPRITE_SCALE}
            paused={reducedMotion || !selected}
          />
        ) : (
          <View className="h-16 items-center justify-center">
            <Icon as={Dices} size={28} className="text-muted-foreground" />
          </View>
        )}
        <Text numberOfLines={1} className="text-label-sm">
          {pet ? t(`house.pets.${pet}`) : t("house.character.default")}
        </Text>
        {selected && (
          <View className="absolute right-1.5 top-1.5 h-5 w-5 items-center justify-center rounded-full bg-primary">
            <Icon as={Check} size={12} className="text-primary-foreground" />
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <View className="flex-1 flex-row justify-center bg-background">
      <SafeAreaView edges={["top", "bottom"]} className="w-full flex-1" style={{ maxWidth: MaxContentWidth }}>
        <View className="flex-row items-center justify-between gap-3 py-4" style={{ paddingHorizontal: Gutter }}>
          <Text className="flex-1 text-headline-lg">{t("house.character.title")}</Text>
          <Button size="icon" variant="ghost" onPress={() => router.back()} accessibilityLabel={t("common.close")}>
            <Icon as={X} size={20} />
          </Button>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: Gutter, paddingBottom: 24, gap: 16 }}>
          <Text className="text-body-md text-muted-foreground">{t("house.character.subtitle")}</Text>
          <View className="flex-row flex-wrap justify-center gap-3" accessibilityRole="radiogroup">
            {renderCell(null, "default")}
            {PET_IDS.map((pet) => renderCell(pet, pet))}
          </View>
        </ScrollView>
        <View className="py-3" style={{ paddingHorizontal: Gutter }}>
          <Button onPress={save} disabled={saving || choice === (user?.character ?? null)}>
            <Text>{t("common.save")}</Text>
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}
