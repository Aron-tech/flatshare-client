/**
 * A Ház nézet kamerája: a ház közepe körül kering (gömbi koordináták). A függőleges szög
 * (`polar`, a függőlegestől mérve) korlátos, így a padló alá nem lehet belátni.
 */
export interface OrbitState {
  /** Vízszintes szög (radián); 0 = a kamera a +z oldalon. */
  azimuth: number;
  /** A függőlegestől mért szög (radián). */
  polar: number;
  /** Az alaptávolság szorzója (1 = a ház épp kitölti a képet). */
  zoom: number;
  /** Elengedés utáni lendület (radián / mp). */
  velocityAzimuth: number;
  velocityPolar: number;
  dragging: boolean;
  /** Animált visszaállás az alapnézetre. */
  resetting: boolean;
}

export const ORBIT = {
  /** A kezdő nézet: a +x, +z sarok felől, 34°-os emelkedéssel (a korábbi izometrikus képhez hasonló). */
  azimuth: Math.PI / 4,
  polar: (56 * Math.PI) / 180,
  /** Majdnem felülnézet. */
  minPolar: (12 * Math.PI) / 180,
  /** 20°-kal a vízszintes fölött: a ház alja nem látszik. */
  maxPolar: (70 * Math.PI) / 180,
  /** A közelítés / távolítás határa az alaptávolsághoz képest. */
  minZoom: 0.45,
  maxZoom: 1.5,
  /** Radián / húzott pont. */
  rotateSpeed: 0.0085,
  /** Az elengedéskori lendület aránya (a húzás sebességéhez képest). */
  fling: 0.6,
  /** A lendület lecsengése (1 / mp). */
  damping: 4.5,
  fov: 35,
} as const;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Az a kameratávolság, amelyből a `radius` sugarú gömb (a ház) belefér a képbe,
 * álló és fekvő képarányon is.
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

/** A kamera helye a `target` körül, `distance` távolságban. */
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

/** Egy képkocka: lendület vagy animált visszaállás az alapnézetre. */
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

/** Húzás `dx`, `dy` pontnyit: jobbra húzva a ház jobbra fordul, lefelé húzva felülről látszik. */
export function dragBy(o: OrbitState, dx: number, dy: number) {
  o.azimuth -= dx * ORBIT.rotateSpeed;
  o.polar = clamp(o.polar - dy * ORBIT.rotateSpeed, ORBIT.minPolar, ORBIT.maxPolar);
}

/** Elengedés: a húzás sebességéből (pt / mp) lendület. */
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
