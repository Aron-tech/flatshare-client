import type { HouseZoneState } from "@/types/house";
import { HOUSE_ZONES, type HouseZone } from "./scene.generated";

/**
 * A `categories.icon` szabad szöveg (lásd `components/category-icon.tsx`), ezért kulcsszavak alapján
 * dől el, melyik zónában látszik a kategória rendetlensége. A sorrend számít (pl. "dish" → konyha).
 */
const ZONE_HINTS: readonly (readonly [RegExp, HouseZone])[] = [
  [/utensil|kitchen|konyha|dish|edény|mosogat|cook|meal|food|főz/i, "kitchen"],
  [/bath|fürdő|toilet|wc|shower|zuhany/i, "bathroom"],
  [/shirt|laundry|mosás|ruha|cloth|vasal|iron/i, "laundry"],
  [/trash|szemét|garbage|bin|recycl|eco|kuka/i, "trash"],
  [/shop|cart|bevásár|grocer|vásárl/i, "shopping"],
  [/spray|clean|takarít|vacuum|floor|padló|porsz|sparkle|broom|söpr|living|nappali/i, "cleaning"],
];

/** A kategória (ikon, majd név alapján) melyik zónába tartozik; `null`, ha egyikbe sem. */
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
  /** A zóna kategóriáinak legnagyobb szintje (0–3). */
  level: number;
  open: number;
  dueToday: number;
  overdue: number;
}

/**
 * A backend kategóriánkénti állapotát zónákra vonja össze. A zónához nem rendelhető kategóriák
 * (és a kategória nélküli feladatok) az "egyéb" (`zone: null`) sorba kerülnek: a térképen nem
 * látszanak, de a hangulatba (backend) beszámítanak.
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
