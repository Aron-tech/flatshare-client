import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

import { radius, typography } from "@/theme/tokens";

/**
 * Our own tokens (`text-headline-md`, `rounded-card`, `bg-primary-soft`…) must be taught to tailwind-merge,
 * otherwise it would take `text-body-sm` for a color and knock out `text-foreground`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: Object.keys(typography) }],
      rounded: [{ rounded: Object.keys(radius).filter((k) => k !== "DEFAULT") }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
