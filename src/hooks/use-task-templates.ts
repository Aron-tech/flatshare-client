import { useAuth } from "@/context/AuthContext";
import { taskTemplateService } from "@/services/api/TaskTemplateService";
import { Category, TaskTemplate } from "@/types/task";
import { skipToken, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

/** A globális sablonok ritkán változnak. */
const TEMPLATES_STALE_TIME = 60 * 60 * 1000;

/** A globális feladatsablonok (`null`, amíg töltenek) és a bennük szereplő kategóriák. */
export function useTaskTemplates() {
  const { token } = useAuth();
  // A backend a felhasználó nyelvén adja a neveket, ezért nyelvenként külön cache.
  const { i18n } = useTranslation();

  const { data, isError } = useQuery({
    queryKey: ["task-templates", i18n.language],
    queryFn: token ? () => taskTemplateService.getAll(token) : skipToken,
    staleTime: TEMPLATES_STALE_TIME,
    select: (templates) => ({ templates, categories: categoriesOf(templates) }),
  });

  // Hibánál (a HttpClient már toastot mutatott) üres lista, hogy ne töltsön a végtelenségig.
  return { templates: data?.templates ?? (isError ? [] : null), categories: data?.categories ?? [] };
}

/** A sablonokban szereplő kategóriák (külön kategória-végpont nincs). */
function categoriesOf(templates: TaskTemplate[]): Category[] {
  const byId = new Map<number, Category>();
  for (const template of templates) {
    if (template.category) byId.set(template.category.id, template.category);
  }
  return [...byId.values()].sort((a, b) => a.sort_order - b.sort_order);
}

/** Név szerinti, kis-nagybetű független szűrés. */
export function filterByName<T extends { name: string }>(items: T[], query: string): T[] {
  const needle = query.trim().toLowerCase();
  return needle ? items.filter((item) => item.name.toLowerCase().includes(needle)) : items;
}
