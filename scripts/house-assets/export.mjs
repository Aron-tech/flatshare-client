// A Ház nézet 3D jelenetének exportja: `assets/house/3d/` + `src/lib/house/scene.generated.ts`.
// Futtatás: `npm install && npm run fetch && npm run export` (ebben a mappában).
import { copyFileSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { openStudio } from "./harness.mjs";
import { PETS } from "./pets.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const app = join(root, "..", "..");
const assets = join(app, "assets", "house", "3d");
const generated = join(app, "src", "lib", "house", "scene.generated.ts");
const colormap = join(root, ".cache", "cube-pets", "Models", "GLB format", "Textures", "colormap.png");

/** Az állatok mérete a bútorokhoz képest (eredetileg ~1,6 egység magasak); a studio.js PET_SCALE-je. */
const PET_SCALE = 0.3;

const save = (file, base64) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(base64, "base64"));
  return statSync(file).size;
};

/** Relatív útvonal a generált fájltól (a Metro statikus `require`-t vár). */
const asset = (file) => `require("${relative(dirname(generated), file)}")`;
const round = (n) => Math.round(n * 1000) / 1000;

rmSync(assets, { recursive: true, force: true });
const studio = await openStudio();
const { page } = studio;
await page.evaluate(() => window.studio.setup());
let total = 0;

const zones = await page.evaluate(() => window.studio.zones());
const rooms = { main: await page.evaluate(() => window.studio.exportRoom()) };
for (const key of await page.evaluate(() => window.studio.extraRooms())) {
  rooms[key] = await page.evaluate((key) => window.studio.exportExtraRoom(key), key);
}
const roomFiles = {};
for (const [key, room] of Object.entries(rooms)) {
  roomFiles[key] = join(assets, `room-${key}.glb`);
  total += save(roomFiles[key], room.data);
  console.log(`room-${key}: ${(statSync(roomFiles[key]).size / 1024).toFixed(0)} KB`);
}

const pets = {};
let petHeight = 0;
for (const name of PETS) {
  const pet = await page.evaluate((name) => window.studio.exportPet(name), name);
  const file = join(assets, "pets", `${name}.glb`);
  total += save(file, pet.data);
  pets[name] = file;
  petHeight = Math.max(petHeight, pet.height * PET_SCALE);
}
const colormapFile = join(assets, "pets", "colormap.png");
copyFileSync(colormap, colormapFile);
total += statSync(colormapFile).size;
await studio.close();

const ts = `// GENERÁLT FÁJL – ne szerkeszd kézzel. Forrás: scripts/house-assets (npm run export).
// Modellek: Kenney Furniture Kit és Cube Pets (CC0, www.kenney.nl).

export const HOUSE_ZONES = ${JSON.stringify(zones)} as const;
export type HouseZone = (typeof HOUSE_ZONES)[number];

export const PET_IDS = ${JSON.stringify(PETS)} as const;
export type PetId = (typeof PET_IDS)[number];

/** Az állat GLB-kben lévő animációk (a Kenney klipek átnevezve). */
export type PetAnimation = "idle" | "walk" | "work" | "happy" | "cheer" | "sad";

/** A fő szoba mindig megvan, a többit a tagok pontokból építik (backend: HouseRoomEnum). */
export const ROOM_KEYS = ${JSON.stringify(Object.keys(rooms))} as const;
export type RoomKey = (typeof ROOM_KEYS)[number];

export interface RoomSpot {
  x: number;
  z: number;
  /** Nézési irány: y körüli elforgatás (radián); 0 = +z felé. */
  yaw: number;
}

export interface RoomDefinition {
  /** GLB: \`furniture\` csoport + \`mess_<zóna>_<1..3>\` csoportok (kumulatív szintek). */
  model: number;
  /** A szoba helye a házban (világkoordináta, padlólapban); a szoba saját koordinátái ehhez adódnak. */
  offset: { x: number; z: number };
  size: { x: number; z: number };
  /** A padló teteje (ezen állnak az állatok). */
  floorY: number;
  bounds: { min: [number, number, number]; max: [number, number, number] };
  walkArea: { minX: number; maxX: number; minZ: number; maxZ: number };
  /** A szoba zónáinak helye (ahova az állat rendet rakni megy). */
  spots: Partial<Record<HouseZone, RoomSpot>>;
}

export const ROOMS: Record<RoomKey, RoomDefinition> = {
${Object.entries(rooms)
  .map(([key, { meta: m }]) => `  ${key}: {
    model: ${asset(roomFiles[key])},
    offset: ${JSON.stringify(m.offset)},
    size: ${JSON.stringify(m.size)},
    floorY: ${m.floorY},
    bounds: { min: ${JSON.stringify(m.bounds.min.map(round))}, max: ${JSON.stringify(m.bounds.max.map(round))} },
    walkArea: ${JSON.stringify(m.walkArea)},
    spots: ${JSON.stringify(Object.fromEntries(Object.entries(m.spots).map(([k, sp]) => [k, { x: sp.x, z: sp.z, yaw: round(sp.yaw) }])))},
  },`)
  .join("\n")}
};

/** A mess csoport neve a szoba GLB-jében. */
export const messNodeName = (zone: HouseZone, level: 1 | 2 | 3) => \`mess_\${zone}_\${level}\`;

export const PET_SCALE = ${PET_SCALE};
/** A legmagasabb állat magassága (világegység), a név/buborék elhelyezéséhez. */
export const PET_HEIGHT = ${round(petHeight)};

/** Közös textúra minden állathoz (a GLB-k anyagai textúra nélküliek). */
export const PET_COLORMAP: number = ${asset(colormapFile)};

export const PET_MODELS: Record<PetId, number> = {
${PETS.map((name) => `  ${name}: ${asset(pets[name])},`).join("\n")}
};
`;
mkdirSync(dirname(generated), { recursive: true });
writeFileSync(generated, ts);
console.log(`összesen: ${(total / 1024).toFixed(0)} KB → ${relative(app, assets)}, ${relative(app, generated)}`);
