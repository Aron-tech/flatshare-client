import { FormField, parsePositiveInt } from "@/components/add-task/form-field";
import { ChipGroup } from "@/components/ui/chip-group";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Category, CustomTaskFieldsDto, TASK_DIFFICULTIES, TaskDifficulty, TaskTemplate } from "@/types/task";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

export interface CustomTaskValue {
  /** A kitöltéshez használt sablon (nem kötelező). */
  templateId: number | null;
  icon: string | null;
  name: string;
  description: string;
  categoryId: number | null;
  duration: string;
  difficulty: TaskDifficulty;
  maxUser: string;
}

export const DEFAULT_CUSTOM_TASK: CustomTaskValue = {
  templateId: null,
  icon: null,
  name: "",
  description: "",
  categoryId: null,
  duration: "15",
  difficulty: "easy",
  maxUser: "1",
};

/** A backend mezőnevei, amelyekhez az egyedi űrlap hibát tud mutatni. */
export const CUSTOM_TASK_ERROR_FIELDS = [
  "name",
  "description",
  "category_id",
  "duration_minutes",
  "difficulty",
  "max_user",
] as const;

/** Az egyedi űrlap értékei a sablon adataival kitöltve. */
export function applyTemplate(value: CustomTaskValue, template: TaskTemplate): CustomTaskValue {
  return {
    ...value,
    templateId: template.id,
    icon: template.icon,
    name: template.name,
    description: template.description ?? "",
    categoryId: template.category_id,
    duration: String(template.duration_minutes),
    difficulty: template.difficulty,
    maxUser: String(template.max_user),
  };
}

/** Az egyedi feladat mezői a backend formátumában, vagy mezőnkénti hibák a backend mezőneveivel. */
export function toCustomTaskDto(
  value: CustomTaskValue,
  t: TFunction
): { dto: CustomTaskFieldsDto } | { errors: Record<string, string> } {
  const name = value.name.trim();
  const duration = parsePositiveInt(value.duration);
  const maxUser = parsePositiveInt(value.maxUser);

  const errors: Record<string, string> = {};
  if (name.length < 3) errors.name = t("addTask.nameTooShort");
  if (duration === null) errors.duration_minutes = t("addTask.invalidDuration");
  if (maxUser === null) errors.max_user = t("addTask.invalidMaxUser");
  if (Object.keys(errors).length > 0 || duration === null || maxUser === null) return { errors };

  return {
    dto: {
      name,
      description: value.description.trim() || null,
      category_id: value.categoryId,
      duration_minutes: duration,
      difficulty: value.difficulty,
      task_template_id: value.templateId,
      icon: value.icon,
      max_user: maxUser,
    },
  };
}

interface CustomTaskFieldsProps {
  value: CustomTaskValue;
  onChange: (value: CustomTaskValue) => void;
  categories: Category[];
  /** Mezőnkénti hibák a backend mezőneveivel. */
  errors?: Record<string, string>;
  /** Ha meg van adva, felül megjelenik a sablonválasztó, ami kitölti a többi mezőt. */
  templates?: TaskTemplate[] | null;
}

/** Egyedi feladat mezői: (opcionális sablon), név, leírás, kategória, időtartam, nehézség, vállalók száma. */
export function CustomTaskFields({ value, onChange, categories, errors = {}, templates }: CustomTaskFieldsProps) {
  const { t } = useTranslation();
  const set = (patch: Partial<CustomTaskValue>) => onChange({ ...value, ...patch });

  return (
    <>
      {templates !== undefined && (
        <FormField label={t("addTask.templateOptional")}>
          <SearchableSelect
            options={(templates ?? []).map((template) => ({
              value: template.id,
              label: template.name,
              description: template.category?.name,
            }))}
            value={value.templateId}
            onChange={(id) => {
              const template = templates?.find((candidate) => candidate.id === id);
              if (template) onChange(applyTemplate(value, template));
              else set({ templateId: null, icon: null });
            }}
            disabled={templates === null}
            placeholder={t("addTask.pickTemplateOptional")}
            searchPlaceholder={t("addTask.searchTemplates")}
            emptyText={t("addTask.noTemplates")}
          />
        </FormField>
      )}
      <FormField label={t("addTask.name")} error={errors.name}>
        <Input
          value={value.name}
          onChangeText={(name) => set({ name })}
          placeholder={t("addTask.namePlaceholder")}
          maxLength={125}
        />
      </FormField>
      <FormField label={t("addTask.description")} error={errors.description}>
        <Input
          value={value.description}
          onChangeText={(description) => set({ description })}
          placeholder={t("addTask.descriptionPlaceholder")}
          multiline
          className="h-24 py-3"
          textAlignVertical="top"
        />
      </FormField>
      {categories.length > 0 && (
        <FormField label={t("addTask.category")} error={errors.category_id}>
          <ChipGroup
            value={value.categoryId}
            // Az aktív kategóriára koppintva kategória nélküli lesz.
            onChange={(id) => set({ categoryId: id === value.categoryId ? null : id })}
            options={categories.map((category) => ({ value: category.id, label: category.name }))}
          />
        </FormField>
      )}
      <FormField label={t("addTask.duration")} error={errors.duration_minutes}>
        <Input
          value={value.duration}
          onChangeText={(duration) => set({ duration })}
          keyboardType="number-pad"
          maxLength={4}
          className="w-24"
        />
      </FormField>
      <FormField label={t("addTask.difficulty")} error={errors.difficulty}>
        <SegmentedControl
          activeTone="primary"
          value={value.difficulty}
          onChange={(difficulty) => set({ difficulty })}
          options={TASK_DIFFICULTIES.map((difficulty) => ({
            value: difficulty,
            label: t(`dashboard.difficulty.${difficulty}`),
          }))}
        />
      </FormField>
      <FormField label={t("addTask.maxUser")} error={errors.max_user}>
        <Input
          value={value.maxUser}
          onChangeText={(maxUser) => set({ maxUser })}
          keyboardType="number-pad"
          maxLength={2}
          className="w-24"
        />
      </FormField>
    </>
  );
}
