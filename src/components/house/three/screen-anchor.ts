import { useFrame } from "@react-three/fiber/native";
import { useMemo } from "react";
import { makeMutable, type SharedValue } from "react-native-reanimated";
import { Vector3 } from "three";

/**
 * Screen position of a 3D point (pt, from the scene's top-left corner). The 3D scene updates it every
 * frame, the RN overlay (name, bubble, sparkle) follows it on the UI thread.
 */
export interface ScreenAnchor {
  x: SharedValue<number>;
  y: SharedValue<number>;
  /** 1 if the point is in front of the camera. */
  visible: SharedValue<number>;
}

export function createAnchor(): ScreenAnchor {
  return { x: makeMutable(-1000), y: makeMutable(-1000), visible: makeMutable(0) };
}

const projected = new Vector3();

/** Projects the `world` point to the camera and writes it into `anchor` (only on a noticeable change). */
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

/** Follows a fixed 3D point (e.g. the sparkle above the tidied zone). */
export function FixedAnchor({ anchor, position }: { anchor: ScreenAnchor; position: readonly [number, number, number] }) {
  const world = useMemo(() => new Vector3(...position), [position]);
  useFrame(({ camera, size }) => writeAnchor(anchor, world, camera, size));
  return null;
}
