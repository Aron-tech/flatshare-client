/**
 * The House view camera: orbits around the middle of the house (spherical coordinates). The vertical angle
 * (`polar`, measured from the vertical) is limited, so you cannot look under the floor.
 */
export interface OrbitState {
  /** Horizontal angle (radians); 0 = the camera is on the +z side. */
  azimuth: number;
  /** Angle from the vertical (radians). */
  polar: number;
  /** Multiplier of the base distance (1 = the house just fills the image). */
  zoom: number;
  /** Momentum after release (radians / s). */
  velocityAzimuth: number;
  velocityPolar: number;
  dragging: boolean;
  /** Animated reset to the default view. */
  resetting: boolean;
}

export const ORBIT = {
  /** The initial view: from the +x, +z corner with a 34° elevation (similar to the earlier isometric image). */
  azimuth: Math.PI / 4,
  polar: (56 * Math.PI) / 180,
  /** Almost top-down. */
  minPolar: (12 * Math.PI) / 180,
  /** 20° above the horizontal: the bottom of the house is not visible. */
  maxPolar: (70 * Math.PI) / 180,
  /** Zoom in / out limit relative to the base distance. */
  minZoom: 0.45,
  maxZoom: 1.5,
  /** Radians / dragged point. */
  rotateSpeed: 0.0085,
  /** Share of the drag speed kept as momentum on release. */
  fling: 0.6,
  /** Momentum decay (1 / s). */
  damping: 4.5,
  fov: 35,
} as const;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * The camera distance from which a sphere of `radius` (the house) fits the image,
 * in both portrait and landscape.
 */
export function fitDistance(radius: number, aspect: number, fovDegrees: number = ORBIT.fov): number {
  const vertical = (fovDegrees * Math.PI) / 360;
  const horizontal = Math.atan(Math.tan(vertical) * aspect);
  return (radius * 1.04) / Math.sin(Math.min(vertical, horizontal));
}

export function initialOrbit(): OrbitState {
  return {
    azimuth: ORBIT.azimuth,
    polar: ORBIT.polar,
    zoom: 1,
    velocityAzimuth: 0,
    velocityPolar: 0,
    dragging: false,
    resetting: false,
  };
}

/** Camera position around `target` at `distance`. */
export function orbitPosition(
  state: Pick<OrbitState, "azimuth" | "polar">,
  distance: number,
  target: readonly [number, number, number]
): [number, number, number] {
  const sinPolar = Math.sin(state.polar);
  return [
    target[0] + distance * sinPolar * Math.sin(state.azimuth),
    target[1] + distance * Math.cos(state.polar),
    target[2] + distance * sinPolar * Math.cos(state.azimuth),
  ];
}

/** One frame: momentum or the animated reset to the default view. */
export function stepOrbit(o: OrbitState, delta: number) {
  if (o.resetting) {
    const k = 1 - Math.exp(-6 * delta);
    const turn = Math.atan2(Math.sin(ORBIT.azimuth - o.azimuth), Math.cos(ORBIT.azimuth - o.azimuth));
    o.azimuth += turn * k;
    o.polar += (ORBIT.polar - o.polar) * k;
    o.zoom += (1 - o.zoom) * k;
    if (Math.abs(turn) < 1e-3 && Math.abs(o.polar - ORBIT.polar) < 1e-3 && Math.abs(o.zoom - 1) < 1e-3) o.resetting = false;
    return;
  }
  if (o.dragging || (o.velocityAzimuth === 0 && o.velocityPolar === 0)) return;
  o.azimuth += o.velocityAzimuth * delta;
  o.polar = clamp(o.polar + o.velocityPolar * delta, ORBIT.minPolar, ORBIT.maxPolar);
  const decay = Math.exp(-ORBIT.damping * delta);
  o.velocityAzimuth = Math.abs(o.velocityAzimuth * decay) < 1e-3 ? 0 : o.velocityAzimuth * decay;
  o.velocityPolar = Math.abs(o.velocityPolar * decay) < 1e-3 ? 0 : o.velocityPolar * decay;
}

export function startDrag(o: OrbitState) {
  o.dragging = true;
  o.resetting = false;
  o.velocityAzimuth = 0;
  o.velocityPolar = 0;
}

/** Drag by `dx`, `dy` points: dragging right turns the house right, dragging down shows it from above. */
export function dragBy(o: OrbitState, dx: number, dy: number) {
  o.azimuth -= dx * ORBIT.rotateSpeed;
  o.polar = clamp(o.polar - dy * ORBIT.rotateSpeed, ORBIT.minPolar, ORBIT.maxPolar);
}

/** Release: momentum from the drag speed (pt / s). */
export function release(o: OrbitState, velocityX: number, velocityY: number) {
  o.velocityAzimuth = -velocityX * ORBIT.rotateSpeed * ORBIT.fling;
  o.velocityPolar = -velocityY * ORBIT.rotateSpeed * ORBIT.fling;
}

export function endDrag(o: OrbitState) {
  o.dragging = false;
}

export function zoomTo(o: OrbitState, zoom: number) {
  o.resetting = false;
  o.zoom = clamp(zoom, ORBIT.minZoom, ORBIT.maxZoom);
}

export function startReset(o: OrbitState) {
  o.velocityAzimuth = 0;
  o.velocityPolar = 0;
  o.resetting = true;
}
