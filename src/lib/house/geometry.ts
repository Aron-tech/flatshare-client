import { FLOOR_PROJECTION, WALK_AREA, type Facing } from "./scene.generated";

export interface FloorPoint {
  x: number;
  z: number;
}

/** Padló pont → a szoba képének pixele (a kép eredeti méretében). */
export function floorToImage({ x, z }: FloorPoint): { u: number; v: number } {
  const p = FLOOR_PROJECTION;
  return { u: p.u0 + p.ux * x + p.uz * z, v: p.v0 + p.vx * x + p.vz * z };
}

/** A kép pixele → padló pont (pl. megszakított séta közbeni hely). */
export function imageToFloor(u: number, v: number): FloorPoint {
  const p = FLOOR_PROJECTION;
  const det = p.ux * p.vz - p.uz * p.vx;
  const du = u - p.u0;
  const dv = v - p.v0;
  return { x: (du * p.vz - dv * p.uz) / det, z: (p.ux * dv - p.vx * du) / det };
}

/** A képen mutatott mozgásirány: jobbra-le "se", jobbra-fel "ne", balra-le "sw", balra-fel "nw". */
export function facingBetween(from: FloorPoint, to: FloorPoint): Facing {
  const a = floorToImage(from);
  const b = floorToImage(to);
  const right = b.u >= a.u;
  const down = b.v >= a.v;
  if (right) return down ? "se" : "ne";
  return down ? "sw" : "nw";
}

export function distance(a: FloorPoint, b: FloorPoint): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/** Távolabb lévő (a képen lejjebb lévő) elemek kerülnek előre. */
export function depthOf({ x, z }: FloorPoint): number {
  return Math.round((x + z) * 100);
}

/** Determinisztikus álvéletlen [0, 1) a `seed` alapján (a kezdő helyekhez). */
export function seeded(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export function randomWalkPoint(random: () => number = Math.random): FloorPoint {
  return {
    x: WALK_AREA.minX + (WALK_AREA.maxX - WALK_AREA.minX) * random(),
    z: WALK_AREA.minZ + (WALK_AREA.maxZ - WALK_AREA.minZ) * random(),
  };
}
