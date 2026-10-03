const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
// A Ház nézet 3D modelljei (assets/house/3d).
config.resolver.assetExts.push("glb");

// A `three` CommonJS buildje (amit a @react-three/fiber `require('three')`-val kér) betöltéskor a
// Node-specifikus `process.emitWarning`-ot hívja, ami React Native alatt nem létezik ("undefined is
// not a function"). Ezért minden `three` import az ESM buildre mutat.
const threeModule = path.join(__dirname, "node_modules", "three", "build", "three.module.js");
const resolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "three") return { type: "sourceFile", filePath: threeModule };
  return (resolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, {
  input: "./global.css",
  inlineRem: 16,
});
