import { assetUrl } from "@/components/house/three/asset";
import { writeAnchor, type ScreenAnchor } from "@/components/house/three/screen-anchor";
import { PET_HEIGHT, PET_MODELS, PET_SCALE, ROOMS, type HouseZone, type PetAnimation } from "@/lib/house/scene.generated";
import { angleDelta, distance, randomWalkPoint, seeded, toWorld, yawBetween, type FloorPoint } from "@/lib/house/walk";
import type { HouseMember, HouseMoodBand } from "@/types/house";
import { useFrame, useLoader } from "@react-three/fiber/native";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimationMixer, Group, LoopRepeat, Vector3, type AnimationAction, type Material, type Mesh } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/** Padló egység / mp. */
const WALK_SPEED = 0.55;
const WORK_MS = 2600;
const CHEER_MS = 900;
/** Animációváltás áttűnése (mp). */
const CROSSFADE = 0.2;
/** Fordulás sebessége (1 / mp, exponenciális közelítés). */
const TURN_RATE = 10;

/** Egy lejátszandó takarítás: a zóna, ahova odamegy (`null`: csak örül a helyén). */
export interface HouseJob {
  id: number;
  zone: HouseZone | null;
}

/** Szétszórt kezdőhelyek (a tagok sorrendjében), hogy a nevek ne takarják egymást. */
const START_POINTS: readonly FloorPoint[] = [
  { x: 1.4, z: 1.5 },
  { x: 3.0, z: 1.6 },
  { x: 1.5, z: 3.2 },
  { x: 3.2, z: 3.1 },
  { x: 2.3, z: 2.3 },
  { x: 1.0, z: 2.4 },
  { x: 3.4, z: 2.3 },
  { x: 2.3, z: 3.5 },
];

function startPoint(index: number, userId: number): FloorPoint {
  const base = START_POINTS[index % START_POINTS.length];
  // Sok tagnál a második kör kicsit eltolva, mindig ugyanoda.
  const jitter = index >= START_POINTS.length ? 0.35 : 0.12;
  return toWorld("main", {
    x: base.x + (seeded(userId) - 0.5) * jitter,
    z: base.z + (seeded(userId + 101) - 0.5) * jitter,
  });
}

/** Álldogálás közben a hangulat szerinti mozdulat. */
function restingAnimation(mood: HouseMoodBand): PetAnimation {
  const roll = Math.random();
  switch (mood) {
    case "happy":
      return roll < 0.45 ? "happy" : roll < 0.6 ? "cheer" : "idle";
    case "content":
      return roll < 0.15 ? "cheer" : "idle";
    case "grumpy":
      return roll < 0.4 ? "sad" : "idle";
    case "sad":
      return roll < 0.7 ? "sad" : "idle";
  }
}

interface Motion {
  from: FloorPoint;
  to: FloorPoint;
  start: number;
  duration: number;
}

interface HousePetProps {
  member: HouseMember;
  /** A tag sorszáma (a kezdőhelyhez). */
  index: number;
  mood: HouseMoodBand;
  job: HouseJob | null;
  onJobDone: (job: HouseJob) => void;
  /** Az aktuális mozdulat (az overlay buborékjához). */
  onAnimationChange: (animation: PetAnimation) => void;
  /** A név / buborék helye a képernyőn (a fej fölött). */
  anchor: ScreenAnchor;
  /** Közös anyag (a colormap textúrával) minden állathoz. */
  material: Material;
  reducedMotion: boolean;
}

/**
 * Egy tag állata a házban: sétálgat a bejárható padlón, a közös hangulat szerint mozdul,
 * és ha `job` van, odamegy a zónához, rendet rak, majd örül (`onJobDone`).
 */
export function HousePet({ member, index, mood, job, onJobDone, onAnimationChange, anchor, material, reducedMotion }: HousePetProps) {
  const gltf = useLoader(GLTFLoader, assetUrl(PET_MODELS[member.character]));
  const floorY = ROOMS.main.floorY;

  // Ugyanazt az állatot több tag is választhatja: mindegyik saját másolatot kap.
  const { object, actions, mixer } = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.traverse((child) => {
      if (!(child as Mesh).isMesh) return;
      (child as Mesh).material = material;
      child.castShadow = true;
    });
    clone.scale.setScalar(PET_SCALE);
    const animationMixer = new AnimationMixer(clone);
    const clipActions = Object.fromEntries(
      gltf.animations.map((clip) => [clip.name, animationMixer.clipAction(clip).setLoop(LoopRepeat, Infinity)])
    ) as Record<PetAnimation, AnimationAction>;
    return { object: clone, actions: clipActions, mixer: animationMixer };
  }, [gltf, material]);

  const group = useRef<Group>(null);
  const start = useMemo(() => startPoint(index, member.user_id), [index, member.user_id]);
  const position = useRef<FloorPoint>(start);
  const motion = useRef<Motion | null>(null);
  const initialYaw = member.user_id % 2 ? Math.PI / 2 : 0;
  const yaw = useRef(initialYaw);
  const targetYaw = useRef(initialYaw);
  const [animation, setAnimation] = useState<PetAnimation>("idle");
  const head = useMemo(() => new Vector3(), []);

  const onJobDoneRef = useRef(onJobDone);
  const onAnimationChangeRef = useRef(onAnimationChange);
  useEffect(() => {
    onJobDoneRef.current = onJobDone;
    onAnimationChangeRef.current = onAnimationChange;
  }, [onJobDone, onAnimationChange]);

  // Animációváltás áttűnéssel.
  const current = useRef<AnimationAction | null>(null);
  useEffect(() => {
    const next = actions[animation];
    if (!next || current.current === next) return;
    next.reset().play();
    if (current.current) next.crossFadeFrom(current.current, CROSSFADE, false);
    current.current = next;
    onAnimationChangeRef.current(animation);
  }, [actions, animation]);

  useEffect(() => () => void mixer.stopAllAction(), [mixer]);

  useEffect(() => {
    if (reducedMotion) {
      if (job) onJobDoneRef.current(job);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const wait = (ms: number) => new Promise<void>((resolve) => (timer = setTimeout(resolve, ms)));

    const walkTo = async (target: FloorPoint) => {
      const from = position.current;
      const length = distance(from, target);
      if (length < 0.05) return;
      const duration = (length / WALK_SPEED) * 1000;
      motion.current = { from, to: target, start: performance.now(), duration };
      targetYaw.current = yawBetween(from, target);
      setAnimation("walk");
      await wait(duration);
    };

    const run = async () => {
      if (job) {
        if (job.zone) {
          const spot = ROOMS.main.spots[job.zone];
          if (spot) {
            await walkTo(toWorld("main", spot));
            if (cancelled) return;
            targetYaw.current = spot.yaw;
            setAnimation("work");
            await wait(WORK_MS);
            if (cancelled) return;
          }
        }
        setAnimation("cheer");
        await wait(CHEER_MS);
        if (!cancelled) onJobDoneRef.current(job);
        return;
      }
      while (!cancelled) {
        if (Math.random() < 0.5) {
          await walkTo(randomWalkPoint());
        } else {
          setAnimation(restingAnimation(mood));
          await wait(1800 + Math.random() * 2400);
        }
        if (cancelled) return;
        setAnimation("idle");
        await wait(700 + Math.random() * 1600);
      }
    };
    void run();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      // Séta közben megszakítva onnan folytatja, ahol éppen áll (a useFrame már odaállította).
      motion.current = null;
    };
  }, [job, mood, reducedMotion]);

  useFrame(({ camera, size }, delta) => {
    const node = group.current;
    if (!node) return;
    const step = motion.current;
    if (step) {
      const t = Math.min(1, (performance.now() - step.start) / step.duration);
      position.current = {
        x: step.from.x + (step.to.x - step.from.x) * t,
        z: step.from.z + (step.to.z - step.from.z) * t,
      };
      if (t >= 1) motion.current = null;
    }
    yaw.current += angleDelta(yaw.current, targetYaw.current) * Math.min(1, delta * TURN_RATE);
    node.position.set(position.current.x, floorY, position.current.z);
    node.rotation.y = yaw.current;
    // Csökkentett mozgásnál az első képkockán áll.
    mixer.update(reducedMotion ? 0 : delta);
    head.set(position.current.x, floorY + PET_HEIGHT + 0.08, position.current.z);
    writeAnchor(anchor, head, camera, size);
  });

  return (
    <group ref={group}>
      <primitive object={object} />
    </group>
  );
}
