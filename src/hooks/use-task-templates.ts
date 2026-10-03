import { useAuth } from "@/context/AuthContext";
import { taskTemplateService } from "@/services/api/TaskTemplateService";
import { Category, TaskTemplate } from "@/types/task";
import { skipToken, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

/** The global templates rarely change. */
const TEMPLATES_STALE_TIME = 60 * 60 * 1000;

/** The global task templates (`null` while loading) and the categories in them. */
export function useTaskTemplates() {
  const { token } = useAuth();
  // The backend returns the names in the user's language, so there is a separate cache per language.
  const { i18n } = useTranslation();

  const { data, isError } = useQuery({
    queryKey: ["task-templates", i18n.language],
    queryFn: token ? () => taskTemplateService.getAll(token) : skipToken,
    staleTime: TEMPLATES_STALE_TIME,
    select: (templates) => ({ templates, categories: categoriesOf(templates) }),
  });

  // On an error (HttpClient already showed a toast) an empty list, so it does not load forever.
  return { templates: data?.templates ?? (isError ? [] : null), categories: data?.categories ?? [] };
}

/** The categories in the templates (there is no separate category endpoint). */
function categoriesOf(templates: TaskTemplate[]): Category[] {
  const byId = new Map<number, Category>();
  for (const template of templates) {
    if (template.category) byId.set(template.category.id, template.category);
  }
  return [...byId.values()].sort((a, b) => a.sort_order - b.sort_order);
}

/** Filter by name, case-insensitive. */
export function filterByName<T extends { name: string }>(items: T[], query: string): T[] {
  const needle = query.trim().toLowerCase();
  return needle ? items.filter((item) => item.name.toLowerCase().includes(needle)) : items;
}
