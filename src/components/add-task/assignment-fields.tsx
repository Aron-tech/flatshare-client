import { FormField } from "@/components/add-task/form-field";
import { ChipGroup } from "@/components/ui/chip-group";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { HouseholdMember } from "@/types/household-user";
import { TaskAssignmentDto, TaskAssignmentMode } from "@/types/task";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

export interface AssignmentValue {
  mode: TaskAssignmentMode;
  fixedUserId: number | null;
  /** A rotáció tagjai a kiválasztás sorrendjében; üresen mindenki rotál. */
  rotationUserIds: number[];
}

export const DEFAULT_ASSIGNMENT: AssignmentValue = { mode: "none", fixedUserId: null, rotationUserIds: [] };

/** A backend mezőnevei, amelyekhez a felelős űrlap hibát tud mutatni. */
export const ASSIGNMENT_ERROR_FIELDS = ["assignment_mode", "fixed_user_id", "rotation_user_ids"] as const;

/** A felelős beállítás a backend formátumában; nem ismétlődő feladatnál nincs felelős. */
export function toAssignmentDto(value: AssignmentValue, isRecurring: boolean): TaskAssignmentDto {
  if (!isRecurring || value.mode === "none" || (value.mode === "fixed" && value.fixedUserId === null)) {
    return { assignment_mode: "none", fixed_user_id: null, rotation_user_ids: null };
  }
  if (value.mode === "fixed") {
    return { assignment_mode: "fixed", fixed_user_id: value.fixedUserId, rotation_user_ids: null };
  }
  return {
    assignment_mode: "rotating",
    fixed_user_id: null,
    rotation_user_ids: value.rotationUserIds.length > 0 ? value.rotationUserIds : null,
  };
}

interface AssignmentFieldsProps {
  value: AssignmentValue;
  onChange: (value: AssignmentValue) => void;
  members: HouseholdMember[];
  /** Mezőnkénti hibák a backend mezőneveivel. */
  errors?: Record<string, string>;
}

/** Ismétlődő feladat felelőse (opcionális): nincs, fix tag vagy rotáció a tagok között. */
export function AssignmentFields({ value, onChange, members, errors = {} }: AssignmentFieldsProps) {
  const { t } = useTranslation();

  const toggleRotationMember = (userId: number) =>
    onChange({
      ...value,
      rotationUserIds: value.rotationUserIds.includes(userId)
        ? value.rotationUserIds.filter((id) => id !== userId)
        : [...value.rotationUserIds, userId],
    });

  return (
    <View className="gap-4">
      <FormField label={t("addTask.assignee")} error={errors.assignment_mode}>
        <SegmentedControl
          activeTone="primary"
          value={value.mode}
          onChange={(mode) => onChange({ ...value, mode })}
          options={[
            { value: "none" as const, label: t("addTask.assignment.none") },
            { value: "fixed" as const, label: t("addTask.assignment.fixed") },
            { value: "rotating" as const, label: t("addTask.assignment.rotating") },
          ]}
        />
      </FormField>

      {value.mode === "fixed" && (
        <FormField label={t("addTask.assignment.fixedUser")} error={errors.fixed_user_id}>
          <ChipGroup
            value={value.fixedUserId}
            onChange={(fixedUserId) => onChange({ ...value, fixedUserId })}
            options={members.map((member) => ({ value: member.user_id, label: member.name }))}
          />
        </FormField>
      )}

      {value.mode === "rotating" && (
        <FormField label={t("addTask.assignment.rotationUsers")} error={errors.rotation_user_ids}>
          <View className="flex-row flex-wrap gap-2">
            {members.map((member) => {
              const position = value.rotationUserIds.indexOf(member.user_id);
              const active = position !== -1;
              return (
                <Pressable
                  key={member.user_id}
                  onPress={() => toggleRotationMember(member.user_id)}
                  role="button"
                  aria-pressed={active}
                  className={cn("rounded-full px-4 py-2", active ? "bg-primary-soft" : "bg-secondary")}
                >
                  <Text className={cn("text-label-lg", active ? "text-primary-soft-foreground" : "text-muted-foreground")}>
                    {active ? `${position + 1}. ${member.name}` : member.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="text-body-sm text-muted-foreground">{t("addTask.assignment.rotationHint")}</Text>
        </FormField>
      )}
    </View>
  );
}
