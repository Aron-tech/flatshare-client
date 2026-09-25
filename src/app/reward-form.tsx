import { FormField, parsePositiveInt } from "@/components/add-task/form-field";
import { RewardDifficultyHint } from "@/components/rewards/reward-difficulty-hint";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Elevation, Gutter, MaxContentWidth } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { emitRewardsChanged } from "@/lib/reward-events";
import { showToast } from "@/lib/toast";
import { rewardService } from "@/services/api/RewardService";
import { RewardDifficulty } from "@/types/reward";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DIFFICULTY_DEBOUNCE_MS = 400;

type Availability = "active" | "paused";

/** Nemnegatív egész a szövegmezőből; üresen `null` (korlátlan készlet), érvénytelenül `undefined`. */
function parseStock(value: string): number | null | undefined {
  if (value.trim() === "") return null;
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

/** Jutalom létrehozása, vagy `id` paraméterrel a saját jutalom szerkesztése. */
export default function RewardFormScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token, user } = useAuth();
  const { activeHousehold } = useHousehold();
  const params = useLocalSearchParams<{ id?: string }>();
  const rewardId = params.id ? Number(params.id) : null;
  const householdId = activeHousehold?.id ?? null;

  const [isLoaded, setIsLoaded] = useState(rewardId === null);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pointsCost, setPointsCost] = useState("");
  const [stock, setStock] = useState("");
  const [availability, setAvailability] = useState<Availability>("active");

  /** Az utoljára lekért nehézség, és hogy melyik pontárra kértük. */
  const [preview, setPreview] = useState<{ points: number; result: RewardDifficulty } | null>(null);
  const parsedPoints = parsePositiveInt(pointsCost);
  // Betöltés közben az előző eredmény látszik, hogy ne villogjon.
  const difficulty = parsedPoints === null ? null : (preview?.result ?? null);
  const difficultyLoading = parsedPoints !== null && preview?.points !== parsedPoints;

  /** Mentés után a backend már lezárta a szerkesztést, kilépéskor nem kell. */
  const savedRef = useRef(false);

  // Szerkesztésnél betölti a jutalmat, és szerkesztés alá helyezi (is_editing = true),
  // hogy közben senki ne válthassa be. Mentés nélküli kilépéskor visszaállítja.
  useEffect(() => {
    if (rewardId === null || !token || householdId === null) return;
    let cancelled = false;
    let editing = false;

    (async () => {
      try {
        const reward = (await rewardService.getByHousehold(householdId, token)).find((item) => item.id === rewardId);
        if (cancelled) return;
        if (!reward || reward.user_id !== user?.id) {
          showToast(t("rewardForm.notEditable"));
          router.back();
          return;
        }
        setName(reward.name);
        setDescription(reward.description ?? "");
        setPointsCost(String(reward.points_cost));
        setStock(reward.stock_quantity === null ? "" : String(reward.stock_quantity));
        setAvailability(reward.is_active ? "active" : "paused");
        await rewardService.startEditing(householdId, rewardId, token);
        editing = true;
        if (!cancelled) setIsLoaded(true);
        else void rewardService.stopEditing(householdId, rewardId, token).catch(() => {});
      } catch {
        // A hibát a HttpClient már toastban megjelenítette.
        if (!cancelled) router.back();
      }
    })();

    return () => {
      cancelled = true;
      if (editing && !savedRef.current) {
        void rewardService
          .stopEditing(householdId, rewardId, token)
          .then(emitRewardsChanged)
          .catch(() => {});
      }
    };
  }, [rewardId, token, householdId, user?.id, router, t]);

  // Nehézség előnézet a pontár beírása közben.
  useEffect(() => {
    if (parsedPoints === null || !token || householdId === null) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      rewardService
        .getDifficulty(householdId, parsedPoints, token)
        .then((result) => {
          if (!cancelled) setPreview({ points: parsedPoints, result });
        })
        .catch(() => {});
    }, DIFFICULTY_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [parsedPoints, token, householdId]);

  const submit = async () => {
    if (!token || householdId === null) return;

    const trimmedName = name.trim();
    const points = parsedPoints;
    const stockValue = parseStock(stock);
    if (trimmedName.length < 3) {
      showToast(t("rewardForm.nameTooShort"));
      return;
    }
    if (points === null) {
      showToast(t("rewardForm.invalidPoints"));
      return;
    }
    if (stockValue === undefined) {
      showToast(t("rewardForm.invalidStock"));
      return;
    }

    const dto = {
      name: trimmedName,
      description: description.trim() || null,
      points_cost: points,
      stock_quantity: stockValue,
      is_active: availability === "active",
    };

    setSubmitting(true);
    try {
      if (rewardId === null) {
        await rewardService.create(householdId, dto, token);
      } else {
        await rewardService.update(householdId, rewardId, dto, token);
        savedRef.current = true;
      }
      emitRewardsChanged();
      router.back();
    } catch {
      // A hibát a HttpClient már toastban megjelenítette.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 flex-row justify-center bg-background">
      <SafeAreaView edges={["top", "bottom"]} className="w-full flex-1" style={{ maxWidth: MaxContentWidth }}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="flex-row items-center justify-between gap-3 py-4" style={{ paddingHorizontal: Gutter }}>
            <Text className="text-headline-lg">
              {rewardId === null ? t("rewardForm.createTitle") : t("rewardForm.editTitle")}
            </Text>
            <Button size="icon" variant="ghost" onPress={() => router.back()} accessibilityLabel={t("common.close")}>
              <Icon as={X} size={20} />
            </Button>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: Gutter, paddingBottom: 24, gap: 20 }}
          >
            {!isLoaded ? (
              <Skeleton className="h-96 w-full rounded-card" />
            ) : (
              <View className="gap-4 rounded-card bg-card p-5" style={Elevation.level1}>
                <FormField label={t("rewardForm.name")}>
                  <Input value={name} onChangeText={setName} placeholder={t("rewardForm.namePlaceholder")} maxLength={125} />
                </FormField>
                <FormField label={t("rewardForm.description")}>
                  <Input
                    value={description}
                    onChangeText={setDescription}
                    placeholder={t("rewardForm.descriptionPlaceholder")}
                    multiline
                    maxLength={1000}
                    className="h-24 py-3"
                    textAlignVertical="top"
                  />
                </FormField>
                <FormField label={t("rewardForm.points")}>
                  <Input
                    value={pointsCost}
                    onChangeText={setPointsCost}
                    keyboardType="number-pad"
                    maxLength={7}
                    placeholder="100"
                    className="w-32"
                  />
                  <RewardDifficultyHint difficulty={difficulty} isLoading={difficultyLoading} />
                </FormField>
                <FormField label={t("rewardForm.stock")}>
                  <Input
                    value={stock}
                    onChangeText={setStock}
                    keyboardType="number-pad"
                    maxLength={4}
                    placeholder={t("rewardForm.stockPlaceholder")}
                  />
                </FormField>
                <FormField label={t("rewardForm.availability")}>
                  <SegmentedControl
                    activeTone="primary"
                    value={availability}
                    onChange={setAvailability}
                    options={[
                      { value: "active" as const, label: t("rewardForm.active") },
                      { value: "paused" as const, label: t("rewardForm.paused") },
                    ]}
                  />
                </FormField>
              </View>
            )}
          </ScrollView>

          <View className="pt-3" style={{ paddingHorizontal: Gutter }}>
            <Button size="lg" onPress={submit} disabled={submitting || !isLoaded}>
              {submitting ? (
                <ActivityIndicator className="text-primary-foreground" />
              ) : (
                <Text>{rewardId === null ? t("rewardForm.create") : t("common.save")}</Text>
              )}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
