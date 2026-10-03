import type { HouseMoodBand } from "@/types/house";
import type { TFunction } from "i18next";
import type { HouseZone } from "./scene.generated";
import type { ZoneLevels } from "./zones";

/** Két megszólalás közti szünet (ms): véletlenszerűen e között. */
export const SPEECH_GAP_MS = { min: 12000, max: 25000 } as const;
/** Ennyi ideig látszik egy buborék. */
export const SPEECH_VISIBLE_MS = 4000;

function pick<T>(items: readonly T[], random: () => number): T | undefined {
  return items.length ? items[Math.floor(random() * items.length)] : undefined;
}

function lines(t: TFunction, key: string, values: Record<string, string> = {}): string[] {
  const value = t(key, { returnObjects: true, ...values });
  return Array.isArray(value) ? (value as string[]) : [];
}

/** A legrendetlenebb zóna (holtversenyben véletlenszerű), ha van rendetlenség. */
export function messiestZone(levels: ZoneLevels, random: () => number = Math.random): HouseZone | null {
  const max = Math.max(0, ...Object.values(levels));
  if (max === 0) return null;
  return pick((Object.keys(levels) as HouseZone[]).filter((zone) => levels[zone] === max), random) ?? null;
}

/**
 * Egy állat mondata a ház állapotáról: morcos / szomorú hangulatban gyakran a legrendetlenebb
 * zónát említi, különben a hangulat általános mondatai közül választ.
 */
export function moodLine(t: TFunction, mood: HouseMoodBand, levels: ZoneLevels, random: () => number = Math.random): string | null {
  const zone = messiestZone(levels, random);
  const mentionZone = zone && (mood === "grumpy" || mood === "sad" ? random() < 0.6 : random() < 0.25);
  if (zone && mentionZone) {
    const line = pick(lines(t, "house.speech.zone", { zone: t(`house.zones.${zone}`).toLowerCase() }), random);
    if (line) return line;
  }
  return pick(lines(t, `house.speech.${mood}`), random) ?? null;
}

/** Elvégzett takarítás után. */
export function doneLine(t: TFunction, random: () => number = Math.random): string | null {
  return pick(lines(t, "house.speech.done"), random) ?? null;
}
