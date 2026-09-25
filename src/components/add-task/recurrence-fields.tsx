import { FormField } from "@/components/add-task/form-field";
import { ChipGroup } from "@/components/ui/chip-group";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { RECURRENCE_UNITS, RecurrenceUnit } from "@/types/task";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

export interface RecurrenceValue {
  isRecurring: boolean;
  /** Szövegmező tartalma; beküldéskor egésszé alakítjuk. */
  interval: string;
  unit: RecurrenceUnit;
}

export const DEFAULT_RECURRENCE: RecurrenceValue = { isRecurring: false, interval: "1", unit: "week" };

/** A backend mezőnevei, amelyekhez az ismétlődés űrlap hibát tud mutatni. */
export const RECURRENCE_ERROR_FIELDS = ["is_recurring", "recurrence_interval", "recurrence_unit"] as const;

interface RecurrenceFieldsProps {
  value: RecurrenceValue;
  onChange: (value: RecurrenceValue) => void;
  /** Mezőnkénti hibák a backend mezőneveivel. */
  errors?: Record<string, string>;
}

/** Egyszeri / ismétlődő választó, ismétlődésnél gyakoriság és egység. */
export function RecurrenceFields({ value, onChange, errors = {} }: RecurrenceFieldsProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-4">
      <FormField label={t("addTask.frequency")} error={errors.is_recurring}>
        <SegmentedControl
          activeTone="primary"
          value={value.isRecurring ? "recurring" : "once"}
          onChange={(next) => onChange({ ...value, isRecurring: next === "recurring" })}
          options={[
            { value: "once" as const, label: t("addTask.once") },
            { value: "recurring" as const, label: t("addTask.recurring") },
          ]}
        />
      </FormField>

      {value.isRecurring && (
        <FormField label={t("addTask.every")} error={errors.recurrence_interval ?? errors.recurrence_unit}>
          <View className="gap-3">
            <Input
              value={value.interval}
              onChangeText={(interval) => onChange({ ...value, interval })}
              keyboardType="number-pad"
              maxLength={3}
              className="w-24"
            />
            <ChipGroup
              value={value.unit}
              onChange={(unit) => onChange({ ...value, unit })}
              options={RECURRENCE_UNITS.map((unit) => ({ value: unit, label: t(`addTask.units.${unit}`) }))}
            />
          </View>
        </FormField>
      )}
    </View>
  );
}
