// Single pet frames for the iOS widgets (`targets/widget/pets/`), cut from the picker's sprite atlases with
// macOS `sips`. Run after `npm run render`: `npm run widget`.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PETS } from "./pets.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const app = join(root, "..", "..");
const atlases = join(app, "assets", "house", "pets");
const out = join(app, "targets", "widget", "pets");

const generated = readFileSync(join(app, "src", "lib", "house", "pet-sprites.generated.ts"), "utf8");
const frameSize = Number(generated.match(/frame: \{ width: (\d+)/)[1]);
const columns = Number(generated.match(/columns: (\d+)/)[1]);
const animations = JSON.parse(generated.match(/animations: (\{.*?\}\}) as/)[1]);

/** Widget pose → atlas frame (a still frame that reads well without motion). */
const POSES = {
  happy: animations.happy.start + 2,
  // Not frame 0: `sips` ignores a 0,0 crop offset and crops the center instead.
  idle: animations.idle.start + 1,
  sad: animations.sad.start,
};

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const work = mkdtempSync(join(tmpdir(), "widget-pets-"));

for (const pet of PETS) {
  const png = join(work, `${pet}.png`);
  execFileSync("sips", ["-s", "format", "png", join(atlases, `${pet}.webp`), "--out", png], { stdio: "ignore" });
  for (const [pose, frame] of Object.entries(POSES)) {
    const target = join(out, `${pet}_${pose}.png`);
    const top = Math.floor(frame / columns) * frameSize;
    const left = (frame % columns) * frameSize;
    execFileSync("sips", ["-c", `${frameSize}`, `${frameSize}`, "--cropOffset", `${top}`, `${left}`, png, "--out", target], {
      stdio: "ignore",
    });
  }
}
rmSync(work, { recursive: true, force: true });
console.log(`${PETS.length * Object.keys(POSES).length} frames → targets/widget/pets`);
