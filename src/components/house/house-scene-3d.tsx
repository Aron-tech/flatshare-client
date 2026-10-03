import { assetUrl } from "@/components/house/three/asset";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Elevation } from "@/constants/theme";
import { HousePet, type HouseJob } from "@/components/house/three/house-pet";
import { HouseRoom, roomOfObject, zoneOfObject } from "@/components/house/three/house-room";
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
import { SPEECH_GAP_MS, SPEECH_VISIBLE_MS, doneLine, moodLine } from "@/lib/house/speech";
import { houseLayout, roomLevels, unlockedRoomKeys, zoneSpot, type HouseLayout } from "@/lib/house/rooms";
import type { ZoneLevels } from "@/lib/house/zones";
import type { HouseMember, HouseMoodBand, HouseRoomState } from "@/types/house";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber/native";
import { Frown, Heart, Sparkles, type LucideIcon } from "lucide-react-native";
import { Suspense, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import {
  BoxGeometry,
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
  /** A pontokból építhető szobák (a még nem megépültek szellemként látszanak). */
  rooms: HouseRoomState[];
  /** Egy még meg nem épült szobára koppintva (a szobaboltot nyitja). */
  onRoomPress: (room: HouseRoomState["key"]) => void;
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

function zoneMark(zone: HouseZone, layout: HouseLayout): [number, number, number] | null {
  const spot = zoneSpot(zone, layout);
  if (!spot) return null;
  return [spot.x, ROOMS[spot.room].floorY + ZONE_MARK_HEIGHT, spot.z];
}

/** Egy még meg nem épült szoba helye: áttetsző padló és körvonal (koppintható). */
function GhostRoom({ room, color }: { room: HouseRoomState["key"]; color: string }) {
  const { offset, size, floorY } = ROOMS[room];
  return (
    <group name={`ghost_${room}`} position={[offset.x + size.x / 2, floorY / 2, offset.z + size.z / 2]}>
      <mesh>
        <boxGeometry args={[size.x - 0.06, floorY, size.z - 0.06]} />
        <meshStandardMaterial color={color} transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new BoxGeometry(size.x - 0.06, floorY, size.z - 0.06)]} />
        <lineBasicMaterial color={color} />
      </lineSegments>
    </group>
  );
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

type TapTarget = { zone: HouseZone } | { room: HouseRoomState["key"] };

interface SceneBridge {
  /** A koppintott rendetlen zóna vagy meg nem épült szoba (`x`, `y`: pt a jelenet bal felső sarkától). */
  targetAt: (x: number, y: number, levels: ZoneLevels, layout: HouseLayout) => TapTarget | null;
}

/** A gesztusok (a Canvason kívül) ebből olvassák a jelenetet és a legfrissebb propokat. */
interface GestureInput {
  bridge: SceneBridge | null;
  levels: ZoneLevels;
  layout: HouseLayout;
  onZonePress: (zone: HouseZone) => void;
  onRoomPress: (room: HouseRoomState["key"]) => void;
}

function ghostOf(object: Object3D | null): HouseRoomState["key"] | null {
  for (let node = object; node; node = node.parent) {
    const match = /^ghost_(.+)$/.exec(node.name);
    if (match) return match[1] as HouseRoomState["key"];
  }
  return null;
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
    targetAt: (x, y, levels, layout) => {
      pointer.set((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      let ghost: HouseRoomState["key"] | null = null;
      for (const hit of raycaster.intersectObjects(scene.children, true)) {
        if (!isShown(hit.object)) continue;
        const zone = zoneOfObject(hit.object);
        if (zone && levels[zone] > 0 && layout.zoneRooms[zone] === roomOfObject(hit.object)) return { zone };
        ghost ??= ghostOf(hit.object);
      }
      // Tartalék: a legközelebbi rendetlen zóna helye a koppintás körül.
      let best: { zone: HouseZone; d: number } | null = null;
      for (const zone of HOUSE_ZONES) {
        const mark = zoneMark(zone, layout);
        if (!mark || levels[zone] <= 0) continue;
        projected.set(...mark).project(camera);
        const d = Math.hypot(((projected.x + 1) / 2) * size.width - x, ((1 - projected.y) / 2) * size.height - y);
        if (d <= TAP_RADIUS && (!best || d < best.d)) best = { zone, d };
      }
      if (best) return { zone: best.zone };
      return ghost ? { room: ghost } : null;
    },
  };
}

function setBridge(input: GestureInput, bridge: SceneBridge | null) {
  input.bridge = bridge;
}

function updateInput(input: GestureInput, values: Omit<GestureInput, "bridge">) {
  Object.assign(input, values);
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
      const target = input.bridge?.targetAt(event.x, event.y, input.levels, input.layout);
      if (target && "zone" in target) input.onZonePress(target.zone);
      else if (target) input.onRoomPress(target.room);
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

function Lights({ dark, target, radius }: { dark: boolean; target: [number, number, number]; radius: number }) {
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
        shadow-camera-left={-radius}
        shadow-camera-right={radius}
        shadow-camera-top={radius}
        shadow-camera-bottom={-radius}
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
  layout: HouseLayout;
  jobs: Record<number, HouseJob | undefined>;
  onJobDone: (userId: number, job: HouseJob) => void;
  onAnimationChange: (userId: number, animation: PetAnimation) => void;
  anchorFor: (userId: number) => ScreenAnchor;
  reducedMotion: boolean;
}

function Pets({ members, mood, layout, jobs, onJobDone, onAnimationChange, anchorFor, reducedMotion }: PetsProps) {
  const colormap = useLoader(TextureLoader, assetUrl(PET_COLORMAP));
  const material = useMemo(() => createPetMaterial(colormap), [colormap]);
  useEffect(() => () => material.dispose(), [material]);

  return members.map((member, index) => (
    <HousePet
      key={member.user_id}
      member={member}
      index={index}
      mood={mood}
      layout={layout}
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

/** Az overlay elemek szélessége és magassága: a horgony az alsó szél közepén van. */
const LABEL_WIDTH = 180;
const LABEL_HEIGHT = 120;

interface PetLabelProps {
  member: HouseMember;
  anchor: ScreenAnchor;
  animation: PetAnimation;
  /** Amit éppen mond (szövegbuborék). */
  speech: string | null;
}

function PetLabel({ member, anchor, animation, speech }: PetLabelProps) {
  const style = useAnimatedStyle(() => ({
    opacity: anchor.visible.value,
    transform: [{ translateX: anchor.x.value - LABEL_WIDTH / 2 }, { translateY: anchor.y.value - LABEL_HEIGHT + 4 }],
  }));
  const bubble = BUBBLES[animation];
  return (
    <Animated.View
      pointerEvents="none"
      accessible
      accessibilityLabel={speech ? `${member.name}: ${speech}` : member.name}
      accessibilityLiveRegion={speech ? "polite" : "none"}
      className="absolute left-0 top-0 items-center justify-end gap-1"
      style={[{ width: LABEL_WIDTH, height: LABEL_HEIGHT }, style]}
    >
      {speech && (
        <Animated.View
          entering={FadeIn.duration(250)}
          exiting={FadeOut.duration(300)}
          className="max-w-full rounded-container bg-popover px-2.5 py-1.5"
          style={Elevation.level1}
        >
          <Text className="text-center text-body-sm text-foreground" style={{ fontSize: 11, lineHeight: 14 }} numberOfLines={3}>
            {speech}
          </Text>
        </Animated.View>
      )}
      <View className="flex-row items-center gap-1">
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
      </View>
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
  rooms,
  onRoomPress,
  reducedMotion,
  dark,
  background,
}: HouseScene3DProps) {
  const { t } = useTranslation();
  const unlockedKeys = unlockedRoomKeys(rooms);
  const layout = useMemo(() => houseLayout(unlockedKeys), [unlockedKeys]);
  const lockedRooms = rooms.filter((room) => !room.unlocked && room.key in ROOMS);
  const { target, radius } = useMemo(() => houseBounds(layout.rooms), [layout]);
  const ghostColor = dark ? "#8A8FA8" : "#C9B89A";
  const distance = fitDistance(radius, width / height);

  // Változtatható állapot a gesztusoknak és a képkockáknak (nem okoz újrarenderelést).
  const [orbit] = useState(initialOrbit);
  const [input] = useState<GestureInput>(() => ({ bridge: null, levels, layout, onZonePress, onRoomPress }));
  const [anchors] = useState(() => new Map<number, ScreenAnchor>());
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  useImperativeHandle(ref, () => ({ resetCamera: () => startReset(orbit) }), [orbit]);

  useEffect(
    () => updateInput(input, { levels, layout, onZonePress, onRoomPress }),
    [input, levels, layout, onZonePress, onRoomPress]
  );

  const gesture = useMemo(() => createGesture(orbit, input), [orbit, input]);
  const anchorFor = useCallback((userId: number) => anchorOf(anchors, userId), [anchors]);

  const [animations, setAnimations] = useState<Record<number, PetAnimation>>({});
  const onAnimationChange = useCallback(
    (userId: number, animation: PetAnimation) =>
      setAnimations((current) => (current[userId] === animation ? current : { ...current, [userId]: animation })),
    []
  );

  // Időnként egy állat elmondja, mit gondol a házról (egyszerre legfeljebb egy buborék).
  const [speech, setSpeech] = useState<{ userId: number; text: string } | null>(null);
  const speechTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const say = useCallback((userId: number, text: string | null) => {
    if (!text) return;
    clearTimeout(speechTimer.current);
    setSpeech({ userId, text });
    speechTimer.current = setTimeout(() => setSpeech(null), SPEECH_VISIBLE_MS);
  }, []);
  useEffect(() => () => clearTimeout(speechTimer.current), []);

  const memberIds = members.map((member) => member.user_id).join(",");
  useEffect(() => {
    const ids = memberIds ? memberIds.split(",").map(Number) : [];
    if (ids.length === 0) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        say(ids[Math.floor(Math.random() * ids.length)], moodLine(t, mood, input.levels));
        schedule();
      }, SPEECH_GAP_MS.min + Math.random() * (SPEECH_GAP_MS.max - SPEECH_GAP_MS.min));
    };
    schedule();
    return () => clearTimeout(timer);
  }, [input, memberIds, mood, say, t]);

  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const sparkleTimers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const timers = sparkleTimers.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const finishJob = useCallback(
    (userId: number, job: HouseJob) => {
      const position = job.zone ? zoneMark(job.zone, layout) : null;
      if (position && !reducedMotion) {
        setSparkles((current) => [...current, { key: job.id, anchor: createAnchor(), position }]);
        const timer = setTimeout(() => {
          sparkleTimers.current.delete(timer);
          setSparkles((current) => current.filter((s) => s.key !== job.id));
        }, 1200);
        sparkleTimers.current.add(timer);
      }
      say(userId, doneLine(t));
      onJobDone(userId, job);
    },
    [layout, onJobDone, reducedMotion, say, t]
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
          <Lights dark={dark} target={target} radius={radius + 1} />
          <CameraRig orbit={orbit} target={target} distance={distance} />
          <Bridge input={input} />
          <Suspense fallback={null}>
            {layout.rooms.map((room) => (
              <HouseRoom key={room} room={room} levels={roomLevels(room, levels, layout)} reducedMotion={reducedMotion} />
            ))}
            {lockedRooms.map((room) => (
              <GhostRoom key={room.key} room={room.key} color={ghostColor} />
            ))}
            <Pets
              members={members}
              mood={mood}
              layout={layout}
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
          <PetLabel
            key={member.user_id}
            member={member}
            anchor={anchorFor(member.user_id)}
            animation={animations[member.user_id] ?? "idle"}
            speech={speech?.userId === member.user_id ? speech.text : null}
          />
        ))}
        {sparkles.map((sparkle) => (
          <SparkleBurst key={sparkle.key} anchor={sparkle.anchor} />
        ))}

        {!ready && <Skeleton className="absolute inset-0 rounded-none" />}
      </View>
    </GestureDetector>
  );
}
