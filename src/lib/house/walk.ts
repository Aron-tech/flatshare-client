import { ROOMS, type RoomKey } from "./scene.generated";

/** A point on the floor (world coordinates, in floor tiles). */
export interface FloorPoint {
  x: number;
  z: number;
}

export function distance(a: FloorPoint, b: FloorPoint): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/** The facing (rotation around y) needed to walk from `from` towards `to`; 0 = towards +z. */
export function yawBetween(from: FloorPoint, to: FloorPoint): number {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

/** The shortest way from angle `from` to angle `to` (−π..π). */
export function angleDelta(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

/** Deterministic pseudo-random [0, 1) from `seed` (for the start positions). */
export function seeded(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

/** Room coordinate → world coordinate (with the room's offset). */
export function toWorld(room: RoomKey, point: FloorPoint): FloorPoint {
  const { offset } = ROOMS[room];
  return { x: point.x + offset.x, z: point.z + offset.z };
}
