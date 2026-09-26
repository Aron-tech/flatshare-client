// Legenerálja a `src/theme/fluent-color-icons.ts`-t a Fluent UI System Color
// készletből (MIT, @iconify-json/fluent-color). Csak a használt ikonok kerülnek
// a bundle-be. Futtatás: `node scripts/generate-color-icons.mjs`
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { icons } = JSON.parse(readFileSync(require.resolve("@iconify-json/fluent-color/icons.json"), "utf8"));

// Az `icon-sets.ts` COLOR_MAP-jében hivatkozott nevek (24px-es változat).
const NAMES = [
  "arrow-sync", "building-store", "calendar", "calendar-clock", "checkmark-circle",
  "clipboard-task", "clock", "clock-alarm", "data-bar-vertical-ascending", "edit",
  "error-circle", "food", "gift", "history", "home", "person-warning", "poll",
  "settings", "shield-checkmark", "star", "trophy",
];

const lines = NAMES.map((name) => {
  const icon = icons[`${name}-24`];
  if (!icon) throw new Error(`Hiányzó ikon: ${name}-24`);
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${icon.body}</svg>`;
  return `  ${JSON.stringify(name)}: ${JSON.stringify(xml)},`;
});

writeFileSync(
  new URL("../src/theme/fluent-color-icons.ts", import.meta.url),
  `// GENERÁLT FÁJL – ne szerkeszd kézzel: node scripts/generate-color-icons.mjs
// Fluent UI System Color Icons © Microsoft, MIT licenc.
export const FLUENT_COLOR_XML = {
${lines.join("\n")}
} as const;

export type FluentColorName = keyof typeof FLUENT_COLOR_XML;
`,
);
