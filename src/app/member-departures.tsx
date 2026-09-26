import { CategoryIconBadge } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Elevation, Gutter, MaxContentWidth } from "@/constants/theme";
import { useHousehold } from "@/context/HouseholdContext";
import { useMemberDepartures } from "@/hooks/use-member-departures";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { MemberDeparture } from "@/types/member-departure";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Admin döntés a távozott tagok által létrehozott feladatokról: mind törlése, a kijelöltek törlése, vagy mind megtartása.
 * Push értesítésből `?household_id=` paraméterrel nyílik, ilyenkor arra a háztartásra vált.
 */
export default function MemberDeparturesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { households, activeHousehold, selectHousehold } = useHousehold();
  const params = useLocalSearchParams<{ household_id?: string }>();
  const { departures, isLoading, resolve } = useMemberDepartures();

  useEffect(() => {
    const target = params.household_id ? Number(params.household_id) : null;
    if (target && target !== activeHousehold?.id && households.some((h) => h.id === target)) {
      void selectHousehold(target);
    }
  }, [params.household_id, activeHousehold?.id, households, selectHousehold]);

  return (
    <View className="flex-1 flex-row justify-center bg-background">
      <SafeAreaView edges={["top", "bottom"]} className="w-full flex-1" style={{ maxWidth: MaxContentWidth }}>
        <View className="flex-row items-center justify-between gap-3 py-4" style={{ paddingHorizontal: Gutter }}>
          <Text className="flex-1 text-headline-lg">{t("memberDepartures.title")}</Text>
          <Button size="icon" variant="ghost" onPress={() => router.back()} accessibilityLabel={t("common.close")}>
            <Icon as={X} size={20} />
          </Button>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: Gutter, paddingBottom: 24, gap: 16 }}>
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-card" />
          ) : departures.length === 0 ? (
            <EmptyState text={t("memberDepartures.empty")} />
          ) : (
            departures.map((departure) => (
              <DepartureCard
                key={departure.id}
                departure={departure}
                onResolve={async (taskIds) => {
                  const deleted = await resolve({ departureId: departure.id, taskIds });
                  if (deleted === null) return;
                  showToast(t("memberDepartures.resolved", { count: deleted }));
                  if (departures.length === 1) router.back();
                }}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function DepartureCard({
  departure,
  onResolve,
}: {
  departure: MemberDeparture;
  onResolve: (taskIds: number[]) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const allIds = departure.tasks.map((task) => task.id);

  const toggle = (id: number) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = async (taskIds: number[]) => {
    setBusy(true);
    try {
      await onResolve(taskIds);
    } finally {
      setBusy(false);
    }
  };

  /** A törlés nem vonható vissza, ezért megerősítést kér. */
  const confirmDelete = (taskIds: number[]) =>
    Alert.alert(
      t("memberDepartures.confirmTitle"),
      t("memberDepartures.confirmMessage", { count: taskIds.length }),
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("common.delete"), style: "destructive", onPress: () => void submit(taskIds) },
      ],
    );

  return (
    <View className="gap-4 rounded-card bg-card p-5" style={Elevation.level1}>
      <View className="gap-1">
        <Text className="font-serif text-headline-sm">
          {t(departure.removed_by ? "memberDepartures.removed" : "memberDepartures.left", { name: departure.user.name })}
        </Text>
        <Text className="text-body-md text-muted-foreground">{t("memberDepartures.question", { count: departure.tasks.length })}</Text>
      </View>

      <View className="gap-2">
        {departure.tasks.map((task) => {
          const isSelected = selected.has(task.id);
          return (
            <Pressable
              key={task.id}
              role="checkbox"
              aria-checked={isSelected}
              disabled={busy}
              onPress={() => toggle(task.id)}
              className={cn(
                "flex-row items-center gap-3 rounded-input border px-4 py-3",
                isSelected ? "border-destructive bg-destructive/10" : "border-border",
              )}
            >
              <View
                className={cn(
                  "h-6 w-6 items-center justify-center rounded-input border",
                  isSelected ? "border-destructive bg-destructive" : "border-border",
                )}
              >
                {isSelected && <Icon as={Check} size={16} className="text-destructive-foreground" />}
              </View>
              <CategoryIconBadge
                color={task.category?.color}
                hints={[task.category?.icon, task.category?.name, task.name]}
                shape="rounded"
                size={36}
              />
              <View className="flex-1">
                <Text className="text-body-md">{task.name}</Text>
                <Text className="text-body-sm text-muted-foreground">
                  {task.is_recurring ? t("memberDepartures.recurring") : t("memberDepartures.oneOff")}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="gap-2">
        <Button
          variant="destructive"
          disabled={busy || selected.size === 0}
          onPress={() => confirmDelete([...selected])}
        >
          <Text>{t("memberDepartures.deleteSelected", { count: selected.size })}</Text>
        </Button>
        <Button variant="outline" disabled={busy} onPress={() => confirmDelete(allIds)}>
          <Text>{t("memberDepartures.deleteAll")}</Text>
        </Button>
        <Button variant="ghost" disabled={busy} onPress={() => void submit([])}>
          <Text>{t("memberDepartures.keepAll")}</Text>
        </Button>
      </View>
    </View>
  );
}
