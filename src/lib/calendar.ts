import { resetPeriodOf } from "@/lib/cycle";
import { CalendarEvent, CalendarView } from "@/types/calendar";
import { HouseholdSettings } from "@/types/household";

/** The default view per the household's point calculation period: weekly → weekly, monthly → monthly. */
export function defaultCalendarView(settings?: HouseholdSettings | null): CalendarView {
  return resetPeriodOf(settings) === "monthly" ? "month" : "week";
}

/** First day of the week (per getDay(), 0 = Sunday): the reset day for a weekly period, otherwise Monday. */
export function weekStartDay(settings?: HouseholdSettings | null): number {
  const isoDay = resetPeriodOf(settings) === "weekly" ? (settings?.reset?.day_of_week ?? 1) : 1;
  return isoDay % 7;
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function startOfWeek(date: Date, firstDay: number): Date {
  const day = startOfDay(date);
  return addDays(day, -((day.getDay() - firstDay + 7) % 7));
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

/** Key of a local calendar day (`YYYY-MM-DD`). */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * The period shown in the view [from, to). The monthly view shows whole weeks,
 * so it also contains the days before and after the month.
 */
export function visibleRange(view: CalendarView, anchor: Date, firstDay: number): { from: Date; to: Date } {
  if (view === "day") {
    const from = startOfDay(anchor);
    return { from, to: addDays(from, 1) };
  }
  if (view === "week") {
    const from = startOfWeek(anchor, firstDay);
    return { from, to: addDays(from, 7) };
  }
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const from = startOfWeek(monthStart, firstDay);
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
  const weeks = Math.ceil((monthEnd.getTime() - from.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return { from, to: addDays(from, weeks * 7) };
}

/** Steps forward/back by the view's unit. */
export function shiftAnchor(view: CalendarView, anchor: Date, direction: 1 | -1): Date {
  if (view === "day") return addDays(anchor, direction);
  if (view === "week") return addDays(anchor, 7 * direction);
  return new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1);
}

/** The events by day (local time), in chronological order. */
export function groupByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const groups = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const key = dayKey(new Date(event.at));
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return groups;
}
