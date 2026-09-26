import type { LucideIcon } from "lucide-react-native";
import {
  ArrowLeftRight,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CalendarDays,
  ChartColumn,
  Check,
  CheckCheck,
  ChefHat,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Clock,
  CookingPot,
  Flower2,
  Gift,
  Hourglass,
  House,
  ListChecks,
  LogOut,
  Pencil,
  Plus,
  Recycle,
  Scale,
  Search,
  Settings,
  ShoppingCart,
  ShowerHead,
  Sofa,
  Sparkles,
  Sprout,
  Star,
  Target,
  Timer,
  Trash2,
  UserMinus,
  WashingMachine,
  X,
  Zap,
} from "lucide-react-native";
import type { ComponentType } from "react";
import { createContext } from "react";
import { parse, SvgAst, type JsxAST } from "react-native-svg";
import { FLUENT_COLOR_XML, type FluentColorName } from "./fluent-color-icons";
import { ArrowRight as ArrowRightP } from "phosphor-react-native/src/icons/ArrowRight";
import { ArrowsLeftRight as ArrowsLeftRightP } from "phosphor-react-native/src/icons/ArrowsLeftRight";
import { CalendarDots as CalendarDotsP } from "phosphor-react-native/src/icons/CalendarDots";
import { CaretDown as CaretDownP } from "phosphor-react-native/src/icons/CaretDown";
import { ChartBar as ChartBarP } from "phosphor-react-native/src/icons/ChartBar";
import { Check as CheckP } from "phosphor-react-native/src/icons/Check";
import { CheckCircle as CheckCircleP } from "phosphor-react-native/src/icons/CheckCircle";
import { Checks as ChecksP } from "phosphor-react-native/src/icons/Checks";
import { ChefHat as ChefHatP } from "phosphor-react-native/src/icons/ChefHat";
import { Clock as ClockP } from "phosphor-react-native/src/icons/Clock";
import { ClockCountdown as ClockCountdownP } from "phosphor-react-native/src/icons/ClockCountdown";
import { CookingPot as CookingPotP } from "phosphor-react-native/src/icons/CookingPot";
import { Couch as CouchP } from "phosphor-react-native/src/icons/Couch";
import { Flower as FlowerP } from "phosphor-react-native/src/icons/Flower";
import { Gear as GearP } from "phosphor-react-native/src/icons/Gear";
import { Gift as GiftP } from "phosphor-react-native/src/icons/Gift";
import { Hourglass as HourglassP } from "phosphor-react-native/src/icons/Hourglass";
import { House as HouseP } from "phosphor-react-native/src/icons/House";
import { Lightning as LightningP } from "phosphor-react-native/src/icons/Lightning";
import { ListChecks as ListChecksP } from "phosphor-react-native/src/icons/ListChecks";
import { MagnifyingGlass as MagnifyingGlassP } from "phosphor-react-native/src/icons/MagnifyingGlass";
import { PencilSimple as PencilSimpleP } from "phosphor-react-native/src/icons/PencilSimple";
import { Plant as PlantP } from "phosphor-react-native/src/icons/Plant";
import { Plus as PlusP } from "phosphor-react-native/src/icons/Plus";
import { Recycle as RecycleP } from "phosphor-react-native/src/icons/Recycle";
import { Scales as ScalesP } from "phosphor-react-native/src/icons/Scales";
import { SealCheck as SealCheckP } from "phosphor-react-native/src/icons/SealCheck";
import { Star as StarP } from "phosphor-react-native/src/icons/Star";
import { ShoppingCart as ShoppingCartP } from "phosphor-react-native/src/icons/ShoppingCart";
import { Shower as ShowerP } from "phosphor-react-native/src/icons/Shower";
import { SignOut as SignOutP } from "phosphor-react-native/src/icons/SignOut";
import { Sparkle as SparkleP } from "phosphor-react-native/src/icons/Sparkle";
import { Target as TargetP } from "phosphor-react-native/src/icons/Target";
import { Timer as TimerP } from "phosphor-react-native/src/icons/Timer";
import { Trash as TrashP } from "phosphor-react-native/src/icons/Trash";
import { UserMinus as UserMinusP } from "phosphor-react-native/src/icons/UserMinus";
import { WarningCircle as WarningCircleP } from "phosphor-react-native/src/icons/WarningCircle";
import { WashingMachine as WashingMachineP } from "phosphor-react-native/src/icons/WashingMachine";
import { X as XP } from "phosphor-react-native/src/icons/X";

type PhosphorWeight = "regular" | "bold";
type IconLike = ComponentType<Record<string, unknown>>;

/** Lucide ikon → Phosphor megfelelő. Új ikon felvételekor itt is fel kell venni (különben Lucide marad). */
const PHOSPHOR = new Map<LucideIcon, IconLike>([
  [ArrowLeftRight, ArrowsLeftRightP],
  [ArrowRight, ArrowRightP],
  [BadgeCheck, SealCheckP],
  [CalendarClock, ClockCountdownP],
  [CalendarDays, CalendarDotsP],
  [ChartColumn, ChartBarP],
  [Check, CheckP],
  [CheckCheck, ChecksP],
  [ChefHat, ChefHatP],
  [ChevronDown, CaretDownP],
  [CircleAlert, WarningCircleP],
  [CircleCheck, CheckCircleP],
  [Clock, ClockP],
  [CookingPot, CookingPotP],
  [Flower2, FlowerP],
  [Gift, GiftP],
  [Hourglass, HourglassP],
  [House, HouseP],
  [ListChecks, ListChecksP],
  [LogOut, SignOutP],
  [Pencil, PencilSimpleP],
  [Plus, PlusP],
  [Recycle, RecycleP],
  [Scale, ScalesP],
  [Search, MagnifyingGlassP],
  [Settings, GearP],
  [ShoppingCart, ShoppingCartP],
  [ShowerHead, ShowerP],
  [Sofa, CouchP],
  [Sparkles, SparkleP],
  [Sprout, PlantP],
  [Star, StarP],
  [Target, TargetP],
  [Timer, TimerP],
  [Trash2, TrashP],
  [UserMinus, UserMinusP],
  [WashingMachine, WashingMachineP],
  [X, XP],
  [Zap, LightningP],
] as [LucideIcon, IconLike][]);

const astCache = new Map<FluentColorName, JsxAST | null>();

/** Színes (többszínű) SVG ikon; az XML-t csak első rendereléskor parse-olja, utána cache-ből. */
function fluentColor(name: FluentColorName): IconLike {
  function FluentColorIcon({ size = 24, style }: { size?: number; style?: unknown }) {
    let ast = astCache.get(name);
    if (ast === undefined) {
      ast = parse(FLUENT_COLOR_XML[name]);
      astCache.set(name, ast);
    }
    return <SvgAst ast={ast} override={{ width: size, height: size, style }} />;
  }
  FluentColorIcon.displayName = `FluentColor(${name})`;
  return FluentColorIcon as IconLike;
}

/**
 * Lucide ikon → Fluent Color megfelelő. A tisztán UI-jelek (X, +, pipa, nyíl, keresés…)
 * a színes készletben sincsenek, ezek egyszínű Lucide-ként maradnak.
 */
const FLUENT_COLOR = new Map<LucideIcon, IconLike>(
  (
    [
      [ArrowLeftRight, "arrow-sync"],
      [BadgeCheck, "shield-checkmark"],
      [CalendarClock, "calendar-clock"],
      [CalendarDays, "calendar"],
      [ChartColumn, "data-bar-vertical-ascending"],
      [ChefHat, "food"],
      [CircleAlert, "error-circle"],
      [CircleCheck, "checkmark-circle"],
      [Clock, "clock"],
      [CookingPot, "food"],
      [Gift, "gift"],
      [Hourglass, "history"],
      [House, "home"],
      [ListChecks, "clipboard-task"],
      [Pencil, "edit"],
      [Scale, "poll"],
      [Settings, "settings"],
      [ShoppingCart, "building-store"],
      [Sparkles, "star"],
      [Star, "star"],
      [Target, "trophy"],
      [Timer, "clock-alarm"],
      [UserMinus, "person-warning"],
    ] as [LucideIcon, FluentColorName][]
  ).map(([icon, name]) => [icon, fluentColor(name)]),
);

interface IconSet {
  /** Lucide ikon → az adott készlet ikonja; `null` = maga a Lucide. */
  map: Map<LucideIcon, IconLike> | null;
  /** Készlet-specifikus propok (pl. Phosphor `weight`). */
  props?: { weight: PhosphorWeight };
}

/** Választható ikonkészletek; a kulcsok a `settings.icons_<id>` fordításokban szerepelnek. */
export type IconSetId = "lucide" | "phosphor" | "fluentColor";

export const ICON_SETS: Record<IconSetId, IconSet> = {
  lucide: { map: null },
  phosphor: { map: PHOSPHOR, props: { weight: "regular" } },
  fluentColor: { map: FLUENT_COLOR },
};
export const ICON_SET_IDS = Object.keys(ICON_SETS) as IconSetId[];
export const DEFAULT_ICON_SET: IconSetId = "lucide";

/** Az `Icon` ebből tudja az aktív készletet (csak váltáskor renderel újra). */
export const IconSetContext = createContext<IconSetId>(DEFAULT_ICON_SET);
