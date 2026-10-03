// Sprite atlases for the character picker: `assets/house/pets/` + `src/lib/house/pet-sprites.generated.ts`.
// (The House view itself is 3D: `npm run export`.) Run: `npm install && npm run fetch && npm run render`.
import { mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { openStudio } from "./harness.mjs";
import { PETS } from "./pets.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const app = join(root, "..", "..");
const assets = join(app, "assets", "house", "pets");
const generated = join(app, "src", "lib", "house", "pet-sprites.generated.ts");

const save = (file, dataUrl) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
  return statSync(file).size;
};

/** Relative to the generated file (Metro needs a static `require`). */
const asset = (file) => `require("${relative(dirname(generated), file)}")`;

rmSync(assets, { recursive: true, force: true });
const studio = await openStudio();
const { page } = studio;
await page.evaluate(() => window.studio.setup());
let total = 0;

const frame = await page.evaluate(() => window.studio.petFrame());
const pets = {};
let atlasMeta = null;
for (const name of PETS) {
  const pet = await page.evaluate((name) => window.studio.renderPet(name), name);
  const file = join(assets, `${name}.webp`);
  const size = save(file, pet.data);
  total += size;
  pets[name] = file;
  atlasMeta ??= pet.meta;
  console.log(`${name}: ${(size / 1024).toFixed(0)} KB${pet.clipped ? `, ${pet.clipped} levágott képkocka!` : ""}`);
}
await studio.close();

const ts = `// GENERATED FILE – do not edit by hand. Source: scripts/house-assets (npm run render).
// Models: Kenney Cube Pets (CC0, www.kenney.nl).
import type { ImageSourcePropType } from "react-native";
import type { PetAnimation, PetId } from "./scene.generated";

export type SpriteFacing = "se" | "ne" | "sw" | "nw";

/**
 * Pet sprite atlas: a grid with \`columns\` columns, \`frame\` px per frame; the (anchorX, anchorY)
 * point sits on the floor. The first \`perFacing\` frames face "se", the next ones "ne" (sw / nw are mirrored).
 */
export const PET_ATLAS = {
  frame: { width: ${frame.width}, height: ${frame.height}, anchorX: ${frame.width / 2}, anchorY: ${Math.round(frame.height * frame.anchorY)} },
  columns: ${atlasMeta.columns},
  rows: ${atlasMeta.rows},
  perFacing: ${atlasMeta.perFacing},
  animations: ${JSON.stringify(atlasMeta.animations)} as Record<PetAnimation, { start: number; count: number; fps: number }>,
} as const;

export const PET_SOURCES: Record<PetId, ImageSourcePropType> = {
${PETS.map((name) => `  ${name}: ${asset(pets[name])},`).join("\n")}
};
`;
mkdirSync(dirname(generated), { recursive: true });
writeFileSync(generated, ts);
console.log(`összesen: ${(total / 1024).toFixed(0)} KB → ${relative(app, assets)}, ${relative(app, generated)}`);
