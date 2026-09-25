import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

import { radius, typography } from "@/theme/tokens";

/**
 * A saját tokeneket (`text-headline-md`, `rounded-card`, `bg-primary-soft`…) meg kell
 * tanítani a tailwind-merge-nek, különben pl. a `text-body-sm`-et színnek hinné, és
 * kiütné a `text-foreground`-ot.
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
