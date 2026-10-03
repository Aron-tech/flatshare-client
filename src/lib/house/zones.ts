import type { HouseZoneState } from "@/types/house";
import { HOUSE_ZONES, type HouseZone } from "./scene.generated";

/**
 * `categories.icon` is free text (see `components/category-icon.tsx`), so keywords decide in which zone a
 * category's mess shows. The order matters (e.g. "dish" → kitchen).
 */
const ZONE_HINTS: readonly (readonly [RegExp, HouseZone])[] = [
  [/utensil|kitchen|konyha|dish|edény|mosogat|cook|meal|food|főz/i, "kitchen"],
  [/bath|fürdő|toilet|wc|shower|zuhany/i, "bathroom"],
  [/shirt|laundry|mosás|ruha|cloth|vasal|iron/i, "laundry"],
  [/trash|szemét|garbage|bin|recycl|eco|kuka/i, "trash"],
  [/shop|cart|bevásár|grocer|vásárl/i, "shopping"],
  [/spray|clean|takarít|vacuum|floor|padló|porsz|sparkle|broom|söpr|living|nappali/i, "cleaning"],
];

/** Which zone a category belongs to (by icon, then name); `null` if none. */
export function zoneOf(hints: readonly (string | null | undefined)[]): HouseZone | null {
  for (const hint of hints) {
    if (!hint) continue;
    const match = ZONE_HINTS.find(([pattern]) => pattern.test(hint));
    if (match) return match[1];
  }
  return null;
}

export type ZoneLevels = Record<HouseZone, number>;

export interface ZoneSummary {
  zone: HouseZone | null;
  /** The highest level of the zone's categories (0–3). */
  level: number;
  open: number;
  dueToday: number;
  overdue: number;
}

/**
 * Folds the backend's per-category state into zones. Categories that cannot be assigned to a zone (and tasks
 * without a category) go into the "other" (`zone: null`) row: they are not shown on the map but count towards
 * the mood (backend).
 */
export function summarizeZones(states: readonly HouseZoneState[]): { levels: ZoneLevels; summaries: ZoneSummary[] } {
  const levels = Object.fromEntries(HOUSE_ZONES.map((zone) => [zone, 0])) as ZoneLevels;
  const byZone = new Map<HouseZone | null, ZoneSummary>();
  for (const state of states) {
    const zone = zoneOf([state.category_icon, state.category_name]);
    const summary = byZone.get(zone) ?? { zone, level: 0, open: 0, dueToday: 0, overdue: 0 };
    summary.level = Math.max(summary.level, state.mess_level);
    summary.open += state.open;
    summary.dueToday += state.due_today;
    summary.overdue += state.overdue;
    byZone.set(zone, summary);
    if (zone) levels[zone] = Math.max(levels[zone], state.mess_level);
  }
  const summaries = [...byZone.values()].sort(
    (a, b) => b.level - a.level || b.overdue - a.overdue || (a.zone === null ? 1 : b.zone === null ? -1 : 0)
  );
  return { levels, summaries };
}
