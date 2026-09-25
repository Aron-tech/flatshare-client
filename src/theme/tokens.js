/**
 * Design tokenek (DESIGN.md – "Warm Organic Minimalist").
 *
 * Ez a fájl az egyetlen forrás a tipográfiához, fontokhoz, lekerekítésekhez és
 * térközökhöz. A `tailwind.config.js` és a `Text` komponens is innen olvas.
 * A SZÍNEK a `global.css`-ben vannak (shadcn CSS változók), JS-ből pedig a
 * `src/constants/theme.ts` `THEME` objektumán keresztül érhetők el.
 *
 * CommonJS, mert a `tailwind.config.js` `require`-rel tölti be.
 */

/**
 * Font-családok súlyonként. SDK 57-en egy családnév alá csak egy fájl
 * tölthető, ezért minden súly külön néven regisztrálódik (lásd `fonts.ts`).
 * A `Text` komponens a `font-*` súlyosztály alapján választja ki a megfelelőt.
 */
const fontFamilies = {
  sans: {
    400: "PlusJakartaSans_400Regular",
    500: "PlusJakartaSans_500Medium",
    600: "PlusJakartaSans_600SemiBold",
    700: "PlusJakartaSans_700Bold",
    800: "PlusJakartaSans_800ExtraBold",
  },
  serif: {
    400: "Newsreader_400Regular",
    500: "Newsreader_500Medium",
    600: "Newsreader_600SemiBold",
    700: "Newsreader_700Bold",
    800: "Newsreader_800ExtraBold",
  },
};

/**
 * Tipográfiai skála. Használat: `text-headline-md`, `text-body-sm`, `text-label-lg`…
 * A `family` határozza meg, hogy a `Text` melyik fontcsaládot válassza.
 * letterSpacing px-ben (em × fontSize), mert natívan az em nem támogatott.
 */
const typography = {
  "headline-xl": { family: "serif", size: 40, lineHeight: 48, weight: 400, tracking: -0.4 },
  "headline-xl-mobile": { family: "serif", size: 32, lineHeight: 40, weight: 400, tracking: -0.32 },
  "headline-lg": { family: "serif", size: 30, lineHeight: 38, weight: 400, tracking: -0.15 },
  "headline-md": { family: "serif", size: 24, lineHeight: 32, weight: 500, tracking: 0 },
  "headline-sm": { family: "serif", size: 20, lineHeight: 28, weight: 500, tracking: 0 },
  "body-lg": { family: "sans", size: 17, lineHeight: 26, weight: 400, tracking: 0.17 },
  "body-md": { family: "sans", size: 15, lineHeight: 24, weight: 400, tracking: 0.15 },
  "body-sm": { family: "sans", size: 13, lineHeight: 20, weight: 400, tracking: 0.13 },
  "label-lg": { family: "sans", size: 14, lineHeight: 20, weight: 600, tracking: 0.28 },
  "label-md": { family: "sans", size: 12, lineHeight: 18, weight: 600, tracking: 0.36 },
  "label-sm": { family: "sans", size: 11, lineHeight: 16, weight: 500, tracking: 0.44 },
};

/** Lekerekítések. Szemantikus nevek a komponensekhez + a DESIGN.md skálája. */
const radius = {
  sm: "0.25rem",
  DEFAULT: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  input: "0.75rem", // 12px – beviteli mezők, inset konténerek
  container: "1rem", // 16px – nagyobb konténerek, alertek, bottom sheet
  card: "1.25rem", // 20px – kártyák
};

/** Térközök a DESIGN.md-ből (a Tailwind 4px-es skálája mellett). */
const spacing = {
  gutter: "1.25rem", // 20px – mobil margó és gutter
  "gutter-desktop": "2rem",
};

module.exports = { fontFamilies, typography, radius, spacing };
