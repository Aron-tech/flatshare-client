// GENERÁLT FÁJL – ne szerkeszd kézzel. Forrás: scripts/house-assets (npm run render).
// Modellek: Kenney Furniture Kit és Cube Pets (CC0, www.kenney.nl).
import type { ImageSourcePropType } from "react-native";

/** A szoba képének mérete (px); minden más pixeladat ehhez viszonyít. */
export const ROOM_IMAGE = {
  source: require("../../../assets/house/room.webp") as ImageSourcePropType,
  width: 1170,
  height: 821,
} as const;

/** Padló (x, z) → kép pixel: u = u0 + ux·x + uz·z, v = v0 + vx·x + vz·z. */
export const FLOOR_PROJECTION = {
  u0: 585.142,
  v0: 239.652,
  ux: 139.148,
  uz: -139.148,
  vx: 69.616,
  vz: 69.616,
} as const;

export const HOUSE_ZONES = ["kitchen","cleaning","trash","laundry","shopping","bathroom"] as const;
export type HouseZone = (typeof HOUSE_ZONES)[number];

export type Facing = "se" | "ne" | "sw" | "nw";

/** Ahova az állat a zóna rendbetételéhez megy, és amerre közben néz. */
export const ZONE_SPOTS: Record<HouseZone, { x: number; z: number; facing: Facing }> = {
  "kitchen": {
    "x": 1.4,
    "z": 0.85,
    "facing": "ne"
  },
  "shopping": {
    "x": 0.45,
    "z": 0.75,
    "facing": "ne"
  },
  "trash": {
    "x": 3.05,
    "z": 1,
    "facing": "ne"
  },
  "laundry": {
    "x": 0.75,
    "z": 1.25,
    "facing": "nw"
  },
  "bathroom": {
    "x": 0.85,
    "z": 2.5,
    "facing": "nw"
  },
  "cleaning": {
    "x": 2.4,
    "z": 2.3,
    "facing": "se"
  }
};

/** A bejárható padlórész. */
export const WALK_AREA = {"minX":0.9,"maxX":3.6,"minZ":1,"maxZ":3.6} as const;

export interface MessLayer {
  source: ImageSourcePropType;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Zónánként az 1–3. rendetlenség-szint rétege (a szoba képére kell illeszteni). */
export const MESS_LAYERS: Record<HouseZone, readonly [MessLayer, MessLayer, MessLayer]> = {
  kitchen: [
    { source: require("../../../assets/house/mess/kitchen-1.webp"), x: 735, y: 274, width: 70, height: 36 },
    { source: require("../../../assets/house/mess/kitchen-2.webp"), x: 696, y: 256, width: 169, height: 87 },
    { source: require("../../../assets/house/mess/kitchen-3.webp"), x: 638, y: 219, width: 260, height: 211 },
  ],
  cleaning: [
    { source: require("../../../assets/house/mess/cleaning-1.webp"), x: 701, y: 519, width: 220, height: 57 },
    { source: require("../../../assets/house/mess/cleaning-2.webp"), x: 222, y: 443, width: 699, height: 133 },
    { source: require("../../../assets/house/mess/cleaning-3.webp"), x: 222, y: 386, width: 699, height: 359 },
  ],
  trash: [
    { source: require("../../../assets/house/mess/trash-1.webp"), x: 952, y: 385, width: 51, height: 40 },
    { source: require("../../../assets/house/mess/trash-2.webp"), x: 952, y: 385, width: 59, height: 128 },
    { source: require("../../../assets/house/mess/trash-3.webp"), x: 888, y: 385, width: 123, height: 152 },
  ],
  laundry: [
    { source: require("../../../assets/house/mess/laundry-1.webp"), x: 414, y: 278, width: 61, height: 48 },
    { source: require("../../../assets/house/mess/laundry-2.webp"), x: 413, y: 278, width: 104, height: 111 },
    { source: require("../../../assets/house/mess/laundry-3.webp"), x: 129, y: 278, width: 440, height: 182 },
  ],
  shopping: [
    { source: require("../../../assets/house/mess/shopping-1.webp"), x: 576, y: 170, width: 27, height: 33 },
    { source: require("../../../assets/house/mess/shopping-2.webp"), x: 536, y: 170, width: 89, height: 167 },
    { source: require("../../../assets/house/mess/shopping-3.webp"), x: 536, y: 143, width: 93, height: 217 },
  ],
  bathroom: [
    { source: require("../../../assets/house/mess/bathroom-1.webp"), x: 252, y: 443, width: 67, height: 38 },
    { source: require("../../../assets/house/mess/bathroom-2.webp"), x: 252, y: 437, width: 119, height: 44 },
    { source: require("../../../assets/house/mess/bathroom-3.webp"), x: 252, y: 428, width: 160, height: 85 },
  ],
};

export const PET_IDS = ["cat","dog","bunny","fox","panda","penguin","koala","pig","monkey","lion","tiger","polar","chick","parrot","bee","beaver","deer","elephant","giraffe","cow","hog","crab","caterpillar"] as const;
export type PetId = (typeof PET_IDS)[number];

export type PetAnimation = "idle" | "walk" | "work" | "happy" | "cheer" | "sad";

/**
 * Az állatok sprite-atlasza: `columns` oszlopos rács, képkockánként `frame` px; az (anchorX, anchorY)
 * pont áll a padlón. Az első `perFacing` kocka "se", a következő "ne" irányú (sw / nw = tükrözve).
 */
export const PET_ATLAS = {
  frame: { width: 176, height: 176, anchorX: 88, anchorY: 137 },
  columns: 12,
  rows: 7,
  perFacing: 40,
  animations: {"idle":{"start":0,"count":8,"fps":8},"walk":{"start":8,"count":8,"fps":16},"work":{"start":16,"count":8,"fps":16},"happy":{"start":24,"count":8,"fps":16},"cheer":{"start":32,"count":4,"fps":16},"sad":{"start":36,"count":4,"fps":16}} as Record<PetAnimation, { start: number; count: number; fps: number }>,
} as const;

export const PET_SOURCES: Record<PetId, ImageSourcePropType> = {
  cat: require("../../../assets/house/pets/cat.webp"),
  dog: require("../../../assets/house/pets/dog.webp"),
  bunny: require("../../../assets/house/pets/bunny.webp"),
  fox: require("../../../assets/house/pets/fox.webp"),
  panda: require("../../../assets/house/pets/panda.webp"),
  penguin: require("../../../assets/house/pets/penguin.webp"),
  koala: require("../../../assets/house/pets/koala.webp"),
  pig: require("../../../assets/house/pets/pig.webp"),
  monkey: require("../../../assets/house/pets/monkey.webp"),
  lion: require("../../../assets/house/pets/lion.webp"),
  tiger: require("../../../assets/house/pets/tiger.webp"),
  polar: require("../../../assets/house/pets/polar.webp"),
  chick: require("../../../assets/house/pets/chick.webp"),
  parrot: require("../../../assets/house/pets/parrot.webp"),
  bee: require("../../../assets/house/pets/bee.webp"),
  beaver: require("../../../assets/house/pets/beaver.webp"),
  deer: require("../../../assets/house/pets/deer.webp"),
  elephant: require("../../../assets/house/pets/elephant.webp"),
  giraffe: require("../../../assets/house/pets/giraffe.webp"),
  cow: require("../../../assets/house/pets/cow.webp"),
  hog: require("../../../assets/house/pets/hog.webp"),
  crab: require("../../../assets/house/pets/crab.webp"),
  caterpillar: require("../../../assets/house/pets/caterpillar.webp"),
};
