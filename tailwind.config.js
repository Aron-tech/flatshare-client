const { fontFamilies, typography, radius, spacing } = require("./src/theme/tokens");

/** Színtoken → `hsl(var(--token))`. Az értékek a global.css-ben vannak. */
const color = (name) => `hsl(var(--${name}))`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        border: color("border"),
        input: color("input"),
        ring: color("ring"),
        placeholder: color("placeholder"),
        background: color("background"),
        foreground: color("foreground"),
        primary: {
          DEFAULT: color("primary"),
          foreground: color("primary-foreground"),
          active: color("primary-active"),
          soft: color("primary-soft"),
          "soft-foreground": color("primary-soft-foreground"),
        },
        secondary: {
          DEFAULT: color("secondary"),
          foreground: color("secondary-foreground"),
          active: color("secondary-active"),
        },
        success: {
          DEFAULT: color("success"),
          foreground: color("success-foreground"),
          active: color("success-active"),
          soft: color("success-soft"),
          "soft-foreground": color("success-soft-foreground"),
        },
        destructive: {
          DEFAULT: color("destructive"),
          foreground: color("destructive-foreground"),
        },
        muted: {
          DEFAULT: color("muted"),
          foreground: color("muted-foreground"),
        },
        accent: {
          DEFAULT: color("accent"),
          foreground: color("accent-foreground"),
        },
        popover: {
          DEFAULT: color("popover"),
          foreground: color("popover-foreground"),
        },
        card: {
          DEFAULT: color("card"),
          foreground: color("card-foreground"),
        },
      },
      fontFamily: {
        sans: [fontFamilies.sans[400]],
        serif: [fontFamilies.serif[400]],
      },
      fontSize: Object.fromEntries(
        Object.entries(typography).map(([name, t]) => [
          name,
          [
            `${t.size}px`,
            {
              lineHeight: `${t.lineHeight}px`,
              letterSpacing: `${t.tracking}px`,
              fontWeight: String(t.weight),
            },
          ],
        ]),
      ),
      borderRadius: radius,
      spacing,
    },
  },
  plugins: [],
};
