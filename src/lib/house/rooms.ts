import type { HouseRoomState } from "@/types/house";
import { HOUSE_ZONES, ROOMS, type HouseZone, type RoomKey, type RoomSpot } from "./scene.generated";
import { toWorld, type FloorPoint } from "./walk";
import type { ZoneLevels } from "./zones";

/** A ház aktuális alaprajza: a megépült szobák és hogy melyik zóna hol van. */
export interface HouseLayout {
  /** A fő szoba mindig az első. */
  rooms: RoomKey[];
  zoneRooms: Record<HouseZone, RoomKey>;
}

export const MAIN_ONLY: HouseLayout = {
  rooms: ["main"],
  zoneRooms: Object.fromEntries(HOUSE_ZONES.map((zone) => [zone, "main"])) as Record<HouseZone, RoomKey>,
};

/** A megépült szobák kulcsai (stabil szöveg, memoizáláshoz); az app által nem ismert szoba kimarad. */
export function unlockedRoomKeys(rooms: readonly HouseRoomState[] | undefined): string {
  return (rooms ?? [])
    .filter((room) => room.unlocked && room.key in ROOMS)
    .map((room) => room.key)
    .join(",");
}

/**
 * A megépült szobák átveszik a zónáikat (a szoba modelljében lévő zónahelyek szerint, ugyanazok,
 * mint a backend HouseRoomEnum::zones()), a többi a fő szobában marad.
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

/** A szoba saját zónáinak szintjei (a máshova költözött zónák itt rendben vannak). */
export function roomLevels(room: RoomKey, levels: ZoneLevels, layout: HouseLayout): ZoneLevels {
  return Object.fromEntries(HOUSE_ZONES.map((zone) => [zone, layout.zoneRooms[zone] === room ? levels[zone] : 0])) as ZoneLevels;
}

/** A zóna helye (világkoordináta) és az állat nézési iránya ott. */
export function zoneSpot(zone: HouseZone, layout: HouseLayout): (RoomSpot & { room: RoomKey }) | null {
  const room = layout.zoneRooms[zone];
  const spot = ROOMS[room].spots[zone];
  if (!spot) return null;
  return { ...spot, ...toWorld(room, spot), room };
}

/** Melyik szobában van a pont (a szoba alapterülete szerint). */
export function roomAt(point: FloorPoint, rooms: readonly RoomKey[]): RoomKey {
  for (const key of rooms) {
    const { offset, size } = ROOMS[key];
    if (point.x >= offset.x && point.x <= offset.x + size.x && point.z >= offset.z && point.z <= offset.z + size.z) return key;
  }
  return "main";
}

/** A fő szoba közepe: két mellékszoba között ezen át vezet az út (a szobák sarka nem érintkezik). */
const HUB: FloorPoint = toWorld("main", { x: 2.4, z: 2.4 });

/** Útvonal `from`-ból `to`-ba: egyenesen, vagy két mellékszoba között a fő szobán át. */
export function pathBetween(from: FloorPoint, to: FloorPoint, rooms: readonly RoomKey[]): FloorPoint[] {
  const a = roomAt(from, rooms);
  const b = roomAt(to, rooms);
  return a !== b && a !== "main" && b !== "main" ? [HUB, to] : [to];
}

/** Véletlen sétacél: a megépült szobák egyikében (a nagyobb szoba gyakrabban). */
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
