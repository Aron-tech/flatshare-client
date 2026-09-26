import {
  CUSTOM_TASK_ERROR_FIELDS,
  CustomTaskFields,
  CustomTaskValue,
  DEFAULT_CUSTOM_TASK,
  toCustomTaskDto,
} from "@/components/add-task/custom-task-fields";
import { unshownErrors } from "@/components/add-task/form-field";
import { SearchField } from "@/components/add-task/search-field";
import { TaskOptionCard } from "@/components/add-task/task-option-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Elevation, Gutter, MaxContentWidth } from "@/constants/theme";
import { useHouseholdQuery, useHouseholdSession, useInvalidateHousehold } from "@/hooks/use-household-query";
import { filterByName, useTaskTemplates } from "@/hooks/use-task-templates";
import { fieldErrorsOf } from "@/lib/errors";
import { HouseholdQueries } from "@/lib/queries";
import { showToast } from "@/lib/toast";
import { taskService } from "@/services/api/TaskService";
import { CustomTaskFieldsDto, OneOffHouseholdTask } from "@/types/task";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Mode = "existing" | "custom";
type Action = "log" | "create";

/**
 * Egyszeri feladat a háztartás egy nem ismétlődő feladatából, vagy egy egyedileg
 * (opcionálisan sablonból kitöltve) most felvett, nem ismétlődő feladatból:
 * - "Rögzítés elvégzettként" (megerősítés után): befejezett task instance, a pontokat egyből jóváírjuk;
 * - "Feladat létrehozása": nyitott, senki által el nem vállalt task instance, amit bárki elvállalhat.
 */
export default function LogTaskScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { householdId, token } = useHouseholdSession();
  const invalidateHousehold = useInvalidateHousehold();
  const params = useLocalSearchParams<{ mode?: string }>();

  const [mode, setMode] = useState<Mode>(params.mode === "custom" ? "custom" : "existing");
  const { templates, categories } = useTaskTemplates();
  const oneOffTasks = useHouseholdQuery(HouseholdQueries.oneOffTasks);
  // Hibánál (a HttpClient már toastot mutatott) üres lista, hogy ne töltsön a végtelenségig.
  const tasks = oneOffTasks.data ?? (oneOffTasks.error ? [] : null);
  const [submitting, setSubmitting] = useState<Action | null>(null);
  const [query, setQuery] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Meglévő feladatból
  const [selectedTask, setSelectedTask] = useState<OneOffHouseholdTask | null>(null);

  // Egyedi
  const [custom, setCustom] = useState<CustomTaskValue>(DEFAULT_CUSTOM_TASK);

  const visibleTasks = filterByName(tasks ?? [], query);

  const changeMode = (next: Mode) => {
    setMode(next);
    setQuery("");
    setErrors({});
  };

  /** Meglévő módban a kiválasztott feladat, egyedi módban a validált mezők (vagy `null`, ha hibás). */
  const target = (): { task: OneOffHouseholdTask } | { dto: CustomTaskFieldsDto } | null => {
    if (mode === "existing") return selectedTask ? { task: selectedTask } : null;
    const fields = toCustomTaskDto(custom, t);
    if ("errors" in fields) {
      setErrors(fields.errors);
      return null;
    }
    setErrors({});
    return fields;
  };

  const run = async (action: Action, chosen: NonNullable<ReturnType<typeof target>>) => {
    if (!token || householdId === null) return;

    setSubmitting(action);
    try {
      if (action === "log") {
        const result =
          "task" in chosen
            ? await taskService.logTask(householdId, chosen.task.id, token)
            : await taskService.logNewTask(householdId, chosen.dto, token);
        showToast(t("logTask.success", { count: result.points }));
      } else {
        if ("task" in chosen) {
          await taskService.openTask(householdId, chosen.task.id, token);
        } else {
          await taskService.createTask(
            householdId,
            { ...chosen.dto, is_recurring: false, recurrence_interval: null, recurrence_unit: null },
            token
          );
        }
        showToast(t("logTask.created"));
      }
      void invalidateHousehold();
      router.back();
    } catch (e) {
      // Egyéb hibát a HttpClient már toastban megjelenített.
      setErrors(fieldErrorsOf(e));
    } finally {
      setSubmitting(null);
    }
  };

  const create = () => {
    const chosen = target();
    if (chosen) void run("create", chosen);
  };

  const confirmLog = () => {
    const chosen = target();
    if (!chosen) return;
    const name = "task" in chosen ? chosen.task.name : chosen.dto.name;
    Alert.alert(t("logTask.confirmTitle"), t("logTask.confirmMessage", { name }), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("logTask.confirm"), onPress: () => void run("log", chosen) },
    ]);
  };

  const generalErrors = unshownErrors(errors, CUSTOM_TASK_ERROR_FIELDS);

  const needsSelection = mode === "existing" && selectedTask === null;
  const canSubmit = submitting === null && !needsSelection;

  return (
    <View className="flex-1 flex-row justify-center bg-background">
      <SafeAreaView edges={["top", "bottom"]} className="w-full flex-1" style={{ maxWidth: MaxContentWidth }}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="flex-row items-center justify-between gap-3 py-4" style={{ paddingHorizontal: Gutter }}>
            <Text className="text-headline-lg">{t("logTask.title")}</Text>
            <Button size="icon" variant="ghost" onPress={() => router.back()} accessibilityLabel={t("common.close")}>
              <Icon as={X} size={20} />
            </Button>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: Gutter, paddingBottom: 24, gap: 20 }}
          >
            <SegmentedControl
              activeTone="primary"
              value={mode}
              onChange={changeMode}
              options={[
                { value: "existing" as const, label: t("logTask.existing") },
                { value: "custom" as const, label: t("addTask.custom") },
              ]}
            />

            {mode === "existing" && (
              <>
                <Text variant="muted">{t("logTask.existingHint")}</Text>
                <SearchField value={query} onChangeText={setQuery} placeholder={t("logTask.searchTasks")} />
                <View className="gap-2">
                  {tasks === null ? (
                    <>
                      <Skeleton className="h-20 w-full rounded-card" />
                      <Skeleton className="h-20 w-full rounded-card" />
                    </>
                  ) : visibleTasks.length === 0 ? (
                    <EmptyState text={t(tasks.length === 0 ? "logTask.noTasks" : "logTask.noMatches")} />
                  ) : (
                    visibleTasks.map((task) => (
                      <TaskOptionCard
                        key={task.id}
                        task={task}
                        points={task.points}
                        active={selectedTask?.id === task.id}
                        onPress={() => setSelectedTask(task)}
                      />
                    ))
                  )}
                </View>
              </>
            )}

            {mode === "custom" && (
              <>
                <Text variant="muted">{t("logTask.newHint")}</Text>
                <View className="gap-4 rounded-card bg-card p-5" style={Elevation.level1}>
                  <CustomTaskFields
                    value={custom}
                    onChange={setCustom}
                    categories={categories}
                    errors={errors}
                    templates={templates}
                  />
                  {generalErrors.map((message) => (
                    <Text key={message} className="text-body-sm text-destructive">
                      {message}
                    </Text>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <View className="gap-2 pt-3" style={{ paddingHorizontal: Gutter }}>
            {needsSelection ? (
              <Button size="lg" disabled>
                <Text>{t("logTask.pickTask")}</Text>
              </Button>
            ) : (
              <>
                <Button size="lg" onPress={confirmLog} disabled={!canSubmit}>
                  {submitting === "log" ? (
                    <ActivityIndicator className="text-primary-foreground" />
                  ) : (
                    <Text>{t("logTask.submit")}</Text>
                  )}
                </Button>
                <Button size="lg" variant="outline" onPress={create} disabled={!canSubmit}>
                  {submitting === "create" ? <ActivityIndicator className="text-primary" /> : <Text>{t("logTask.create")}</Text>}
                </Button>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
