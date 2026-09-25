import {
  ALL_CATEGORIES,
  CategoryFilter,
  CategoryFilterOption,
} from "@/components/chores/category-filter";
import { ChoreCard } from "@/components/chores/chore-card";
import { GoodDeedBanner } from "@/components/chores/good-deed-banner";
import { TabScreen } from "@/components/screen";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useChores } from "@/hooks/use-chores";
import { formatRecurrence } from "@/lib/format";
import { showToast } from "@/lib/toast";
import { Category } from "@/types/task";
import { CircleAlert, Plus, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type ChoreView = "recurring" | "pool";

interface Row {
  id: number;
  name: string;
  category: Category | null;
  iconHint: string | null;
  meta: string;
  points: number | null;
  footer: string;
  claimable: boolean;
}

export default function ChoresScreen() {
  const { t } = useTranslation();
  const { isAdmin, tasks, pool, isLoading, isRefreshing, error, claimingId, refresh, claim } =
    useChores();
  const [view, setView] = useState<ChoreView>("pool");
  const [query, setQuery] = useState("");
  const [categoryKey, setCategoryKey] = useState(ALL_CATEGORIES);

  const recurringRows = useMemo<Row[]>(
    () =>
      (tasks ?? [])
        .filter((task) => task.is_recurring)
        .map((task) => ({
          id: task.id,
          name: task.name,
          category: task.category,
          iconHint: task.icon,
          meta: formatRecurrence(true, task.recurrence_interval, task.recurrence_unit, t),
          points: task.base_points,
          footer: t("chores.duration", { count: task.duration_minutes }),
          claimable: false,
        })),
    [tasks, t]
  );

  const poolRows = useMemo<Row[]>(
    () =>
      pool.map((item) => ({
        id: item.id,
        name: item.task.name,
        category: item.task.category ?? null,
        iconHint: item.task.icon ?? null,
        meta: t("chores.readyNow"),
        points: item.points,
        footer: t("chores.duration", { count: item.task.duration_minutes }),
        claimable: true,
      })),
    [pool, t]
  );

  const rows = view === "recurring" ? recurringRows : poolRows;

  const filterOptions = useMemo<CategoryFilterOption[]>(() => {
    const counts = new Map<string, CategoryFilterOption>();
    for (const row of rows) {
      const key = row.category ? String(row.category.id) : "other";
      const label = row.category?.name ?? t("chores.other");
      counts.set(key, { key, label, count: (counts.get(key)?.count ?? 0) + 1 });
    }
    return [...counts.values()];
  }, [rows, t]);

  const visible = rows.filter((row) => {
    const key = row.category ? String(row.category.id) : "other";
    const inCategory = categoryKey === ALL_CATEGORIES || key === categoryKey;
    const inSearch = row.name.toLowerCase().includes(query.trim().toLowerCase());
    return inCategory && inSearch;
  });

  const subtitle = isAdmin
    ? t("chores.subtitleAdmin", { routines: recurringRows.length, pool: poolRows.length })
    : t("chores.subtitleMember", { pool: poolRows.length });

  const comingSoon = () => showToast(t("tabs.addComingSoon"));

  return (
    <TabScreen refreshing={isRefreshing} onRefresh={refresh}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-headline-lg">{t("chores.title")}</Text>
          {!isLoading && <Text className="text-body-md text-muted-foreground">{subtitle}</Text>}
        </View>
        <View className="flex-row items-center gap-2 rounded-full bg-success-soft px-3 py-1.5">
          <View className="h-2 w-2 rounded-full bg-success" />
          <Text className="text-label-md text-success-soft-foreground">{t("chores.sync")}</Text>
        </View>
      </View>

      {error && (
        <Alert icon={CircleAlert} variant="destructive">
          <AlertTitle>{t("home.errorTitle")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <View className="flex-row items-center gap-3">
        <View className="flex-1 justify-center">
          <View className="absolute left-4 z-10">
            <Icon as={Search} size={18} className="text-muted-foreground" />
          </View>
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder={t("chores.searchPlaceholder")}
            className="rounded-full pl-11"
            returnKeyType="search"
          />
        </View>
        <Button onPress={comingSoon} accessibilityLabel={t("tabs.add")}>
          <Icon as={Plus} size={18} className="text-primary-foreground" />
          <Text>{t("chores.new")}</Text>
        </Button>
      </View>

      <SegmentedControl
        activeTone="primary"
        value={view}
        onChange={(next) => {
          setView(next);
          setCategoryKey(ALL_CATEGORIES);
        }}
        options={[
          // A feladat-definíciókat csak admin látja.
          ...(isAdmin
            ? [{ value: "recurring" as const, label: t("chores.recurring", { count: recurringRows.length }) }]
            : []),
          { value: "pool" as const, label: t("chores.pool", { count: poolRows.length }) },
        ]}
      />

      {!isLoading && filterOptions.length > 0 && (
        <CategoryFilter options={filterOptions} value={categoryKey} onChange={setCategoryKey} />
      )}

      <View className="gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-32 w-full rounded-card" />
            <Skeleton className="h-32 w-full rounded-card" />
          </>
        ) : visible.length === 0 ? (
          <EmptyState text={t("chores.empty")} />
        ) : (
          visible.map((row) => (
            <ChoreCard
              key={row.id}
              name={row.name}
              category={row.category}
              iconHint={row.iconHint}
              meta={row.meta}
              points={row.points}
              footer={row.footer}
              onClaim={row.claimable ? () => claim(row.id) : undefined}
              isClaiming={claimingId === row.id}
            />
          ))
        )}
      </View>

      <GoodDeedBanner onLog={comingSoon} />
    </TabScreen>
  );
}
