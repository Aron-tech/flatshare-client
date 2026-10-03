// GENERATED FILE – do not edit by hand. Source: scripts/house-assets (npm run render).
// Models: Kenney Cube Pets (CC0, www.kenney.nl).
import type { ImageSourcePropType } from "react-native";
import type { PetAnimation, PetId } from "./scene.generated";

export type SpriteFacing = "se" | "ne" | "sw" | "nw";

/**
 * Pet sprite atlas: a grid with `columns` columns, `frame` px per frame; the (anchorX, anchorY)
 * point sits on the floor. The first `perFacing` frames face "se", the next ones "ne" (sw / nw are mirrored).
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
