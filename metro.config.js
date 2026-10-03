const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
// A Ház nézet 3D modelljei (assets/house/3d).
config.resolver.assetExts.push("glb");

module.exports = withNativeWind(config, {
  input: "./global.css",
  inlineRem: 16,
});
