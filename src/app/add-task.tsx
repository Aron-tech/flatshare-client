import {
  applyTemplate,
  CUSTOM_TASK_ERROR_FIELDS,
  CustomTaskFields,
  CustomTaskValue,
  DEFAULT_CUSTOM_TASK,
  toCustomTaskDto,
} from "@/components/add-task/custom-task-fields";
import { parsePositiveInt, unshownErrors } from "@/components/add-task/form-field";
import {
  DEFAULT_RECURRENCE,
  RECURRENCE_ERROR_FIELDS,
  RecurrenceFields,
  RecurrenceValue,
} from "@/components/add-task/recurrence-fields";
import {
  ASSIGNMENT_ERROR_FIELDS,
  AssignmentFields,
  AssignmentValue,
  DEFAULT_ASSIGNMENT,
  toAssignmentDto,
} from "@/components/add-task/assignment-fields";
import { SearchField } from "@/components/add-task/search-field";
import { TaskOptionCard } from "@/components/add-task/task-option-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Elevation, Gutter, MaxContentWidth } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useHousehold } from "@/context/HouseholdContext";
import { filterByName, useTaskTemplates } from "@/hooks/use-task-templates";
import { fieldErrorsOf } from "@/lib/errors";
import { emitTasksChanged } from "@/lib/task-events";
import { householdUserService } from "@/services/api/HouseholdUserService";
import { taskService } from "@/services/api/TaskService";
import type { HouseholdMember } from "@/types/household-user";
import { HouseholdTask, TaskRecurrenceDto, TaskTemplate } from "@/types/task";
import type { TFunction } from "i18next";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Mode = "template" | "custom";

/** Ismétlődés a backend formátumában, vagy mezőnkénti hibák a backend mezőneveivel. */
function toRecurrenceDto(
  value: RecurrenceValue,
  t: TFunction
): { dto: TaskRecurrenceDto } | { errors: Record<string, string> } {
  if (!value.isRecurring) {
    return { dto: { is_recurring: false, recurrence_interval: null, recurrence_unit: null } };
  }
  const interval = parsePositiveInt(value.interval);
  if (interval === null) return { errors: { recurrence_interval: t("addTask.invalidInterval") } };
  return { dto: { is_recurring: true, recurrence_interval: interval, recurrence_unit: value.unit } };
}

/** A meglévő feladat értékei az űrlap formátumában. */
function fromTask(task: HouseholdTask): {
  custom: CustomTaskValue;
  recurrence: RecurrenceValue;
  assignment: AssignmentValue;
} {
  return {
    custom: {
      templateId: task.task_template_id,
      icon: task.icon,
      name: task.name,
      description: task.description ?? "",
      categoryId: task.category_id,
      duration: String(task.duration_minutes),
      difficulty: task.difficulty,
      maxUser: String(task.max_user),
    },
    recurrence: {
      isRecurring: task.is_recurring,
      interval: String(task.recurrence_interval ?? DEFAULT_RECURRENCE.interval),
      unit: task.recurrence_unit ?? DEFAULT_RECURRENCE.unit,
    },
    assignment: {
      mode: task.assignment_mode ?? "none",
      fixedUserId: task.fixed_user_id,
      rotationUserIds: [...(task.rotations ?? [])]
        .sort((a, b) => a.rotation_order - b.rotation_order)
        .map((rotation) => rotation.user_id),
    },
  };
}

/** Feladat csatolása a háztartáshoz (sablonból vagy egyedileg), `taskId` paraméterrel a meglévő szerkesztése. */
export default function AddTaskScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const { activeHousehold } = useHousehold();
  const params = useLocalSearchParams<{ mode?: string; taskId?: string }>();
  const editedTaskId = params.taskId ? Number(params.taskId) : null;
  const isEditing = editedTaskId !== null;
  const [isLoadingTask, setIsLoadingTask] = useState(isEditing);

  const [mode, setMode] = useState<Mode>(params.mode === "custom" || isEditing ? "custom" : "template");
  const { templates, categories } = useTaskTemplates();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sablonból
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<TaskTemplate | null>(null);

  // Egyedi
  const [custom, setCustom] = useState<CustomTaskValue>(DEFAULT_CUSTOM_TASK);

  const [recurrence, setRecurrence] = useState<RecurrenceValue>(DEFAULT_RECURRENCE);
  const [assignment, setAssignment] = useState<AssignmentValue>(DEFAULT_ASSIGNMENT);
  const [members, setMembers] = useState<HouseholdMember[]>([]);

  const householdId = activeHousehold?.id ?? null;

  useEffect(() => {
    if (editedTaskId === null || !token || householdId === null) return;
    let cancelled = false;
    taskService
      .getHouseholdTasks(householdId, token)
      .then((list) => {
        const task = list.find((candidate) => candidate.id === editedTaskId);
        if (cancelled) return;
        if (!task) {
          router.back();
          return;
        }
        const values = fromTask(task);
        setCustom(values.custom);
        setRecurrence(values.recurrence);
        setAssignment(values.assignment);
        setIsLoadingTask(false);
      })
      .catch(() => {
        // A hibát a HttpClient már toastban megjelenítette.
        if (!cancelled) router.back();
      });
    return () => {
      cancelled = true;
    };
  }, [editedTaskId, token, householdId, router]);

  useEffect(() => {
    if (!token || householdId === null) return;
    let cancelled = false;
    householdUserService
      .getMembers(householdId, token)
      .then((list) => {
        if (!cancelled) setMembers(list);
      })
      .catch(() => {
        // A hibát a HttpClient már toastban megjelenítette.
      });
    return () => {
      cancelled = true;
    };
  }, [token, householdId]);

  const visibleTemplates = useMemo(() => filterByName(templates ?? [], query), [templates, query]);

  const changeMode = (next: Mode) => {
    setMode(next);
    setErrors({});
  };

  const submit = async () => {
    // A sablon kiválasztása után az egyedi űrlapon, a sablon adataival kitöltve lehet véglegesíteni.
    if (mode === "template") {
      if (!selected) return;
      setCustom((current) => applyTemplate(current, selected));
      changeMode("custom");
      return;
    }

    if (!token || !activeHousehold) return;

    const fields = toCustomTaskDto(custom, t);
    const recurrenceResult = toRecurrenceDto(recurrence, t);
    const clientErrors = {
      ...("errors" in fields ? fields.errors : {}),
      ...("errors" in recurrenceResult ? recurrenceResult.errors : {}),
    };
    if ("errors" in fields || "errors" in recurrenceResult) {
      setErrors(clientErrors);
      return;
    }

    const assignmentDto = toAssignmentDto(assignment, recurrenceResult.dto.is_recurring);

    setErrors({});
    setSubmitting(true);
    try {
      if (editedTaskId !== null) {
        const { task_template_id: _templateId, ...dto } = fields.dto;
        await taskService.updateTask(
          activeHousehold.id,
          editedTaskId,
          { ...recurrenceResult.dto, ...assignmentDto, ...dto },
          token
        );
      } else {
        await taskService.createTask(
          activeHousehold.id,
          { ...recurrenceResult.dto, ...assignmentDto, ...fields.dto },
          token
        );
      }
      emitTasksChanged();
      router.back();
    } catch (e) {
      // Egyéb hibát a HttpClient már toastban megjelenített.
      setErrors(fieldErrorsOf(e));
    } finally {
      setSubmitting(false);
    }
  };

  const generalErrors = unshownErrors(errors, [
    ...CUSTOM_TASK_ERROR_FIELDS,
    ...RECURRENCE_ERROR_FIELDS,
    ...ASSIGNMENT_ERROR_FIELDS,
  ]);

  const canSubmit = !submitting && !isLoadingTask && (mode === "custom" || selected !== null);

  return (
    <View className="flex-1 flex-row justify-center bg-background">
      <SafeAreaView edges={["top", "bottom"]} className="w-full flex-1" style={{ maxWidth: MaxContentWidth }}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View className="flex-row items-center justify-between gap-3 py-4" style={{ paddingHorizontal: Gutter }}>
            <Text className="text-headline-lg">{t(isEditing ? "addTask.editTitle" : "addTask.title")}</Text>
            <Button size="icon" variant="ghost" onPress={() => router.back()} accessibilityLabel={t("common.close")}>
              <Icon as={X} size={20} />
            </Button>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: Gutter, paddingBottom: 24, gap: 20 }}
          >
            {!isEditing && (
              <SegmentedControl
                activeTone="primary"
                value={mode}
                onChange={changeMode}
                options={[
                  { value: "template" as const, label: t("addTask.fromTemplate") },
                  { value: "custom" as const, label: t("addTask.custom") },
                ]}
              />
            )}

            {isLoadingTask ? (
              <Skeleton className="h-96 w-full rounded-card" />
            ) : mode === "template" ? (
              <>
                <SearchField value={query} onChangeText={setQuery} placeholder={t("addTask.searchTemplates")} />

                <View className="gap-2">
                  {templates === null ? (
                    <>
                      <Skeleton className="h-20 w-full rounded-card" />
                      <Skeleton className="h-20 w-full rounded-card" />
                    </>
                  ) : visibleTemplates.length === 0 ? (
                    <EmptyState text={t("addTask.noTemplates")} />
                  ) : (
                    visibleTemplates.map((template) => (
                      <TaskOptionCard
                        key={template.id}
                        task={template}
                        points={template.base_points}
                        active={selected?.id === template.id}
                        onPress={() => setSelected(template)}
                      />
                    ))
                  )}
                </View>

              </>
            ) : (
              <View className="gap-4 rounded-card bg-card p-5" style={Elevation.level1}>
                <CustomTaskFields value={custom} onChange={setCustom} categories={categories} errors={errors} />
                <RecurrenceFields value={recurrence} onChange={setRecurrence} errors={errors} />
                {recurrence.isRecurring && (
                  <AssignmentFields value={assignment} onChange={setAssignment} members={members} errors={errors} />
                )}
                {generalErrors.map((message) => (
                  <Text key={message} className="text-body-sm text-destructive">
                    {message}
                  </Text>
                ))}
              </View>
            )}
          </ScrollView>

          <View className="pt-3" style={{ paddingHorizontal: Gutter }}>
            <Button size="lg" onPress={submit} disabled={!canSubmit}>
              {submitting ? (
                <ActivityIndicator className="text-primary-foreground" />
              ) : (
                <Text>
                  {isEditing
                    ? t("common.save")
                    : mode === "template" && !selected
                      ? t("addTask.pickTemplate")
                      : t("addTask.submit")}
                </Text>
              )}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
