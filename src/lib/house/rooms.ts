import type { HouseRoomState } from "@/types/house";
import { HOUSE_ZONES, ROOMS, type HouseZone, type RoomKey, type RoomSpot } from "./scene.generated";
import { toWorld, type FloorPoint } from "./walk";
import type { ZoneLevels } from "./zones";

/** The house's current floor plan: the built rooms and where each zone is. */
export interface HouseLayout {
  /** The main room is always the first. */
  rooms: RoomKey[];
  zoneRooms: Record<HouseZone, RoomKey>;
}

export const MAIN_ONLY: HouseLayout = {
  rooms: ["main"],
  zoneRooms: Object.fromEntries(HOUSE_ZONES.map((zone) => [zone, "main"])) as Record<HouseZone, RoomKey>,
};

/** Keys of the built rooms (stable string, for memoization); a room this app does not know is left out. */
export function unlockedRoomKeys(rooms: readonly HouseRoomState[] | undefined): string {
  return (rooms ?? [])
    .filter((room) => room.unlocked && room.key in ROOMS)
    .map((room) => room.key)
    .join(",");
}

/**
 * The built rooms take over their zones (by the zone spots in the room's model, the same as the backend's
 * HouseRoomEnum::zones()), the rest stay in the main room.
 */
export function houseLayout(unlockedKeys: string): HouseLayout {
  const unlocked = unlockedKeys ? (unlockedKeys.split(",") as RoomKey[]) : [];
  if (unlocked.length === 0) return MAIN_ONLY;
  const zoneRooms = { ...MAIN_ONLY.zoneRooms };
  for (const room of unlocked) {
    for (const zone of Object.keys(ROOMS[room].spots) as HouseZone[]) zoneRooms[zone] = room;
  }
  return { rooms: ["main", ...unlocked], zoneRooms };
}

/** Levels of the room's own zones (zones moved elsewhere are tidy here). */
export function roomLevels(room: RoomKey, levels: ZoneLevels, layout: HouseLayout): ZoneLevels {
  return Object.fromEntries(HOUSE_ZONES.map((zone) => [zone, layout.zoneRooms[zone] === room ? levels[zone] : 0])) as ZoneLevels;
}

/** The zone's position (world coordinates) and the pet's facing there. */
export function zoneSpot(zone: HouseZone, layout: HouseLayout): (RoomSpot & { room: RoomKey }) | null {
  const room = layout.zoneRooms[zone];
  const spot = ROOMS[room].spots[zone];
  if (!spot) return null;
  return { ...spot, ...toWorld(room, spot), room };
}

/** Which room the point is in (by the room's floor area). */
export function roomAt(point: FloorPoint, rooms: readonly RoomKey[]): RoomKey {
  for (const key of rooms) {
    const { offset, size } = ROOMS[key];
    if (point.x >= offset.x && point.x <= offset.x + size.x && point.z >= offset.z && point.z <= offset.z + size.z) return key;
  }
  return "main";
}

/** The middle of the main room: the path between two side rooms goes through it (the rooms' corners do not touch). */
const HUB: FloorPoint = toWorld("main", { x: 2.4, z: 2.4 });

/** Path from `from` to `to`: straight, or between two side rooms through the main room. */
export function pathBetween(from: FloorPoint, to: FloorPoint, rooms: readonly RoomKey[]): FloorPoint[] {
  const a = roomAt(from, rooms);
  const b = roomAt(to, rooms);
  return a !== b && a !== "main" && b !== "main" ? [HUB, to] : [to];
}

/** Random walk target: in one of the built rooms (the larger room more often). */
export function randomWalkTarget(rooms: readonly RoomKey[], random: () => number = Math.random): FloorPoint {
  const weights = rooms.map((key) => (key === "main" ? 2 : 1));
  let roll = random() * weights.reduce((sum, w) => sum + w, 0);
  let room = rooms[0];
  for (let i = 0; i < rooms.length; i++) {
    roll -= weights[i];
    if (roll <= 0) {
      room = rooms[i];
      break;
    }
  }
  const area = ROOMS[room].walkArea;
  return toWorld(room, {
    x: area.minX + (area.maxX - area.minX) * random(),
    z: area.minZ + (area.maxZ - area.minZ) * random(),
  });
}
