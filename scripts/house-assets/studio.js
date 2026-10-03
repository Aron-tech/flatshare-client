// A Ház nézet jelenete: Kenney Furniture Kit szoba, zónánként 3 rendetlenség-szint, Kenney Cube Pets állatok.
// Az app a szobát és az állatokat 3D-ben rajzolja (exportRoom / exportPet → GLB); a karakterválasztó
// rácsa a renderPet sprite-atlaszait használja (ugyanazzal az izometrikus kamerával).
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

const FURNITURE = "/.cache/furniture-kit/Models/GLTF format/";
const PETS = "/.cache/cube-pets/Models/GLB format/";

/** A szoba mérete (padlólapban): x 0..ROOM, z 0..ROOM; a hátsó falak az x = 0 és a z = 0 oldalon. */
const ROOM = 4;
const ROOM_WIDTH_PX = 1170;
/** Az állatok mérete a bútorokhoz képest (eredetileg ~1,6 egység magasak). */
const PET_SCALE = 0.3;
const FPS = 16;

/** A Japandi paletta (DESIGN.md) a Kenney anyagnevekre. */
const PALETTE = {
  wood: "#D9B990",
  woodDark: "#A8825E",
  carpet: "#D87758",
  carpetDarker: "#B9644B",
  carpetWhite: "#EFECE3",
  carpetBlue: "#7C9D86",
  metal: "#CFCAC0",
  metalLight: "#F5F2EB",
  metalMedium: "#9A958C",
  metalDark: "#5F5B55",
  glass: "#DCE6E0",
  _defaultMat: "#F7F3EC",
  plant: "#6F9A7A",
  lamp: "#F3DFA2",
  fur: "#A8825E",
};

const COLORS = {
  floor: "#E3CDA8",
  wall: "#F5F1E8",
  wallTrim: "#E8E4DA",
  plate: "#FBF8F2",
  plateRim: "#E8E4DA",
  terracotta: "#D87758",
  sage: "#7C9D86",
  sand: "#E6D5B8",
  ocean: "#7A9BB0",
  plum: "#9C7A93",
  honey: "#E2B65C",
  dirt: "#8B6B4A",
  dust: "#BDB6AA",
  bag: "#55595A",
  water: "#A9C9D8",
  wicker: "#C8A47A",
  paper: "#FFFDF8",
  note: "#F2D27A",
};

const loader = new GLTFLoader();
const cache = new Map();
function load(path) {
  if (!cache.has(path)) cache.set(path, loader.loadAsync(path));
  return cache.get(path);
}

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x000000, 0);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
/** 2:1 dimetrikus nézet: 30° emelkedés, 45° elforgatás (a kamera a +x, +z sarok felől néz). */
const VIEW_DIR = new THREE.Vector3(Math.cos(Math.PI / 6) * Math.SQRT1_2, Math.sin(Math.PI / 6), Math.cos(Math.PI / 6) * Math.SQRT1_2);

scene.add(new THREE.HemisphereLight("#FFF7EC", "#D9CDBB", 1.9));
const sun = new THREE.DirectionalLight("#FFF1DE", 2.2);
sun.position.set(6, 9, 4.5);
sun.target.position.set(ROOM / 2, 0, ROOM / 2);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.left = -6;
sun.shadow.camera.right = 6;
sun.shadow.camera.top = 6;
sun.shadow.camera.bottom = -6;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 30;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
sun.shadow.radius = 4;
scene.add(sun, sun.target);

const room = new THREE.Group();
scene.add(room);
/** zóna → [1. szint, 2. szint, 3. szint] csoportok (a magasabb szint a korábbiakat is tartalmazza). */
const mess = {};

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...options });
}

function recolor(object) {
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const m of materials) {
      const color = PALETTE[m.name];
      if (color) m.color.set(color);
      m.metalness = 0;
      m.roughness = Math.max(m.roughness ?? 0.8, 0.7);
    }
  });
  return object;
}

/**
 * Elhelyez egy Kenney modellt: `rotation` fokban az y tengely körül, a befoglaló doboz
 * minimum sarka kerül az (x, y, z) pontba.
 */
async function place(parent, name, { x, z, y = 0, rotation = 0, color } = {}) {
  const gltf = await load(FURNITURE + name + ".glb");
  const object = recolor(gltf.scene.clone(true));
  if (color) object.traverse((child) => child.isMesh && (child.material = material(color)));
  object.rotation.y = THREE.MathUtils.degToRad(rotation);
  object.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(object);
  object.position.set(x - box.min.x, y - box.min.y, z - box.min.z);
  parent.add(object);
  return object;
}

function mesh(parent, geometry, color, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1, shadow = true, options } = {}) {
  const m = new THREE.Mesh(geometry, material(color, options));
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.scale.set(sx, sy, sz);
  m.castShadow = shadow;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

/** Lapos folt a padlón (kosz, víz, mancsnyom). */
function decal(parent, color, { x, z, rx = 0.1, rz = 0.07, opacity = 0.55, rotation = 0, y = 0.052 }) {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(1, 24),
    new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.4, depthWrite: false })
  );
  m.rotation.set(-Math.PI / 2, 0, rotation);
  m.scale.set(rx, rz, 1);
  m.position.set(x, y, z);
  m.receiveShadow = true;
  m.renderOrder = 1;
  parent.add(m);
  return m;
}

// ---------------------------------------------------------------- szoba

async function buildRoom() {
  for (let i = 0; i < ROOM; i++) {
    for (let j = 0; j < ROOM; j++) {
      await place(room, "floorFull", { x: i, z: j, color: (i + j) % 2 ? COLORS.floor : "#E5D0AC" });
    }
  }
  // Hátsó falak: z = 0 mentén (konyha, ablak), x = 0 mentén (mosókonyha, fürdőajtó, nappali).
  const backX = ["wall", "wall", "wall", "wallWindow"];
  for (let i = 0; i < ROOM; i++) await place(room, backX[i], { x: i, z: -0.09, y: 0 });
  const backZ = ["wall", "wall", "wallDoorway", "wallWindow"];
  for (let j = 0; j < ROOM; j++) await place(room, backZ[j], { x: -0.09, z: j, rotation: 90 });

  // Konyhasor a z = 0 fal mentén.
  const counter = ["kitchenFridge", "kitchenCabinetDrawer", "kitchenSink", "kitchenCabinet", "kitchenStove", "kitchenCabinetDrawer"];
  let x = 0.12;
  for (const name of counter) {
    await place(room, name, { x, z: 0 });
    x += 0.43;
  }
  for (const ux of [0.98, 1.41, 2.27]) await place(room, "kitchenCabinetUpper", { x: ux, z: 0, y: 0.82 });
  await place(room, "hoodModern", { x: 1.84, z: 0, y: 0.8 });
  await place(room, "kitchenCoffeeMachine", { x: 2.42, z: 0.08, y: 0.45 });
  await place(room, "trashcan", { x: 2.95, z: 0.12 });
  await place(room, "pottedPlant", { x: 3.62, z: 0.12 });

  // Mosókonyha-sarok és szennyeskosár az x = 0 fal mentén.
  await place(room, "washer", { x: 0, z: 0.62, rotation: 90 });
  const basket = new THREE.Group();
  mesh(basket, new THREE.CylinderGeometry(0.14, 0.12, 0.22, 20, 1, true), COLORS.wicker, { y: 0.11, options: { side: THREE.DoubleSide } });
  mesh(basket, new THREE.CylinderGeometry(0.12, 0.12, 0.01, 20), COLORS.wicker, { y: 0.005 });
  basket.position.set(0.22, 0.05, 1.22);
  room.add(basket);

  // Fürdőszoba ajtaja a falnyílásban, előtte lábtörlő.
  await place(room, "doorway", { x: -0.06, z: 2.27, rotation: 90 });
  await place(room, "rugDoormat", { x: 0.05, z: 2.25, y: 0.05, rotation: 90 });

  // Nappali.
  await place(room, "loungeSofa", { x: 0.02, z: 2.98, rotation: 90 });
  await place(room, "lampRoundFloor", { x: 0.06, z: 3.85, rotation: 90 });
  await place(room, "rugRound", { x: 1.55, z: 2.2, y: 0.05, color: COLORS.sand });
  await place(room, "pillow", { x: 0.12, z: 3.2, y: 0.24, rotation: 90, color: COLORS.sage });
  await place(room, "pillow", { x: 0.12, z: 3.62, y: 0.24, rotation: 90, color: COLORS.terracotta });
}

// ---------------------------------------------------------------- rendetlenség

function plateStack(parent, count, { x, y, z }) {
  for (let i = 0; i < count; i++) {
    const jitter = (i % 2 ? 1 : -1) * 0.008;
    mesh(parent, new THREE.CylinderGeometry(0.07, 0.055, 0.014, 20), i % 3 === 2 ? COLORS.plateRim : COLORS.plate, {
      x: x + jitter,
      y: y + 0.008 + i * 0.016,
      z: z - jitter,
    });
  }
}

function cup(parent, { x, y, z, color = COLORS.terracotta }) {
  mesh(parent, new THREE.CylinderGeometry(0.028, 0.024, 0.055, 14), color, { x, y: y + 0.028, z });
}

function pot(parent, { x, y, z }) {
  mesh(parent, new THREE.CylinderGeometry(0.075, 0.07, 0.07, 18), PALETTE.metalDark, { x, y: y + 0.035, z });
  mesh(parent, new THREE.BoxGeometry(0.11, 0.012, 0.02), PALETTE.metalDark, { x: x + 0.11, y: y + 0.06, z });
}

function trashBag(parent, { x, z, s = 1, y = 0 }) {
  mesh(parent, new THREE.SphereGeometry(0.11 * s, 16, 12), COLORS.bag, { x, y: y + 0.09 * s, z, sy: 0.85 });
  mesh(parent, new THREE.ConeGeometry(0.035 * s, 0.07 * s, 8), COLORS.bag, { x, y: y + 0.2 * s, z });
}

function cloth(parent, color, { x, z, y = 0.06, ry = 0, w = 0.2, d = 0.14 }) {
  mesh(parent, new THREE.BoxGeometry(w, 0.03, d), color, { x, y: y + 0.015, z, ry, rz: 0.08 });
}

function clothHeap(parent, { x, z, y = 0.06, colors }) {
  colors.forEach((color, i) => {
    const angle = i * 2.1;
    mesh(parent, new THREE.SphereGeometry(0.075, 12, 8), color, {
      x: x + Math.cos(angle) * 0.05,
      y: y + 0.03 + i * 0.03,
      z: z + Math.sin(angle) * 0.05,
      sy: 0.45,
      sx: 1.2,
    });
  });
}

function pawTrail(parent, from, to, steps) {
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const side = i % 2 ? 0.035 : -0.035;
    const x = from.x + (to.x - from.x) * t + side;
    const z = from.z + (to.z - from.z) * t - side;
    decal(parent, COLORS.dirt, { x, z, rx: 0.028, rz: 0.032, opacity: 0.5 });
    for (let k = 0; k < 3; k++) {
      decal(parent, COLORS.dirt, { x: x + (k - 1) * 0.022, z: z - 0.04, rx: 0.009, rz: 0.011, opacity: 0.5 });
    }
  }
}

function dustBunny(parent, { x, z, s = 1 }) {
  for (let k = 0; k < 4; k++) {
    mesh(parent, new THREE.SphereGeometry(0.025 * s, 8, 6), COLORS.dust, {
      x: x + Math.cos(k * 1.7) * 0.025 * s,
      y: 0.07,
      z: z + Math.sin(k * 1.7) * 0.025 * s,
      shadow: false,
    });
  }
}

/** Zónánként a rendetlenség szintjei; minden szint az előzőre épül. */
const MESS_BUILDERS = {
  kitchen: [
    (g) => {
      plateStack(g, 4, { x: 1.62, y: 0.45, z: 0.2 });
      cup(g, { x: 1.48, y: 0.45, z: 0.32 });
    },
    (g) => {
      plateStack(g, 3, { x: 1.18, y: 0.4, z: 0.22 });
      pot(g, { x: 2.03, y: 0.45, z: 0.24 });
      cup(g, { x: 1.76, y: 0.45, z: 0.34, color: COLORS.sage });
    },
    (g) => {
      plateStack(g, 4, { x: 0.78, y: 0.45, z: 0.24 });
      plateStack(g, 2, { x: 1.95, y: 0.05, z: 0.62 });
      cup(g, { x: 2.5, y: 0.45, z: 0.34, color: COLORS.ocean });
      decal(g, COLORS.dirt, { x: 1.6, z: 0.62, rx: 0.08, rz: 0.05, opacity: 0.35 });
    },
  ],
  cleaning: [
    (g) => {
      decal(g, COLORS.dirt, { x: 2.6, z: 1.6, rx: 0.09, rz: 0.06, opacity: 0.35, rotation: 0.4 });
      dustBunny(g, { x: 3.5, z: 1.2 });
    },
    (g) => {
      pawTrail(g, { x: 0.55, z: 2.55 }, { x: 1.6, z: 1.9 }, 7);
      dustBunny(g, { x: 1.1, z: 3.6 });
    },
    (g) => {
      decal(g, COLORS.dirt, { x: 3.1, z: 2.9, rx: 0.15, rz: 0.1, opacity: 0.4, rotation: 1 });
      decal(g, COLORS.dirt, { x: 2.0, z: 3.4, rx: 0.08, rz: 0.06, opacity: 0.35 });
      pawTrail(g, { x: 2.0, z: 2.7 }, { x: 3.3, z: 3.5 }, 7);
      dustBunny(g, { x: 3.7, z: 3.4, s: 1.3 });
      dustBunny(g, { x: 0.7, z: 1.65 });
    },
  ],
  trash: [
    (g) => {
      mesh(g, new THREE.SphereGeometry(0.1, 14, 10), COLORS.bag, { x: 3.05, y: 0.42, z: 0.23, sy: 0.6 });
    },
    (g) => {
      trashBag(g, { x: 3.28, z: 0.42 });
    },
    (g) => {
      trashBag(g, { x: 2.98, z: 0.62, s: 0.9 });
      mesh(g, new THREE.BoxGeometry(0.06, 0.02, 0.04), COLORS.honey, { x: 3.4, y: 0.06, z: 0.75, ry: 0.6 });
      mesh(g, new THREE.BoxGeometry(0.05, 0.03, 0.05), COLORS.paper, { x: 3.15, y: 0.065, z: 0.85, ry: 0.3 });
    },
  ],
  laundry: [
    (g) => {
      clothHeap(g, { x: 0.22, z: 1.22, y: 0.2, colors: [COLORS.sage, COLORS.terracotta, COLORS.sand] });
    },
    (g) => {
      cloth(g, COLORS.ocean, { x: 0.55, z: 1.25, ry: 0.5 });
      cloth(g, COLORS.honey, { x: 0.45, z: 1.5, ry: -0.3, w: 0.16 });
    },
    (g) => {
      clothHeap(g, { x: 0.22, z: 3.3, y: 0.28, colors: [COLORS.plum, COLORS.sage] });
      clothHeap(g, { x: 0.62, z: 0.95, colors: [COLORS.terracotta, COLORS.sand, COLORS.ocean, COLORS.plum] });
    },
  ],
  shopping: [
    (g) => {
      mesh(g, new THREE.BoxGeometry(0.09, 0.09, 0.005), COLORS.note, { x: 0.33, y: 0.62, z: 0.3, rz: 0.08, shadow: false });
    },
    (g) => place(g, "cardboardBoxOpen", { x: 0.35, z: 0.45 }),
    (g) =>
      Promise.all([
        place(g, "cardboardBoxClosed", { x: 0.62, z: 0.55, rotation: 20 }),
        mesh(g, new THREE.BoxGeometry(0.07, 0.07, 0.005), COLORS.note, { x: 0.24, y: 0.75, z: 0.3, rz: -0.1, shadow: false }),
      ]),
  ],
  bathroom: [
    (g) => {
      cloth(g, COLORS.sage, { x: 0.55, z: 2.7, ry: 0.9, w: 0.26, d: 0.14 });
    },
    (g) => {
      decal(g, COLORS.water, { x: 0.65, z: 2.45, rx: 0.16, rz: 0.11, opacity: 0.75, rotation: 0.3 });
    },
    (g) => {
      decal(g, COLORS.water, { x: 0.9, z: 2.8, rx: 0.12, rz: 0.08, opacity: 0.7 });
      cloth(g, COLORS.terracotta, { x: 0.82, z: 2.25, ry: -0.5, w: 0.24 });
      mesh(g, new THREE.CylinderGeometry(0.035, 0.035, 0.08, 14), COLORS.paper, { x: 1.05, y: 0.09, z: 2.55, rx: Math.PI / 2, ry: 0.4 });
    },
  ],
};

async function buildMess() {
  for (const [zone, levels] of Object.entries(MESS_BUILDERS)) {
    mess[zone] = [];
    for (let level = 0; level < levels.length; level++) {
      const group = new THREE.Group();
      group.visible = false;
      await levels[level](group);
      scene.add(group);
      mess[zone].push(group);
    }
  }
}

/** Ahova az állat a zóna rendbetételéhez odamegy (padló koordináta) és amerre közben néz. */
const SPOTS = {
  kitchen: { x: 1.4, z: 0.85, facing: "ne" },
  shopping: { x: 0.45, z: 0.75, facing: "ne" },
  trash: { x: 3.05, z: 1.0, facing: "ne" },
  laundry: { x: 0.75, z: 1.25, facing: "nw" },
  bathroom: { x: 0.85, z: 2.5, facing: "nw" },
  cleaning: { x: 2.4, z: 2.3, facing: "se" },
};

/** A bejárható padlórész (az állatok itt sétálgatnak). */
const WALK_AREA = { minX: 0.9, maxX: 3.6, minZ: 1.0, maxZ: 3.6 };

// ---------------------------------------------------------------- kamera, renderelés

let ppu = 0;
let roomSize = { width: 0, height: 0 };

function fitCamera() {
  camera.position.copy(VIEW_DIR).multiplyScalar(30).add(new THREE.Vector3(ROOM / 2, 0, ROOM / 2));
  camera.lookAt(ROOM / 2, 0, ROOM / 2);
  camera.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(room);
  const corners = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z));
  const view = camera.matrixWorldInverse;
  const pts = corners.map((c) => c.clone().applyMatrix4(view));
  const margin = 0.08;
  const minX = Math.min(...pts.map((p) => p.x)) - margin;
  const maxX = Math.max(...pts.map((p) => p.x)) + margin;
  const minY = Math.min(...pts.map((p) => p.y)) - margin;
  // Felül hely marad az állatok fejének és a buboréknak.
  const maxY = Math.max(...pts.map((p) => p.y)) + margin;
  camera.left = minX;
  camera.right = maxX;
  camera.top = maxY;
  camera.bottom = minY;
  camera.updateProjectionMatrix();
  ppu = ROOM_WIDTH_PX / (maxX - minX);
  roomSize = { width: ROOM_WIDTH_PX, height: Math.round((maxY - minY) * ppu) };
  renderer.setSize(roomSize.width, roomSize.height);
}

/** A padlólapok teteje. */
const FLOOR_Y = 0.05;

function snapshot(type = "image/webp", quality = 0.9) {
  return renderer.domElement.toDataURL(type, quality);
}

function showMess(zone, level) {
  for (const [z, groups] of Object.entries(mess)) groups.forEach((g, i) => (g.visible = z === zone && i < level));
}

async function setup() {
  await buildRoom();
  await buildMess();
  fitCamera();
  return { room: roomSize, ppu };
}

/** Átnézeti kép: szoba + minden zóna adott szinten + néhány állat (csak ellenőrzéshez). */
async function renderPreview(level, pets = []) {
  for (const groups of Object.values(mess)) groups.forEach((g, i) => (g.visible = i < level));
  const added = [];
  for (const [i, pet] of pets.entries()) {
    const gltf = await load(PETS + `animal-${pet.name}.glb`);
    const object = gltf.scene.clone(true);
    object.traverse((c) => c.isMesh && ((c.castShadow = true), (c.receiveShadow = true)));
    object.scale.setScalar(PET_SCALE);
    object.position.set(pet.x, 0.05, pet.z);
    object.rotation.y = pet.rotation ?? 0;
    const mixer = new THREE.AnimationMixer(object);
    const clip = gltf.animations.find((a) => a.name === (pet.animation ?? "idle"));
    mixer.clipAction(clip).play();
    mixer.setTime(0.2 * i);
    scene.add(object);
    added.push(object);
  }
  renderer.setSize(roomSize.width, roomSize.height);
  renderer.render(scene, camera);
  const data = snapshot("image/png");
  added.forEach((o) => scene.remove(o));
  showMess(null, 0);
  return data;
}

// ---------------------------------------------------------------- állatok

/** Az animációk sorrendje az atlaszban; `clip` = a Kenney animáció neve. */
const PET_ANIMATIONS = [
  { name: "idle", clip: "idle", fps: 8 },
  { name: "walk", clip: "walk", fps: FPS },
  { name: "work", clip: "eat", fps: FPS },
  { name: "happy", clip: "dance", fps: FPS },
  { name: "cheer", clip: "gesture-positive", fps: FPS },
  { name: "sad", clip: "gesture-negative", fps: FPS },
];

/** A kép két nézési iránya; a másik kettő ezek tükörképe (sw = se tükrözve, nw = ne tükrözve). */
const FACINGS = [
  // Az állat alapból +z felé néz; +x a képen jobbra-le (se), −z jobbra-fel (ne).
  { name: "se", rotation: Math.PI / 2 },
  { name: "ne", rotation: Math.PI },
];

const PET_FRAME = { width: 176, height: 176, anchorY: 0.78 };

/** A képkocka szélén van-e nem átlátszó pixel (akkor a kocka túl kicsi). */
function touchesEdge(ctx, width, height) {
  const { data } = ctx.getImageData(0, 0, width, height);
  const solid = (x, y) => data[(y * width + x) * 4 + 3] > 24;
  for (let x = 0; x < width; x++) if (solid(x, 0) || solid(x, height - 1)) return true;
  for (let y = 0; y < height; y++) if (solid(0, y) || solid(width - 1, y)) return true;
  return false;
}

async function renderPet(name) {
  const gltf = await load(PETS + `animal-${name}.glb`);
  const stage = new THREE.Scene();
  stage.add(new THREE.HemisphereLight("#FFF7EC", "#D9CDBB", 1.9));
  const light = sun.clone();
  light.target = new THREE.Object3D();
  light.position.set(6, 9, 4.5).sub(new THREE.Vector3(ROOM / 2, 0, ROOM / 2));
  light.target.position.set(0, 0, 0);
  light.shadow.camera.left = -1;
  light.shadow.camera.right = 1;
  light.shadow.camera.top = 1;
  light.shadow.camera.bottom = -1;
  light.shadow.mapSize.set(1024, 1024);
  stage.add(light, light.target);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.ShadowMaterial({ opacity: 0.22 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  stage.add(ground);

  const object = gltf.scene;
  object.traverse((c) => c.isMesh && ((c.castShadow = true), (c.receiveShadow = false)));
  object.scale.setScalar(PET_SCALE);
  stage.add(object);
  const mixer = new THREE.AnimationMixer(object);

  // Ugyanaz a nézet és lépték, mint a szobánál; az (0, 0, 0) pont a képkocka horgonyára esik.
  const w = PET_FRAME.width / ppu;
  const h = PET_FRAME.height / ppu;
  const cam = new THREE.OrthographicCamera(-w / 2, w / 2, h * PET_FRAME.anchorY, -h * (1 - PET_FRAME.anchorY), 0.1, 100);
  cam.position.copy(VIEW_DIR).multiplyScalar(30);
  cam.lookAt(0, 0, 0);
  renderer.setSize(PET_FRAME.width, PET_FRAME.height);

  const frames = [];
  const animations = {};
  let clipped = 0;
  for (const facing of FACINGS) {
    object.rotation.y = facing.rotation;
    for (const anim of PET_ANIMATIONS) {
      const clip = gltf.animations.find((a) => a.name === anim.clip);
      const count = Math.max(2, Math.round(clip.duration * anim.fps));
      mixer.stopAllAction();
      const action = mixer.clipAction(clip);
      action.reset().play();
      if (facing.name === FACINGS[0].name) animations[anim.name] = { start: frames.length, count, fps: anim.fps };
      for (let i = 0; i < count; i++) {
        mixer.setTime((i / count) * clip.duration);
        renderer.render(stage, cam);
        const c = document.createElement("canvas");
        c.width = PET_FRAME.width;
        c.height = PET_FRAME.height;
        const ctx2d = c.getContext("2d");
        ctx2d.drawImage(renderer.domElement, 0, 0);
        if (touchesEdge(ctx2d, c.width, c.height)) clipped++;
        frames.push(c);
      }
    }
  }
  const perFacing = frames.length / FACINGS.length;
  const columns = 12;
  const rows = Math.ceil(frames.length / columns);
  const atlas = document.createElement("canvas");
  atlas.width = columns * PET_FRAME.width;
  atlas.height = rows * PET_FRAME.height;
  const ctx = atlas.getContext("2d");
  frames.forEach((f, i) => ctx.drawImage(f, (i % columns) * PET_FRAME.width, Math.floor(i / columns) * PET_FRAME.height));
  renderer.setSize(roomSize.width, roomSize.height);
  return {
    data: atlas.toDataURL("image/webp", 0.9),
    meta: { columns, rows, perFacing, facings: FACINGS.map((f) => f.name), animations },
    clipped,
  };
}

// ---------------------------------------------------------------- 3D export (az app futásidejű jelenete)

const exporter = new GLTFExporter();

async function toGlb(input, options = {}) {
  const buffer = await exporter.parseAsync(input, { binary: true, onlyVisible: false, ...options });
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

/** A nézési irány (y körüli elforgatás) a sprite-irány nevéből; az állat alapból +z felé néz. */
const FACING_YAW = { se: Math.PI / 2, ne: Math.PI, nw: -Math.PI / 2, sw: 0 };

/**
 * A fő szoba GLB-je: bútorok + zónánként `mess_<zone>_<szint>` csoportok (1..3, kumulatív:
 * a 2. szinten az 1. és 2. csoport látszik). Az appban a mess csoportok alapból rejtettek.
 */
async function exportRoom() {
  const house = new THREE.Group();
  house.name = "room_main";
  const furniture = room.clone(true);
  furniture.name = "furniture";
  house.add(furniture);
  for (const [zone, groups] of Object.entries(mess)) {
    groups.forEach((g, i) => {
      const copy = g.clone(true);
      copy.name = `mess_${zone}_${i + 1}`;
      copy.visible = true;
      house.add(copy);
    });
  }
  const box = new THREE.Box3().setFromObject(room);
  return {
    data: await toGlb(house),
    meta: {
      size: ROOM,
      floorY: FLOOR_Y,
      bounds: { min: box.min.toArray(), max: box.max.toArray() },
      walkArea: WALK_AREA,
      spots: Object.fromEntries(Object.entries(SPOTS).map(([zone, s]) => [zone, { x: s.x, z: s.z, yaw: FACING_YAW[s.facing] }])),
    },
  };
}

/**
 * Egy állat GLB-je a használt animációkkal (az app neveivel). A textúra kimarad: minden állat
 * ugyanazt a `colormap.png`-t használja, amit az app egyszer tölt be (az UV-k megmaradnak).
 */
async function exportPet(name) {
  const gltf = await loader.loadAsync(PETS + `animal-${name}.glb`);
  const object = gltf.scene;
  object.name = `pet_${name}`;
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.material = new THREE.MeshStandardMaterial({ name: "colormap", roughness: 0.8, metalness: 0, side: THREE.DoubleSide });
  });
  const animations = PET_ANIMATIONS.map((anim) => {
    const clip = gltf.animations.find((a) => a.name === anim.clip).clone();
    clip.name = anim.name;
    return clip;
  });
  const box = new THREE.Box3().setFromObject(object);
  return { data: await toGlb(object, { animations }), height: box.max.y - box.min.y };
}

window.studio = {
  ready: true,
  setup,
  exportRoom,
  exportPet,
  renderPreview,
  renderPet,
  zones: () => Object.keys(MESS_BUILDERS),
  petFrame: () => PET_FRAME,
};
