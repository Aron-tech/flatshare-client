import { Icon } from "@/components/ui/icon";
import { useThemeColors } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import {
  ChefHat,
  CookingPot,
  Flower2,
  type LucideIcon,
  Recycle,
  ShoppingCart,
  ShowerHead,
  Sofa,
  Sparkles,
  WashingMachine,
} from "lucide-react-native";
import { View } from "react-native";

/**
 * A backend `categories.icon` / `tasks.icon` szabad szöveg, ezért kulcsszavak
 * alapján választunk Lucide ikont (angol és magyar névre is), különben Sparkles.
 */
const KEYWORDS: [RegExp, LucideIcon][] = [
  [/kitchen|cook|konyh|főz|dish|mosogat/i, CookingPot],
  [/bath|shower|fürd|zuhany|toilet|wc/i, ShowerHead],
  [/living|sofa|couch|nappali|floor|padló/i, Sofa],
  [/eco|recycl|trash|waste|szemét|szelektív|kuka/i, Recycle],
  [/plant|garden|növény|kert|virág/i, Flower2],
  [/laundry|wash|mosás|ruha/i, WashingMachine],
  [/shop|cart|bevásár|supplies|készlet/i, ShoppingCart],
  [/meal|dinner|vacsora|chef/i, ChefHat],
];

export function resolveCategoryIcon(...hints: (string | null | undefined)[]): LucideIcon {
  const haystack = hints.filter(Boolean).join(" ");
  return KEYWORDS.find(([re]) => re.test(haystack))?.[1] ?? Sparkles;
}

interface CategoryIconBadgeProps {
  /** Kategória hex színe; ha nincs, semleges homok tónus. */
  color?: string | null;
  hints: (string | null | undefined)[];
  size?: number;
  shape?: "circle" | "rounded";
  className?: string;
}

/** Tónusos ikon-korong (dashboard kártyák bal oldala, chores kártyák). */
export function CategoryIconBadge({
  color,
  hints,
  size = 44,
  shape = "circle",
  className,
}: CategoryIconBadgeProps) {
  const colors = useThemeColors();
  const tint = color && /^#[0-9a-f]{6}$/i.test(color) ? color : null;

  return (
    <View
      className={cn(
        "items-center justify-center",
        shape === "circle" ? "rounded-full" : "rounded-input",
        !tint && "bg-secondary",
        className
      )}
      style={[{ width: size, height: size }, tint && { backgroundColor: `${tint}26` }]}
    >
      <Icon
        as={resolveCategoryIcon(...hints)}
        size={Math.round(size * 0.5)}
        color={tint ?? colors.mutedForeground}
        strokeWidth={1.75}
      />
    </View>
  );
}
