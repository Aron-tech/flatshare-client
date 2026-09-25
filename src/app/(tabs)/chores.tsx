import {
  ALL_CATEGORIES,
  CategoryFilter,
  CategoryFilterOption,
} from "@/components/chores/category-filter";
import { ChoreCard } from "@/components/chores/chore-card";
import { TaskActionsSheet, TaskActionsTarget } from "@/components/chores/task-actions-sheet";
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
import { Category, HouseholdTask } from "@/types/task";
import { useRouter } from "expo-router";
import { CircleAlert, Plus, Search } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

/** Automatizált: ismétlődő, a rendszer ütemezi; társított: egyszeri, a háztartáshoz csatolt feladat. */
type ChoreView = "automated" | "attached";

interface Row {
  id: number;
  name: string;
  category: Category | null;
  iconHint: string | null;
  meta: string;
  points: number | null;
  footer: string;
  needsWeight: boolean;
}

/**
 * A háztartás feladat-definíciói: itt csak csatolni (új feladat), szerkeszteni, törölni
 * és súlyozni lehet – az elvállalás a kezdőlapon, a rögzítés a "+" gombbal történik.
 */
export default function ChoresScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { canManage, tasks, isLoading, isRefreshing, error, busyTaskId, refresh, deleteTask, setWeight } = useChores();
  const [actionsTarget, setActionsTarget] = useState<TaskActionsTarget | null>(null);
  const [view, setView] = useState<ChoreView>("automated");
  const [query, setQuery] = useState("");
  const [categoryKey, setCategoryKey] = useState(ALL_CATEGORIES);

  const toRow = useCallback(
    (task: HouseholdTask): Row => ({
      id: task.id,
      name: task.name,
      category: task.category,
      iconHint: task.icon,
      meta: task.is_recurring
        ? formatRecurrence(true, task.recurrence_interval, task.recurrence_unit, t)
        : t("chores.oneOff"),
      points: task.base_points,
      footer: t("chores.duration", { count: task.duration_minutes }),
      needsWeight: !task.user_weights?.length,
    }),
    [t]
  );

  const automatedRows = useMemo(
    () => (tasks ?? []).filter((task) => task.is_recurring).map(toRow),
    [tasks, toRow]
  );
  const attachedRows = useMemo(
    () => (tasks ?? []).filter((task) => !task.is_recurring).map(toRow),
    [tasks, toRow]
  );

  const rows = view === "automated" ? automatedRows : attachedRows;

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

  const subtitle = t("chores.subtitle", { automated: automatedRows.length, attached: attachedRows.length });

  const openActions = (row: Row) =>
    setActionsTarget({
      taskId: row.id,
      name: row.name,
      category: row.category,
      iconHint: row.iconHint,
      canManage,
    });

  const closeActions = () => setActionsTarget(null);

  return (
    <TabScreen refreshing={isRefreshing} onRefresh={refresh}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Text className="text-headline-lg">{t("chores.title")}</Text>
          {!isLoading && <Text className="text-body-md text-muted-foreground">{subtitle}</Text>}
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
        <Button onPress={() => router.push("/add-task")} accessibilityLabel={t("tabs.add")}>
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
          { value: "automated" as const, label: t("chores.automated", { count: automatedRows.length }) },
          { value: "attached" as const, label: t("chores.attached", { count: attachedRows.length }) },
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
              needsWeight={row.needsWeight}
              onPress={() => openActions(row)}
            />
          ))
        )}
      </View>

      <TaskActionsSheet
        target={actionsTarget}
        isBusy={actionsTarget !== null && busyTaskId === actionsTarget.taskId}
        onClose={closeActions}
        onWeight={async (weight) => {
          if (actionsTarget && (await setWeight(actionsTarget.taskId, weight))) closeActions();
        }}
        onEdit={() => {
          if (!actionsTarget) return;
          closeActions();
          router.push({ pathname: "/add-task", params: { taskId: String(actionsTarget.taskId) } });
        }}
        onDelete={async () => {
          if (actionsTarget && (await deleteTask(actionsTarget.taskId))) closeActions();
        }}
      />
    </TabScreen>
  );
}
