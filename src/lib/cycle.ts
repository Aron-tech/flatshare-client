const DAY = 24 * 60 * 60 * 1000;

/**
 * A pontszámítási ciklus heti, hétfő 00:00-tól a következő hétfő 00:00-ig tart
 * (design: "Cycle Reset Schedule – Every Mon, 00:00").
 */
export function currentCycle(now: Date = new Date()) {
  const startsAt = new Date(now);
  startsAt.setHours(0, 0, 0, 0);
  // getDay(): vasárnap = 0 → hétfőhöz viszonyított eltolás
  startsAt.setDate(startsAt.getDate() - ((startsAt.getDay() + 6) % 7));
  const endsAt = new Date(startsAt.getTime() + 7 * DAY);

  const elapsed = (now.getTime() - startsAt.getTime()) / (7 * DAY);
  const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / DAY));

  return { startsAt, endsAt, elapsedFraction: Math.min(1, Math.max(0, elapsed)), daysLeft };
}

export function daysUntil(iso: string, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now.getTime()) / DAY));
}
