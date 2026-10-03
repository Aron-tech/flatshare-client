// A Ház nézet képeinek renderelése: `assets/house/` + `src/lib/house/scene.generated.ts`.
// Futtatás: `npm install && npm run fetch && npm run render` (ebben a mappában).
import { mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { openStudio } from "./harness.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const app = join(root, "..", "..");
const assets = join(app, "assets", "house");
const generated = join(app, "src", "lib", "house", "scene.generated.ts");

/** A választható állatok (a hal kimarad: a padlón nem tud sétálni). */
export const PETS = [
  "cat", "dog", "bunny", "fox", "panda", "penguin", "koala", "pig", "monkey", "lion", "tiger", "polar",
  "chick", "parrot", "bee", "beaver", "deer", "elephant", "giraffe", "cow", "hog", "crab", "caterpillar",
];

const save = (file, dataUrl) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
  return statSync(file).size;
};

/** Relatív útvonal a generált fájltól (a Metro statikus `require`-t vár). */
const asset = (file) => `require("${relative(dirname(generated), file)}")`;

rmSync(assets, { recursive: true, force: true });
const studio = await openStudio();
const { page } = studio;
const meta = await page.evaluate(() => window.studio.setup());
let total = 0;

const roomFile = join(assets, "room.webp");
total += save(roomFile, await page.evaluate(() => window.studio.renderRoom()));

const zones = await page.evaluate(() => window.studio.zones());
const mess = {};
for (const zone of zones) {
  mess[zone] = [];
  for (let level = 1; level <= 3; level++) {
    const layer = await page.evaluate(({ zone, level }) => window.studio.renderMess(zone, level), { zone, level });
    const file = join(assets, "mess", `${zone}-${level}.webp`);
    total += save(file, layer.data);
    mess[zone].push({ file, x: layer.x, y: layer.y, width: layer.width, height: layer.height });
  }
}

const frame = await page.evaluate(() => window.studio.petFrame());
const pets = {};
let atlasMeta = null;
for (const name of PETS) {
  const pet = await page.evaluate((name) => window.studio.renderPet(name), name);
  const file = join(assets, "pets", `${name}.webp`);
  const size = save(file, pet.data);
  total += size;
  pets[name] = file;
  atlasMeta ??= pet.meta;
  console.log(`${name}: ${(size / 1024).toFixed(0)} KB${pet.clipped ? `, ${pet.clipped} levágott képkocka!` : ""}`);
}
await studio.close();

const round = (n) => Math.round(n * 1000) / 1000;
const p = meta.projection;

const ts = `// GENERÁLT FÁJL – ne szerkeszd kézzel. Forrás: scripts/house-assets (npm run render).
// Modellek: Kenney Furniture Kit és Cube Pets (CC0, www.kenney.nl).
import type { ImageSourcePropType } from "react-native";

/** A szoba képének mérete (px); minden más pixeladat ehhez viszonyít. */
export const ROOM_IMAGE = {
  source: ${asset(roomFile)} as ImageSourcePropType,
  width: ${meta.room.width},
  height: ${meta.room.height},
} as const;

/** Padló (x, z) → kép pixel: u = u0 + ux·x + uz·z, v = v0 + vx·x + vz·z. */
export const FLOOR_PROJECTION = {
  u0: ${round(p.u0)},
  v0: ${round(p.v0)},
  ux: ${round(p.ux)},
  uz: ${round(p.uz)},
  vx: ${round(p.vx)},
  vz: ${round(p.vz)},
} as const;

export const HOUSE_ZONES = ${JSON.stringify(zones)} as const;
export type HouseZone = (typeof HOUSE_ZONES)[number];

export type Facing = "se" | "ne" | "sw" | "nw";

/** Ahova az állat a zóna rendbetételéhez megy, és amerre közben néz. */
export const ZONE_SPOTS: Record<HouseZone, { x: number; z: number; facing: Facing }> = ${JSON.stringify(meta.spots, null, 2)};

/** A bejárható padlórész. */
export const WALK_AREA = ${JSON.stringify(meta.walkArea)} as const;

export interface MessLayer {
  source: ImageSourcePropType;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Zónánként az 1–3. rendetlenség-szint rétege (a szoba képére kell illeszteni). */
export const MESS_LAYERS: Record<HouseZone, readonly [MessLayer, MessLayer, MessLayer]> = {
${zones
  .map(
    (zone) =>
      `  ${zone}: [\n${mess[zone]
        .map((l) => `    { source: ${asset(l.file)}, x: ${l.x}, y: ${l.y}, width: ${l.width}, height: ${l.height} },`)
        .join("\n")}\n  ],`
  )
  .join("\n")}
};

export const PET_IDS = ${JSON.stringify(PETS)} as const;
export type PetId = (typeof PET_IDS)[number];

export type PetAnimation = ${Object.keys(atlasMeta.animations).map((a) => JSON.stringify(a)).join(" | ")};

/**
 * Az állatok sprite-atlasza: \`columns\` oszlopos rács, képkockánként \`frame\` px; az (anchorX, anchorY)
 * pont áll a padlón. Az első \`perFacing\` kocka "se", a következő "ne" irányú (sw / nw = tükrözve).
 */
export const PET_ATLAS = {
  frame: { width: ${frame.width}, height: ${frame.height}, anchorX: ${frame.width / 2}, anchorY: ${Math.round(frame.height * frame.anchorY)} },
  columns: ${atlasMeta.columns},
  rows: ${atlasMeta.rows},
  perFacing: ${atlasMeta.perFacing},
  animations: ${JSON.stringify(atlasMeta.animations)} as Record<PetAnimation, { start: number; count: number; fps: number }>,
} as const;

export const PET_SOURCES: Record<PetId, ImageSourcePropType> = {
${PETS.map((name) => `  ${JSON.stringify(name).replace(/"/g, "")}: ${asset(pets[name])},`).join("\n")}
};
`;
mkdirSync(dirname(generated), { recursive: true });
writeFileSync(generated, ts);
console.log(`összesen: ${(total / 1024).toFixed(0)} KB → ${relative(app, assets)}, ${relative(app, generated)}`);
