import { ROOMS, type RoomKey } from "./scene.generated";

/** Pont a padlón (világkoordináta, padlólapban). */
export interface FloorPoint {
  x: number;
  z: number;
}

export function distance(a: FloorPoint, b: FloorPoint): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/** Az a nézési irány (y körüli elforgatás), amerre `from`-ból `to` felé menni kell; 0 = +z felé. */
export function yawBetween(from: FloorPoint, to: FloorPoint): number {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

/** A legrövidebb út `from` szögből `to` szögbe (−π..π). */
export function angleDelta(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

/** Determinisztikus álvéletlen [0, 1) a `seed` alapján (a kezdő helyekhez). */
export function seeded(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

/** Szoba-koordináta → világkoordináta (a szoba eltolásával). */
export function toWorld(room: RoomKey, point: FloorPoint): FloorPoint {
  const { offset } = ROOMS[room];
  return { x: point.x + offset.x, z: point.z + offset.z };
}
