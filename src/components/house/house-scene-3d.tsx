import { assetUrl } from "@/components/house/three/asset";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { HousePet, type HouseJob } from "@/components/house/three/house-pet";
import { HouseRoom, zoneOfObject } from "@/components/house/three/house-room";
import { FixedAnchor, createAnchor, type ScreenAnchor } from "@/components/house/three/screen-anchor";
import {
  ORBIT,
  dragBy,
  endDrag,
  fitDistance,
  initialOrbit,
  orbitPosition,
  release,
  startDrag,
  startReset,
  stepOrbit,
  zoomTo,
  type OrbitState,
} from "@/lib/house/orbit";
import { HOUSE_ZONES, PET_COLORMAP, ROOMS, type HouseZone, type PetAnimation, type RoomKey } from "@/lib/house/scene.generated";
import { toWorld } from "@/lib/house/walk";
import type { ZoneLevels } from "@/lib/house/zones";
import type { HouseMember, HouseMoodBand } from "@/types/house";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber/native";
import { Frown, Heart, Sparkles, type LucideIcon } from "lucide-react-native";
import { Suspense, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import {
  DoubleSide,
  MeshStandardMaterial,
  Raycaster,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  Vector3,
  type Camera,
  type Object3D,
  type Scene,
  type Texture,
} from "three";

/** Koppintásnál ennyi pt-on belül a rendetlen zóna helye is elég (a kis tárgyakat nehéz eltalálni). */
const TAP_RADIUS = 56;
/** A zóna fölötti pont (a csillogáshoz és a koppintáshoz), világegységben. */
const ZONE_MARK_HEIGHT = 0.45;

export interface HouseSceneHandle {
  /** Animált visszaállás az alapnézetre. */
  resetCamera: () => void;
}

interface HouseScene3DProps {
  ref?: Ref<HouseSceneHandle>;
  width: number;
  height: number;
  levels: ZoneLevels;
  members: HouseMember[];
  mood: HouseMoodBand;
  /** Tagonként a soron következő lejátszandó takarítás. */
  jobs: Record<number, HouseJob | undefined>;
  onJobDone: (userId: number, job: HouseJob) => void;
  /** A rendetlen zónára koppintva (a feladatokhoz visz). */
  onZonePress: (zone: HouseZone) => void;
  reducedMotion: boolean;
  dark: boolean;
  /** A jelenet háttere (a kártya színe). */
  background: string;
}

/** A látható szobák közös befoglaló gömbje: ide néz a kamera, ebből jön az alaptávolság. */
function houseBounds(rooms: readonly RoomKey[]) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const key of rooms) {
    const { bounds, offset } = ROOMS[key];
    const shift = [offset.x, 0, offset.z];
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], bounds.min[i] + shift[i]);
      max[i] = Math.max(max[i], bounds.max[i] + shift[i]);
    }
  }
  // A ház közepe kicsit a padló fölött (a bútorok magasságának harmadán).
  const target: [number, number, number] = [(min[0] + max[0]) / 2, (max[1] - min[1]) / 3, (min[2] + max[2]) / 2];
  const radius = Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2;
  return { target, radius };
}

function zoneMark(zone: HouseZone): [number, number, number] | null {
  const spot = ROOMS.main.spots[zone];
  if (!spot) return null;
  const world = toWorld("main", spot);
  return [world.x, ROOMS.main.floorY + ZONE_MARK_HEIGHT, world.z];
}

// ---------------------------------------------------------------- a Canvas belseje

/** A kamera a `target` körül kering az `orbit` szerint (lendület, visszaállás). */
function CameraRig({ orbit, target, distance }: { orbit: OrbitState; target: [number, number, number]; distance: number }) {
  useFrame(({ camera }, delta) => placeCamera(camera, orbit, delta, distance, target));
  return null;
}

function placeCamera(camera: Camera, orbit: OrbitState, delta: number, distance: number, target: [number, number, number]) {
  stepOrbit(orbit, delta);
  camera.position.set(...orbitPosition(orbit, distance * orbit.zoom, target));
  camera.lookAt(target[0], target[1], target[2]);
}

interface SceneBridge {
  /** A koppintott rendetlen zóna (`x`, `y`: pt a jelenet bal felső sarkától). */
  zoneAt: (x: number, y: number, levels: ZoneLevels) => HouseZone | null;
}

/** A gesztusok (a Canvason kívül) ebből olvassák a jelenetet és a legfrissebb propokat. */
interface GestureInput {
  bridge: SceneBridge | null;
  levels: ZoneLevels;
  onZonePress: (zone: HouseZone) => void;
}

function isShown(object: Object3D | null): boolean {
  for (let node = object; node; node = node.parent) if (!node.visible) return false;
  return true;
}

function createBridge(camera: Camera, scene: Scene, size: { width: number; height: number }): SceneBridge {
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  const projected = new Vector3();
  return {
    zoneAt: (x, y, levels) => {
      pointer.set((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      for (const hit of raycaster.intersectObjects(scene.children, true)) {
        if (!isShown(hit.object)) continue;
        const zone = zoneOfObject(hit.object);
        if (zone && levels[zone] > 0) return zone;
      }
      // Tartalék: a legközelebbi rendetlen zóna helye a koppintás körül.
      let best: { zone: HouseZone; d: number } | null = null;
      for (const zone of HOUSE_ZONES) {
        const mark = zoneMark(zone);
        if (!mark || levels[zone] <= 0) continue;
        projected.set(...mark).project(camera);
        const d = Math.hypot(((projected.x + 1) / 2) * size.width - x, ((1 - projected.y) / 2) * size.height - y);
        if (d <= TAP_RADIUS && (!best || d < best.d)) best = { zone, d };
      }
      return best?.zone ?? null;
    },
  };
}

function setBridge(input: GestureInput, bridge: SceneBridge | null) {
  input.bridge = bridge;
}

function updateInput(input: GestureInput, levels: ZoneLevels, onZonePress: (zone: HouseZone) => void) {
  input.levels = levels;
  input.onZonePress = onZonePress;
}

/** A Canvason kívülről (gesztusok) elérhető műveletek. */
function Bridge({ input }: { input: GestureInput }) {
  const { camera, scene, size } = useThree();
  useEffect(() => {
    setBridge(input, createBridge(camera, scene, size));
    return () => setBridge(input, null);
  }, [input, camera, scene, size]);
  return null;
}

/** Egy ujj: forgatás (lendülettel), két ujj: nagyítás, koppintás: rendetlen zóna. */
function createGesture(orbit: OrbitState, input: GestureInput) {
  let pinchStart = 1;
  const pan = Gesture.Pan()
    .runOnJS(true)
    .maxPointers(1)
    .minDistance(4)
    .onStart(() => startDrag(orbit))
    .onChange((event) => dragBy(orbit, event.changeX, event.changeY))
    .onEnd((event) => release(orbit, event.velocityX, event.velocityY))
    .onFinalize(() => endDrag(orbit));
  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onStart(() => {
      pinchStart = orbit.zoom;
    })
    .onUpdate((event) => zoomTo(orbit, pinchStart / event.scale));
  const tap = Gesture.Tap()
    .runOnJS(true)
    .maxDuration(300)
    .onEnd((event, success) => {
      if (!success) return;
      const zone = input.bridge?.zoneAt(event.x, event.y, input.levels);
      if (zone) input.onZonePress(zone);
    });
  return Gesture.Race(tap, Gesture.Simultaneous(pan, pinch));
}

/** Tagonként egy képernyő-horgony (lustán jön létre, utána ugyanaz marad). */
function anchorOf(anchors: Map<number, ScreenAnchor>, userId: number): ScreenAnchor {
  let anchor = anchors.get(userId);
  if (!anchor) {
    anchor = createAnchor();
    anchors.set(userId, anchor);
  }
  return anchor;
}

function createPetMaterial(colormap: Texture) {
  colormap.flipY = false;
  colormap.colorSpace = SRGBColorSpace;
  return new MeshStandardMaterial({ map: colormap, roughness: 0.8, metalness: 0, side: DoubleSide });
}

/** Egyszer szól, amikor a modellek betöltődtek (a Suspense után). */
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady]);
  return null;
}

function Lights({ dark, target }: { dark: boolean; target: [number, number, number] }) {
  const sun = useMemo(() => new Vector3(target[0] + 4, 9, target[2] + 2.5), [target]);
  return (
    <>
      <hemisphereLight args={dark ? ["#AEB6D6", "#4A4660", 1.1] : ["#FFF7EC", "#D9CDBB", 1.9]} />
      <directionalLight
        position={sun}
        intensity={dark ? 0.8 : 2.2}
        color={dark ? "#C9D3FF" : "#FFF1DE"}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      >
        <object3D attach="target" position={target} />
      </directionalLight>
      {/* Este ég az állólámpa. */}
      {dark && <pointLight position={[0.3, 1.05, 3.85]} color="#F3DFA2" intensity={2.2} distance={3.2} decay={1.6} />}
    </>
  );
}

interface PetsProps {
  members: HouseMember[];
  mood: HouseMoodBand;
  jobs: Record<number, HouseJob | undefined>;
  onJobDone: (userId: number, job: HouseJob) => void;
  onAnimationChange: (userId: number, animation: PetAnimation) => void;
  anchorFor: (userId: number) => ScreenAnchor;
  reducedMotion: boolean;
}

function Pets({ members, mood, jobs, onJobDone, onAnimationChange, anchorFor, reducedMotion }: PetsProps) {
  const colormap = useLoader(TextureLoader, assetUrl(PET_COLORMAP));
  const material = useMemo(() => createPetMaterial(colormap), [colormap]);
  useEffect(() => () => material.dispose(), [material]);

  return members.map((member, index) => (
    <HousePet
      key={member.user_id}
      member={member}
      index={index}
      mood={mood}
      job={jobs[member.user_id] ?? null}
      onJobDone={(job) => onJobDone(member.user_id, job)}
      onAnimationChange={(animation) => onAnimationChange(member.user_id, animation)}
      anchor={anchorFor(member.user_id)}
      material={material}
      reducedMotion={reducedMotion}
    />
  ));
}

// ---------------------------------------------------------------- RN overlay

const BUBBLES: Partial<Record<PetAnimation, { icon: LucideIcon; className: string }>> = {
  happy: { icon: Heart, className: "bg-success-soft text-success-active" },
  sad: { icon: Frown, className: "bg-primary-soft text-primary" },
  work: { icon: Sparkles, className: "bg-card text-success-active" },
};

/** Az overlay elemek szélessége: a horgony ennek a közepén van. */
const LABEL_WIDTH = 140;

function PetLabel({ member, anchor, animation }: { member: HouseMember; anchor: ScreenAnchor; animation: PetAnimation }) {
  const style = useAnimatedStyle(() => ({
    opacity: anchor.visible.value,
    transform: [{ translateX: anchor.x.value - LABEL_WIDTH / 2 }, { translateY: anchor.y.value - 22 }],
  }));
  const bubble = BUBBLES[animation];
  return (
    <Animated.View
      pointerEvents="none"
      accessible
      accessibilityLabel={member.name}
      className="absolute left-0 top-0 flex-row items-center justify-center gap-1"
      style={[{ width: LABEL_WIDTH }, style]}
    >
      <View className={`rounded-full px-2 py-0.5 ${member.is_me ? "bg-primary" : "bg-card"}`}>
        <Text
          numberOfLines={1}
          className={`text-label-sm ${member.is_me ? "text-primary-foreground" : "text-foreground"}`}
          style={{ fontSize: 10, lineHeight: 13 }}
        >
          {member.name}
        </Text>
      </View>
      {bubble && (
        <View className={`h-5 w-5 items-center justify-center rounded-full ${bubble.className}`}>
          <Icon as={bubble.icon} size={11} className={bubble.className} />
        </View>
      )}
    </Animated.View>
  );
}

/** Felvillanó csillogás a rendbe tett zóna fölött. */
function SparkleBurst({ anchor }: { anchor: ScreenAnchor }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withSequence(withTiming(1, { duration: 450 }), withTiming(2, { duration: 650 }));
  }, [progress]);
  const style = useAnimatedStyle(() => ({
    opacity: (progress.value <= 1 ? progress.value : 2 - progress.value) * anchor.visible.value,
    transform: [
      { translateX: anchor.x.value - 16 },
      { translateY: anchor.y.value - 16 - progress.value * 10 },
      { scale: 0.6 + Math.min(progress.value, 1) * 0.6 },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" className="absolute left-0 top-0" style={style}>
      <Icon as={Sparkles} size={32} className="text-success-active" />
    </Animated.View>
  );
}

// ---------------------------------------------------------------- a jelenet

interface Sparkle {
  key: number;
  anchor: ScreenAnchor;
  position: [number, number, number];
}

/**
 * A háztartás háza 3D-ben: a szoba a rendetlenséggel és a tagok állataival. Egy ujjal forgatható
 * (vízszintesen körbe, függőlegesen a felülnézet és 20° között), két ujjal nagyítható; a rendetlen
 * zónára koppintva `onZonePress`. A nevek és a buborékok RN overlayként követik az állatokat.
 */
export function HouseScene3D({
  ref,
  width,
  height,
  levels,
  members,
  mood,
  jobs,
  onJobDone,
  onZonePress,
  reducedMotion,
  dark,
  background,
}: HouseScene3DProps) {
  const { t } = useTranslation();
  const rooms = useMemo<RoomKey[]>(() => ["main"], []);
  const { target, radius } = useMemo(() => houseBounds(rooms), [rooms]);
  const distance = fitDistance(radius, width / height);

  // Változtatható állapot a gesztusoknak és a képkockáknak (nem okoz újrarenderelést).
  const [orbit] = useState(initialOrbit);
  const [input] = useState<GestureInput>(() => ({ bridge: null, levels, onZonePress }));
  const [anchors] = useState(() => new Map<number, ScreenAnchor>());
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  useImperativeHandle(ref, () => ({ resetCamera: () => startReset(orbit) }), [orbit]);

  useEffect(() => updateInput(input, levels, onZonePress), [input, levels, onZonePress]);

  const gesture = useMemo(() => createGesture(orbit, input), [orbit, input]);
  const anchorFor = useCallback((userId: number) => anchorOf(anchors, userId), [anchors]);

  const [animations, setAnimations] = useState<Record<number, PetAnimation>>({});
  const onAnimationChange = useCallback(
    (userId: number, animation: PetAnimation) =>
      setAnimations((current) => (current[userId] === animation ? current : { ...current, [userId]: animation })),
    []
  );

  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const sparkleTimers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const timers = sparkleTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const finishJob = useCallback(
    (userId: number, job: HouseJob) => {
      const position = job.zone ? zoneMark(job.zone) : null;
      if (position && !reducedMotion) {
        setSparkles((current) => [...current, { key: job.id, anchor: createAnchor(), position }]);
        const timer = setTimeout(() => {
          sparkleTimers.current.delete(timer);
          setSparkles((current) => current.filter((s) => s.key !== job.id));
        }, 1200);
        sparkleTimers.current.add(timer);
      }
      onJobDone(userId, job);
    },
    [onJobDone, reducedMotion]
  );

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={{ width, height }}
        accessible
        accessibilityRole="image"
        accessibilityLabel={t("house.sceneLabel")}
        accessibilityHint={t("house.sceneHint")}
      >
        <Canvas
          pointerEvents="none"
          shadows
          flat
          style={{ width, height }}
          camera={{ fov: ORBIT.fov, near: 0.1, far: 100, position: orbitPosition(ORBIT, distance, target) }}
        >
          <color attach="background" args={[background]} />
          <Lights dark={dark} target={target} />
          <CameraRig orbit={orbit} target={target} distance={distance} />
          <Bridge input={input} />
          <Suspense fallback={null}>
            {rooms.map((room) => (
              <HouseRoom key={room} room={room} levels={levels} reducedMotion={reducedMotion} />
            ))}
            <Pets
              members={members}
              mood={mood}
              jobs={jobs}
              onJobDone={finishJob}
              onAnimationChange={onAnimationChange}
              anchorFor={anchorFor}
              reducedMotion={reducedMotion}
            />
            {sparkles.map((sparkle) => (
              <FixedAnchor key={sparkle.key} anchor={sparkle.anchor} position={sparkle.position} />
            ))}
            <Ready onReady={onReady} />
          </Suspense>
        </Canvas>

        {members.map((member) => (
          <PetLabel key={member.user_id} member={member} anchor={anchorFor(member.user_id)} animation={animations[member.user_id] ?? "idle"} />
        ))}
        {sparkles.map((sparkle) => (
          <SparkleBurst key={sparkle.key} anchor={sparkle.anchor} />
        ))}

        {!ready && <Skeleton className="absolute inset-0 rounded-none" />}
      </View>
    </GestureDetector>
  );
}
