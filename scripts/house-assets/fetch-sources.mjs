// Downloads the Kenney CC0 packs into `.cache/` (not versioned, the render works from it).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const cache = join(root, ".cache");

/** https://kenney.nl/assets/cube-pets and https://kenney.nl/assets/furniture-kit (CC0). */
const SOURCES = [
  {
    name: "cube-pets",
    url: "https://kenney.nl/media/pages/assets/cube-pets/44e58e945f-1774520254/kenney_cube-pets_1.0.zip",
  },
  {
    name: "furniture-kit",
    url: "https://kenney.nl/media/pages/assets/furniture-kit/440e0608a4-1677580847/kenney_furniture-kit.zip",
  },
];

mkdirSync(cache, { recursive: true });

for (const source of SOURCES) {
  const target = join(cache, source.name);
  if (existsSync(target)) {
    console.log(`${source.name}: már letöltve`);
    continue;
  }
  const response = await fetch(source.url);
  if (!response.ok) throw new Error(`${source.name}: ${response.status} ${response.statusText}`);
  const zip = join(cache, `${source.name}.zip`);
  mkdirSync(dirname(zip), { recursive: true });
  writeFileSync(zip, Buffer.from(await response.arrayBuffer()));
  execFileSync("unzip", ["-q", "-o", zip, "-d", target]);
  console.log(`${source.name}: kész`);
}
