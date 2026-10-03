// GENERÁLT FÁJL – ne szerkeszd kézzel. Forrás: scripts/house-assets (npm run export).
// Modellek: Kenney Furniture Kit és Cube Pets (CC0, www.kenney.nl).

export const HOUSE_ZONES = ["kitchen","cleaning","trash","laundry","shopping","bathroom"] as const;
export type HouseZone = (typeof HOUSE_ZONES)[number];

export const PET_IDS = ["cat","dog","bunny","fox","panda","penguin","koala","pig","monkey","lion","tiger","polar","chick","parrot","bee","beaver","deer","elephant","giraffe","cow","hog","crab","caterpillar"] as const;
export type PetId = (typeof PET_IDS)[number];

/** Az állat GLB-kben lévő animációk (a Kenney klipek átnevezve). */
export type PetAnimation = "idle" | "walk" | "work" | "happy" | "cheer" | "sad";

export type RoomKey = "main";

export interface RoomSpot {
  x: number;
  z: number;
  /** Nézési irány: y körüli elforgatás (radián); 0 = +z felé. */
  yaw: number;
}

export interface RoomDefinition {
  /** GLB: `furniture` csoport + `mess_<zóna>_<1..3>` csoportok (kumulatív szintek). */
  model: number;
  /** A szoba helye a házban (világkoordináta, padlólapban). */
  offset: { x: number; z: number };
  size: number;
  /** A padló teteje (ezen állnak az állatok). */
  floorY: number;
  bounds: { min: [number, number, number]; max: [number, number, number] };
  walkArea: { minX: number; maxX: number; minZ: number; maxZ: number };
  spots: Partial<Record<HouseZone, RoomSpot>>;
}

export const ROOMS: Record<RoomKey, RoomDefinition> = {
  main: {
    model: require("../../../assets/house/3d/room-main.glb"),
    offset: { x: 0, z: 0 },
    size: 4,
    floorY: 0.05,
    bounds: { min: [-0.09,0,-0.09], max: [4,1.29,4.002] },
    walkArea: {"minX":0.9,"maxX":3.6,"minZ":1,"maxZ":3.6},
    spots: {"kitchen":{"x":1.4,"z":0.85,"yaw":3.142},"shopping":{"x":0.45,"z":0.75,"yaw":3.142},"trash":{"x":3.05,"z":1,"yaw":3.142},"laundry":{"x":0.75,"z":1.25,"yaw":-1.571},"bathroom":{"x":0.85,"z":2.5,"yaw":-1.571},"cleaning":{"x":2.4,"z":2.3,"yaw":1.571}},
  },
};

/** A mess csoport neve a szoba GLB-jében. */
export const messNodeName = (zone: HouseZone, level: 1 | 2 | 3) => `mess_${zone}_${level}`;

export const PET_SCALE = 0.3;
/** A legmagasabb állat magassága (világegység), a név/buborék elhelyezéséhez. */
export const PET_HEIGHT = 0.607;

/** Közös textúra minden állathoz (a GLB-k anyagai textúra nélküliek). */
export const PET_COLORMAP: number = require("../../../assets/house/3d/pets/colormap.png");

export const PET_MODELS: Record<PetId, number> = {
  cat: require("../../../assets/house/3d/pets/cat.glb"),
  dog: require("../../../assets/house/3d/pets/dog.glb"),
  bunny: require("../../../assets/house/3d/pets/bunny.glb"),
  fox: require("../../../assets/house/3d/pets/fox.glb"),
  panda: require("../../../assets/house/3d/pets/panda.glb"),
  penguin: require("../../../assets/house/3d/pets/penguin.glb"),
  koala: require("../../../assets/house/3d/pets/koala.glb"),
  pig: require("../../../assets/house/3d/pets/pig.glb"),
  monkey: require("../../../assets/house/3d/pets/monkey.glb"),
  lion: require("../../../assets/house/3d/pets/lion.glb"),
  tiger: require("../../../assets/house/3d/pets/tiger.glb"),
  polar: require("../../../assets/house/3d/pets/polar.glb"),
  chick: require("../../../assets/house/3d/pets/chick.glb"),
  parrot: require("../../../assets/house/3d/pets/parrot.glb"),
  bee: require("../../../assets/house/3d/pets/bee.glb"),
  beaver: require("../../../assets/house/3d/pets/beaver.glb"),
  deer: require("../../../assets/house/3d/pets/deer.glb"),
  elephant: require("../../../assets/house/3d/pets/elephant.glb"),
  giraffe: require("../../../assets/house/3d/pets/giraffe.glb"),
  cow: require("../../../assets/house/3d/pets/cow.glb"),
  hog: require("../../../assets/house/3d/pets/hog.glb"),
  crab: require("../../../assets/house/3d/pets/crab.glb"),
  caterpillar: require("../../../assets/house/3d/pets/caterpillar.glb"),
};
