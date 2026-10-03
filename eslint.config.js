// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // react-three-fiber: a JSX elemek three.js objektumok (position, args, attach…).
    files: ["src/components/house/**/*.tsx"],
    rules: { "react/no-unknown-property": "off" },
  },
]);
