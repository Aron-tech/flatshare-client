// Headless Chromium + helyi statikus szerver: a three.js jelenet a böngészőben (WebGL) renderel.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = dirname(fileURLToPath(import.meta.url));

const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".glb": "model/gltf-binary",
  ".png": "image/png",
  ".json": "application/json",
};

function serve() {
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
    const file = join(root, path);
    if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

/** Megnyitja a `page.html`-t, és visszaadja a böngésző lapot (a `window.studio` API-val). */
export async function openStudio() {
  const server = await serve();
  const browser = await chromium.launch({
    // A Playwright gyorsítótárában lévő Chromium (`npx playwright install chromium`).
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  const page = await browser.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") console.error("[page]", message.text());
  });
  page.on("pageerror", (error) => console.error("[page]", error));
  await page.goto(`http://127.0.0.1:${server.address().port}/page.html`);
  await page.waitForFunction(() => window.studio?.ready === true);
  return {
    page,
    close: async () => {
      await browser.close();
      server.close();
    },
  };
}
