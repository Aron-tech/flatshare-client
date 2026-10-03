import { assetUrl } from "@/components/house/three/asset";
import { HOUSE_ZONES, ROOMS, messNodeName, type HouseZone, type RoomKey } from "@/lib/house/scene.generated";
import type { ZoneLevels } from "@/lib/house/zones";
import { useFrame, useLoader } from "@react-three/fiber/native";
import { useEffect, useMemo, useRef } from "react";
import { type Material, type Object3D } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/** A rendetlenség megjelenése / eltűnése (mp). */
const FADE_IN = 0.4;
const FADE_OUT = 0.8;

const BASE_OPACITY = "messBaseOpacity";
const BASE_TRANSPARENT = "messBaseTransparent";

interface MessLayer {
  zone: HouseZone;
  level: number;
  object: Object3D;
  /** A csoport saját (klónozott) anyagai az eredeti átlátszóságukkal. */
  materials: { material: Material; opacity: number; transparent: boolean }[];
  /** 0..1, a jelenlegi láthatóság. */
  opacity: number;
}

interface HouseRoomProps {
  room: RoomKey;
  levels: ZoneLevels;
  reducedMotion: boolean;
}

/** A mess csoportokból a zónához tartozó gyökér (koppintásnál). */
export function zoneOfObject(object: Object3D | null): HouseZone | null {
  for (let node = object; node; node = node.parent) {
    const match = /^mess_(.+)_[123]$/.exec(node.name);
    if (match && (HOUSE_ZONES as readonly string[]).includes(match[1])) return match[1] as HouseZone;
  }
  return null;
}

/** Melyik szoba modelljéhez tartozik az objektum (a GLB gyökere `room_<kulcs>`). */
export function roomOfObject(object: Object3D | null): RoomKey | null {
  for (let node = object; node; node = node.parent) {
    const match = /^room_(.+)$/.exec(node.name);
    if (match && match[1] in ROOMS) return match[1] as RoomKey;
  }
  return null;
}

/**
 * Egy szoba modellje (bútorok) és a zónák rendetlensége: a `levels` szerinti szintig minden
 * mess csoport látszik (a szintek egymásra épülnek), a változás áttűnéssel jelenik meg.
 */
export function HouseRoom({ room, levels, reducedMotion }: HouseRoomProps) {
  const definition = ROOMS[room];
  const gltf = useLoader(GLTFLoader, assetUrl(definition.model));

  const layers = useMemo(() => prepareLayers(gltf.scene), [gltf]);

  const levelsRef = useRef(levels);
  useEffect(() => {
    levelsRef.current = levels;
    if (reducedMotion) snapLayers(layers, levels);
  }, [layers, levels, reducedMotion]);

  useFrame((_, delta) => {
    if (!reducedMotion) fadeLayers(layers, levelsRef.current, delta);
  });

  return <primitive object={gltf.scene} position={[definition.offset.x, 0, definition.offset.z]} />;
}

/** Árnyékok bekapcsolása, a mess csoportok elrejtése, saját anyaggal (hogy az áttűnés ne hasson másra). */
function prepareLayers(scene: Object3D): MessLayer[] {
  const result: MessLayer[] = [];
  scene.traverse((child) => {
    child.castShadow = true;
    child.receiveShadow = true;
  });
  for (const zone of HOUSE_ZONES) {
    for (const level of [1, 2, 3] as const) {
      const object = scene.getObjectByName(messNodeName(zone, level));
      if (!object) continue;
      const materials: MessLayer["materials"] = [];
      object.traverse((child) => {
        if (!("material" in child) || !child.material) return;
        const material = ownMaterial(child as { material: Material });
        materials.push({
          material,
          opacity: material.userData[BASE_OPACITY] as number,
          transparent: material.userData[BASE_TRANSPARENT] as boolean,
        });
      });
      object.visible = false;
      result.push({ zone, level, object, materials, opacity: 0 });
    }
  }
  return result;
}

/** The loaded scene is cached app-wide, so the original opacity is stored on the clone once. */
function ownMaterial(child: { material: Material }): Material {
  if (BASE_OPACITY in child.material.userData) return child.material;
  const material = child.material.clone();
  material.userData[BASE_OPACITY] = material.opacity;
  material.userData[BASE_TRANSPARENT] = material.transparent;
  child.material = material;
  return material;
}

/** Áttűnés nélkül (csökkentett mozgás). */
function snapLayers(layers: MessLayer[], levels: ZoneLevels) {
  for (const layer of layers) {
    layer.opacity = layer.level <= levels[layer.zone] ? 1 : 0;
    apply(layer);
  }
}

function fadeLayers(layers: MessLayer[], levels: ZoneLevels, delta: number) {
  for (const layer of layers) {
    const target = layer.level <= levels[layer.zone] ? 1 : 0;
    if (layer.opacity === target) continue;
    const step = delta / (target > layer.opacity ? FADE_IN : FADE_OUT);
    layer.opacity = target > layer.opacity ? Math.min(1, layer.opacity + step) : Math.max(0, layer.opacity - step);
    apply(layer);
  }
}

function apply(layer: MessLayer) {
  layer.object.visible = layer.opacity > 0;
  const fading = layer.opacity < 1;
  for (const entry of layer.materials) {
    const transparent = fading || entry.transparent;
    if (entry.material.transparent !== transparent) {
      entry.material.transparent = transparent;
      entry.material.needsUpdate = true;
    }
    entry.material.opacity = entry.opacity * layer.opacity;
  }
}
