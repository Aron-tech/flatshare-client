const { readdirSync } = require("node:fs");
const { join } = require("node:path");

const pets = Object.fromEntries(
  readdirSync(join(__dirname, "pets"))
    .filter((file) => file.endsWith(".png"))
    // Relative to this folder (the plugin resolves image paths against the target directory).
    .map((file) => [`pet_${file.replace(/\.png$/, "")}`, `./pets/${file}`])
);

/** Same tokens as global.css (light / dark). */
const color = (light, dark) => ({ color: light, darkColor: dark });

/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "widget",
  name: "HomeQuestWidget",
  displayName: "HomeQuest",
  bundleIdentifier: ".widget",
  // Interactive widgets (Button + AppIntent) need iOS 17; the app itself still runs on 16.4.
  deploymentTarget: "17.0",
  frameworks: ["SwiftUI", "WidgetKit", "AppIntents"],
  entitlements: {
    "com.apple.security.application-groups": config.ios.entitlements["com.apple.security.application-groups"],
  },
  colors: {
    $accent: "#D87758",
    background: color("#FDFBF7", "#1C1B1A"),
    foreground: color("#2C2B29", "#F4F0EC"),
    mutedForeground: color("#706E6B", "#B5AFA8"),
    muted: color("#F5F2EB", "#31302E"),
    primary: color("#D87758", "#D87758"),
    primarySoft: color("#FAEDE8", "#3A2A24"),
    primarySoftForeground: color("#D87758", "#FFB59E"),
    success: color("#5E826A", "#7C9D86"),
    successSoft: color("#EDF3EE", "#26332B"),
    border: color("#E8E4DA", "#3B3936"),
  },
  images: pets,
});
