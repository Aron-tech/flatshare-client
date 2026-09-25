import { currentLocale } from "@/i18n";
import { RecurrenceUnit } from "@/types/task";
import { TFunction } from "i18next";

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(currentLocale(), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Határidő emberi formában: "Ma, 21:00-ig", "Holnap, 08:00", "Szombat, 15:00"… */
export function formatDue(dueAt: string | null, t: TFunction): string {
  if (!dueAt) return t("format.noDeadline");
  const date = new Date(dueAt);
  const now = new Date();
  const diffDays = Math.round((startOfDay(date) - startOfDay(now)) / DAY);
  const time = formatTime(date);

  if (date < now) return t("format.overdue", { time });
  if (diffDays === 0) return t("format.today", { time });
  if (diffDays === 1) return t("format.tomorrow", { time });
  if (diffDays < 7) {
    const weekday = date.toLocaleDateString(currentLocale(), { weekday: "long" });
    return t("format.weekday", {
      weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
      time,
    });
  }
  return date.toLocaleDateString(currentLocale(), { month: "short", day: "numeric" });
}

export function isOverdue(dueAt: string | null): boolean {
  return !!dueAt && new Date(dueAt) < new Date();
}

/** "2 órája", "Ma, 09:15", "Tegnap, 18:40"… */
export function formatTimeAgo(iso: string, t: TFunction): string {
  const date = new Date(iso);
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return t("format.justNow");
  if (diffMin < 60) return t("format.minutesAgo", { count: diffMin });
  if (diffMin < 6 * 60) return t("format.hoursAgo", { count: Math.round(diffMin / 60) });
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY);
  if (diffDays === 0) return t("format.todayAt", { time: formatTime(date) });
  if (diffDays === 1) return t("format.yesterdayAt", { time: formatTime(date) });
  return date.toLocaleDateString(currentLocale(), { month: "short", day: "numeric" });
}

export function formatRecurrence(
  isRecurring: boolean,
  interval: number | null,
  unit: RecurrenceUnit | null,
  t: TFunction
): string {
  if (!isRecurring || !unit) return t("format.recurrence.once");
  const count = interval ?? 1;
  return count === 1
    ? t(`format.recurrence.${unit}`)
    : t(`format.recurrence.${unit}Interval`, { count });
}

export function initials(firstName?: string | null, lastName?: string | null): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

/** "Márton T." */
export function shortName(firstName: string, lastName: string): string {
  return lastName ? `${firstName} ${lastName[0]}.` : firstName;
}

/** Napszak szerinti köszönés kulcsa. */
export function greetingKey(date: Date = new Date()): "morning" | "afternoon" | "evening" {
  const hour = date.getHours();
  if (hour < 10) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
