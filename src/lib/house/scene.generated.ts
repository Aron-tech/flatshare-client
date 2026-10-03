// GENERATED FILE – do not edit by hand. Source: scripts/house-assets (npm run export).
// Models: Kenney Furniture Kit and Cube Pets (CC0, www.kenney.nl).

export const HOUSE_ZONES = ["kitchen","cleaning","trash","laundry","shopping","bathroom"] as const;
export type HouseZone = (typeof HOUSE_ZONES)[number];

export const PET_IDS = ["cat","dog","bunny","fox","panda","penguin","koala","pig","monkey","lion","tiger","polar","chick","parrot","bee","beaver","deer","elephant","giraffe","cow","hog","crab","caterpillar"] as const;
export type PetId = (typeof PET_IDS)[number];

/** The animations in the pet GLBs (the Kenney clips renamed). */
export type PetAnimation = "idle" | "walk" | "work" | "happy" | "cheer" | "sad";

/** The main room always exists, the others are built by members from points (backend: HouseRoomEnum). */
export const ROOM_KEYS = ["main","kitchen","bathroom"] as const;
export type RoomKey = (typeof ROOM_KEYS)[number];

export interface RoomSpot {
  x: number;
  z: number;
  /** Facing: rotation around y in radians; 0 = towards +z. */
  yaw: number;
}

export interface RoomDefinition {
  /** GLB: `furniture` group + `mess_<zone>_<1..3>` groups (cumulative levels). */
  model: number;
  /** Room position in the house (world coordinates, in floor tiles); the room's own coordinates are added to it. */
  offset: { x: number; z: number };
  size: { x: number; z: number };
  /** Top of the floor (pets stand on it). */
  floorY: number;
  bounds: { min: [number, number, number]; max: [number, number, number] };
  walkArea: { minX: number; maxX: number; minZ: number; maxZ: number };
  /** Zone positions in the room (where the pet goes to tidy up). */
  spots: Partial<Record<HouseZone, RoomSpot>>;
}

export const ROOMS: Record<RoomKey, RoomDefinition> = {
  main: {
    model: require("../../../assets/house/3d/room-main.glb"),
    offset: {"x":0,"z":0},
    size: {"x":4,"z":4},
    floorY: 0.05,
    bounds: { min: [-0.09,0,-0.09], max: [4,1.29,4.002] },
    walkArea: {"minX":0.9,"maxX":3.6,"minZ":1,"maxZ":3.6},
    spots: {"kitchen":{"x":1.4,"z":0.85,"yaw":3.142},"shopping":{"x":0.45,"z":0.75,"yaw":3.142},"trash":{"x":3.05,"z":1,"yaw":3.142},"laundry":{"x":0.75,"z":1.25,"yaw":-1.571},"bathroom":{"x":0.85,"z":2.5,"yaw":-1.571},"cleaning":{"x":2.4,"z":2.3,"yaw":1.571}},
  },
  kitchen: {
    model: require("../../../assets/house/3d/room-kitchen.glb"),
    offset: {"x":4,"z":0},
    size: {"x":3,"z":4},
    floorY: 0.05,
    bounds: { min: [0,0,-0.09], max: [3,1.29,4] },
    walkArea: {"minX":0.4,"maxX":2.7,"minZ":1.1,"maxZ":3.6},
    spots: {"kitchen":{"x":1.25,"z":0.9,"yaw":3.142},"trash":{"x":2.45,"z":1.15,"yaw":3.142}},
  },
  bathroom: {
    model: require("../../../assets/house/3d/room-bathroom.glb"),
    offset: {"x":0,"z":4},
    size: {"x":4,"z":3},
    floorY: 0.05,
    bounds: { min: [-0.09,0,0], max: [4,1.29,3] },
    walkArea: {"minX":1,"maxX":3.6,"minZ":0.4,"maxZ":2},
    spots: {"bathroom":{"x":0.85,"z":1.4,"yaw":-1.571},"laundry":{"x":2.4,"z":1.75,"yaw":0}},
  },
};

export const messNodeName = (zone: HouseZone, level: 1 | 2 | 3) => `mess_${zone}_${level}`;

export const PET_SCALE = 0.3;
/** Height of the tallest pet (world units), for placing the name/bubble. */
export const PET_HEIGHT = 0.607;

/** One texture shared by all pets (the GLB materials have none). */
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
