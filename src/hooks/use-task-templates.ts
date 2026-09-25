import { useAuth } from "@/context/AuthContext";
import { taskTemplateService } from "@/services/api/TaskTemplateService";
import { Category, TaskTemplate } from "@/types/task";
import { useEffect, useMemo, useState } from "react";

/** A globális feladatsablonok (`null`, amíg töltenek) és a bennük szereplő kategóriák. */
export function useTaskTemplates() {
  const { token } = useAuth();
  const [templates, setTemplates] = useState<TaskTemplate[] | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    taskTemplateService
      .getAll(token)
      .then((list) => {
        if (!cancelled) setTemplates(list);
      })
      .catch(() => {
        // A hibát a HttpClient már toastban megjelenítette.
        if (!cancelled) setTemplates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const categories = useMemo(() => categoriesOf(templates ?? []), [templates]);

  return { templates, categories };
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
  return items.filter((item) => item.name.toLowerCase().includes(needle));
}
