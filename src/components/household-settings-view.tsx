import { FormField } from "@/components/add-task/form-field";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chip-group";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Text } from "@/components/ui/text";
import { useHousehold } from "@/context/HouseholdContext";
import { currentLocale } from "@/i18n";
import { alertError } from "@/lib/errors";
import { Household, RESET_PERIODS, ResetPeriod } from "@/types/household";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

const DAYS_OF_MONTH = Array.from({ length: 28 }, (_, index) => index + 1);

/** ISO napok (1 = hétfő) a jelenlegi nyelv rövid napneveivel. */
function weekdayOptions() {
  // 2024-01-01 hétfőre esett, innen lépkedünk előre.
  return Array.from({ length: 7 }, (_, index) => ({
    value: index + 1,
    label: new Date(2024, 0, 1 + index).toLocaleDateString(currentLocale(), {
      weekday: "short",
    }),
  }));
}

type Props = {
  household: Household;
  onBack: () => void;
};

export function HouseholdSettingsView({ household, onBack }: Props) {
  const { t } = useTranslation();
  const { updateHouseholdSettings } = useHousehold();

  const reset = household.settings?.reset;
  const [period, setPeriod] = useState<ResetPeriod>(reset?.period ?? "weekly");
  const [dayOfWeek, setDayOfWeek] = useState(reset?.day_of_week ?? 1);
  const [dayOfMonth, setDayOfMonth] = useState(reset?.day_of_month ?? 1);
  const [saving, setSaving] = useState(false);

  const weekdays = useMemo(() => weekdayOptions(), []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateHouseholdSettings(
        household.id,
        period === "weekly"
          ? { reset_period: period, reset_day_of_week: dayOfWeek }
          : { reset_period: period, reset_day_of_month: dayOfMonth },
      );
      onBack();
    } catch (error) {
      alertError(error, t("householdSettings.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-background p-6">
      <Text variant="h3" className="mb-1">
        {t("householdSettings.title")}
      </Text>
      <Text variant="muted" className="mb-6">
        {household.name}
      </Text>

      <ScrollView className="flex-1" contentContainerClassName="gap-6">
        <FormField label={t("householdSettings.resetPeriod")}>
          <SegmentedControl
            activeTone="primary"
            value={period}
            onChange={setPeriod}
            options={RESET_PERIODS.map((value) => ({
              value,
              label: t(`householdSettings.periods.${value}`),
            }))}
          />
        </FormField>

        {period === "weekly" ? (
          <FormField label={t("householdSettings.resetDayOfWeek")}>
            <ChipGroup value={dayOfWeek} onChange={setDayOfWeek} options={weekdays} />
          </FormField>
        ) : (
          <FormField label={t("householdSettings.resetDayOfMonth")}>
            <ChipGroup
              value={dayOfMonth}
              onChange={setDayOfMonth}
              options={DAYS_OF_MONTH.map((day) => ({
                value: day,
                label: `${day}.`,
              }))}
            />
          </FormField>
        )}

        <Text variant="muted">
          {period === "weekly"
            ? t("householdSettings.weeklyHint")
            : t("householdSettings.monthlyHint")}
        </Text>
      </ScrollView>

      <View className="mt-4 gap-3">
        <Button size="lg" variant="default" disabled={saving} onPress={handleSave}>
          <Text>{t("common.save")}</Text>
        </Button>
        <Button size="lg" variant="ghost" disabled={saving} onPress={onBack}>
          <Text>{t("common.back")}</Text>
        </Button>
      </View>
    </View>
  );
}
