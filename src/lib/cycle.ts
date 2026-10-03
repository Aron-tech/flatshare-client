import { HouseholdSettings, ResetPeriod } from "@/types/household";

const DAY = 24 * 60 * 60 * 1000;

/** The household's goal period; weekly starting on Monday without a setting. */
export function resetPeriodOf(settings?: HouseholdSettings | null): ResetPeriod {
  return settings?.reset?.period ?? "weekly";
}

/**
 * The point calculation cycle is weekly or monthly per the household setting: it lasts from 00:00 of the
 * chosen day (day of the week, or day of the month) to 00:00 of the next such day.
 */
export function currentCycle(settings?: HouseholdSettings | null, now: Date = new Date()) {
  const startsAt = new Date(now);
  startsAt.setHours(0, 0, 0, 0);
  const endsAt = new Date(startsAt);

  if (resetPeriodOf(settings) === "monthly") {
    const resetDay = settings?.reset?.day_of_month ?? 1;
    if (startsAt.getDate() < resetDay) {
      startsAt.setMonth(startsAt.getMonth() - 1);
    }
    startsAt.setDate(resetDay);
    endsAt.setTime(startsAt.getTime());
    endsAt.setMonth(endsAt.getMonth() + 1);
  } else {
    // ISO day (1 = Monday); getDay(): Sunday = 0
    const resetDay = settings?.reset?.day_of_week ?? 1;
    const isoDay = ((startsAt.getDay() + 6) % 7) + 1;
    startsAt.setDate(startsAt.getDate() - ((isoDay - resetDay + 7) % 7));
    endsAt.setTime(startsAt.getTime());
    endsAt.setDate(endsAt.getDate() + 7);
  }

  const elapsed = (now.getTime() - startsAt.getTime()) / (endsAt.getTime() - startsAt.getTime());
  const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / DAY));

  return { startsAt, endsAt, elapsedFraction: Math.min(1, Math.max(0, elapsed)), daysLeft };
}

export function daysUntil(iso: string, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now.getTime()) / DAY));
}
