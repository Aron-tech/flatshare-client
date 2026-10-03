// Ellenőrző képek a `preview/` mappába: a szoba 0–3. rendetlenség-szinten, néhány állattal.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { openStudio } from "./harness.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "preview");
mkdirSync(out, { recursive: true });

const save = (name, dataUrl) => writeFileSync(join(out, name), Buffer.from(dataUrl.split(",")[1], "base64"));

const studio = await openStudio();
const meta = await studio.page.evaluate(() => window.studio.setup());
console.log(JSON.stringify(meta));
const pets = [
  { name: "cat", x: 1.4, z: 0.85, rotation: Math.PI, animation: "eat" },
  { name: "dog", x: 2.4, z: 2.3, animation: "idle" },
  { name: "penguin", x: 3.0, z: 3.0, rotation: Math.PI / 2, animation: "walk" },
  { name: "fox", x: 0.85, z: 2.5, rotation: -Math.PI / 2, animation: "dance" },
];
for (const level of [0, 3]) {
  save(`level-${level}.png`, await studio.page.evaluate(({ level, pets }) => window.studio.renderPreview(level, pets), { level, pets }));
}
await studio.close();
