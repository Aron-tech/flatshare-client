import { useFrame } from "@react-three/fiber/native";
import { useMemo } from "react";
import { makeMutable, type SharedValue } from "react-native-reanimated";
import { Vector3 } from "three";

/**
 * Egy 3D pont képernyő-helye (pt, a jelenet bal felső sarkától). A 3D jelenet minden
 * képkockában frissíti, az RN overlay (név, buborék, csillogás) a UI szálon követi.
 */
export interface ScreenAnchor {
  x: SharedValue<number>;
  y: SharedValue<number>;
  /** 1, ha a pont a kamera előtt van. */
  visible: SharedValue<number>;
}

export function createAnchor(): ScreenAnchor {
  return { x: makeMutable(-1000), y: makeMutable(-1000), visible: makeMutable(0) };
}

const projected = new Vector3();

/** A `world` pontot a kamerára vetíti, és beírja az `anchor`-ba (csak érezhető változásnál). */
export function writeAnchor(
  anchor: ScreenAnchor,
  world: Vector3,
  camera: Parameters<Vector3["project"]>[0],
  size: { width: number; height: number }
) {
  projected.copy(world).project(camera);
  const x = ((projected.x + 1) / 2) * size.width;
  const y = ((1 - projected.y) / 2) * size.height;
  const visible = projected.z < 1 ? 1 : 0;
  if (Math.abs(anchor.x.value - x) > 0.25) anchor.x.value = x;
  if (Math.abs(anchor.y.value - y) > 0.25) anchor.y.value = y;
  if (anchor.visible.value !== visible) anchor.visible.value = visible;
}

/** Egy rögzített 3D pont követése (pl. a csillogás a rendbe tett zóna fölött). */
export function FixedAnchor({ anchor, position }: { anchor: ScreenAnchor; position: readonly [number, number, number] }) {
  const world = useMemo(() => new Vector3(...position), [position]);
  useFrame(({ camera, size }) => writeAnchor(anchor, world, camera, size));
  return null;
}
