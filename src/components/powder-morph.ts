import {
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  NormalBlending,
  Points,
  ShaderMaterial,
  Vector2,
  Vector3,
} from "three";

export type PowderStage = "powder" | "vessel";
export type PowderMorphOptions = {
  imageUrls?: readonly [string, string, string];
  pointCount?: number;
  reducedMotion?: boolean;
  duration?: number;
  entryDuration?: number;
  vesselTarget?: Vector3;
  entryImageUrl?: string;
};
export type PowderMorph = {
  object3d: Points<BufferGeometry, ShaderMaterial>;
  readonly transitionProgress: number;
  update: (selectionIndex: number, stage: PowderStage) => void;
  setSelection: (selectionIndex: number) => void;
  setStage: (stage: PowderStage) => void;
  setEntryFrame: (width: number, height: number) => void;
  beginEntry: () => void;
  resetEntry: () => void;
  tick: (timeSeconds: number, reducedMotion?: boolean) => boolean;
  dispose: () => void;
};

type PhotoShape = {
  positions: Float32Array;
  colors: Float32Array;
  grainSize: number;
  aspect: number;
};
const DEFAULT_IMAGES = [
  "/images/matcha/culinary.jpg",
  "/images/matcha/latte.jpg",
  "/images/matcha/tea-service.jpg",
] as const;
const HEIGHT = 3;
const TAU = Math.PI * 2;

function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
function smooth(low: number, high: number, value: number): number {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
}
function linear(value: number): number {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** The originals stay intact. Only green pigment is sampled into geometry. */
async function readPhotoShape(
  url: string,
  count: number,
  seed: number,
  preserveFrame = false,
): Promise<PhotoShape> {
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  await image.decode();
  const scale = Math.min(1, 720 / image.naturalHeight);
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Powder image sampling is unavailable.");
  context.drawImage(image, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);
  const candidates: number[] = [];
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const offset = pixel * 4;
    const r = data[offset]!;
    const g = data[offset + 1]!;
    const b = data[offset + 2]!;
    // Paper and its neutral shadows have no green chroma. This retains dark
    // green crevices as well as bright pigment, without a paper-colored plane.
    if (data[offset + 3]! < 128 || g - r <= 3 || g - b <= 9 || g <= b * 1.16)
      continue;
    candidates.push(pixel);
    const x = pixel % width;
    const y = Math.floor(pixel / width);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  if (candidates.length < 1000 || maxY <= minY) {
    throw new Error("Powder image contains insufficient material detail.");
  }
  const sampleRandom = random(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const unit = HEIGHT / (preserveFrame ? height : maxY - minY + 1);
  const centerX = preserveFrame ? (width - 1) * 0.5 : (minX + maxX) * 0.5;
  const centerY = preserveFrame ? (height - 1) * 0.5 : (minY + maxY) * 0.5;
  for (let i = 0; i < count; i += 1) {
    // Stratifying the entire mask gives even coverage of the original material,
    // including small edge fragments; independent random picking leaves holes.
    const candidate = Math.min(
      candidates.length - 1,
      Math.floor(((i + sampleRandom()) / count) * candidates.length),
    );
    const pixel = candidates[candidate]!;
    const offset = pixel * 4;
    const out = i * 3;
    positions[out] =
      ((pixel % width) - centerX + (sampleRandom() - 0.5) * 0.65) * unit;
    positions[out + 1] =
      (centerY - Math.floor(pixel / width) + (sampleRandom() - 0.5) * 0.65) *
      unit;
    positions[out + 2] = (sampleRandom() - 0.5) * 0.026;
    colors[out] = linear(data[offset]!);
    colors[out + 1] = linear(data[offset + 1]!);
    colors[out + 2] = linear(data[offset + 2]!);
  }
  canvas.width = 1;
  canvas.height = 1;
  return {
    positions,
    colors,
    // Slight overlap preserves the continuous photographic surface at rest.
    grainSize: unit * Math.sqrt(candidates.length / count) * 2.25,
    aspect: width / height,
  };
}

const vertexShader = `
  attribute vec3 aTarget;
  attribute vec3 aColor;
  attribute vec3 aTargetColor;
  attribute vec3 aCloud;
  attribute vec2 aSize;
  attribute float aSeed;
  uniform float uProgress;
  uniform float uPixelScale;
  uniform float uFromOpacity;
  uniform float uTargetOpacity;
  uniform float uPour;
  varying vec3 vColor;
  varying float vOpacity;
  varying float vSeed;

  void main() {
    float p = clamp(uProgress, 0.0, 1.0);
    float settle = smoothstep(0.0, 1.0, p);
    float bloom = pow(max(0.0, sin(p * 3.14159265359)), 1.35);
    float angle = p * 2.1 + aSeed * 6.28318530718;
    vec3 cloud = vec3(
      aCloud.x * cos(angle) - aCloud.z * sin(angle) * 0.58,
      aCloud.y + sin(angle * 1.7) * 0.08 + 0.08,
      aCloud.z * cos(angle) + aCloud.x * sin(angle) * 0.58
    );
    vec3 transformed = mix(position, aTarget, settle) + cloud * bloom;
    // The end of a pour narrows around the mouth, then settles below its rim.
    transformed.y += uPour * sin(p * 3.14159265359) * 0.23;
    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float grain = mix(aSize.x, aSize.y, settle);
    float pointScale = projectionMatrix[1][1] * uPixelScale;
    if (projectionMatrix[2][3] == -1.0) pointScale /= max(0.1, -mvPosition.z);
    gl_PointSize = clamp(grain * pointScale * (1.0 - bloom * 0.26), 1.05, 12.0);
    vColor = mix(aColor, aTargetColor, smoothstep(0.15, 0.85, p));
    float fade = uTargetOpacity < 0.5
      ? smoothstep(0.65, 1.0, p)
      : smoothstep(0.0, 0.42, p);
    vOpacity = mix(uFromOpacity, uTargetOpacity, fade);
    vSeed = aSeed;
  }
`;
const fragmentShader = `
  varying vec3 vColor;
  varying float vOpacity;
  varying float vSeed;
  void main() {
    vec2 grain = gl_PointCoord - 0.5;
    // Matte pigment, with a nearly opaque core; never additive or emissive.
    float radius = length(grain * vec2(1.0, 0.9 + vSeed * 0.16));
    if (radius > 0.5 || vOpacity < 0.006) discard;
    float edge = 1.0 - smoothstep(0.47, 0.5, radius);
    gl_FragColor = vec4(vColor, edge * vOpacity);
    #include <colorspace_fragment>
  }
`;

/**
 * Photo-shaped pigment with GPU motion. tick takes RAF time in seconds and
 * returns true only while a transition needs more frames. Updating an active
 * transition snapshots its current geometry once, so rapid clicks never queue
 * animations or jump back to an obsolete product.
 */
export async function createPowderMorph(
  options: PowderMorphOptions = {},
): Promise<PowderMorph> {
  const mobile = window.matchMedia("(max-width: 700px)").matches;
  const count = Math.max(
    5000,
    Math.min(90000, Math.round(options.pointCount ?? (mobile ? 32000 : 68000))),
  );
  const shapes = await Promise.all(
    (options.imageUrls ?? DEFAULT_IMAGES).map((url, index) =>
      readPhotoShape(url, count, 18307 + index * 3299),
    ),
  );
  const entryShape = options.entryImageUrl
    ? await readPhotoShape(options.entryImageUrl, count, 18307, true)
    : null;
  const initial = entryShape ?? shapes[0]!;
  const source = initial.positions.slice();
  const target = initial.positions.slice();
  const sourceColor = initial.colors.slice();
  const targetColor = initial.colors.slice();
  const cloud = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const size = new Float32Array(count * 2);
  const vessel = new Float32Array(count * 3);
  const vesselTarget = options.vesselTarget ?? new Vector3(0, 0.85, 0);
  const nextRandom = random(71903);
  for (let i = 0; i < count; i += 1) {
    const j = i * 3;
    const theta = nextRandom() * TAU;
    const z = nextRandom() * 2 - 1;
    const radius = Math.cbrt(nextRandom());
    const radial = Math.sqrt(1 - z * z) * radius;
    cloud[j] = Math.cos(theta) * radial * 1.32;
    cloud[j + 1] = z * radius * 0.38;
    cloud[j + 2] = Math.sin(theta) * radial * 1.2;
    seed[i] = nextRandom();
    const grainVariation = 0.92 + nextRandom() * 0.16;
    size[i * 2] = initial.grainSize * grainVariation;
    size[i * 2 + 1] = initial.grainSize * grainVariation;
    const vesselRadius = Math.sqrt(nextRandom()) * 0.33;
    const vesselAngle = nextRandom() * TAU;
    vessel[j] = vesselTarget.x + Math.cos(vesselAngle) * vesselRadius;
    vessel[j + 1] = vesselTarget.y - nextRandom() * 0.2;
    vessel[j + 2] = vesselTarget.z + Math.sin(vesselAngle) * vesselRadius;
  }
  const geometry = new BufferGeometry();
  const positions = new BufferAttribute(source, 3).setUsage(DynamicDrawUsage);
  const targets = new BufferAttribute(target, 3).setUsage(DynamicDrawUsage);
  const colors = new BufferAttribute(sourceColor, 3).setUsage(DynamicDrawUsage);
  const targetColors = new BufferAttribute(targetColor, 3).setUsage(
    DynamicDrawUsage,
  );
  const sizes = new BufferAttribute(size, 2).setUsage(DynamicDrawUsage);
  geometry.setAttribute("position", positions);
  geometry.setAttribute("aTarget", targets);
  geometry.setAttribute("aColor", colors);
  geometry.setAttribute("aTargetColor", targetColors);
  geometry.setAttribute("aCloud", new BufferAttribute(cloud, 3));
  geometry.setAttribute("aSeed", new BufferAttribute(seed, 1));
  geometry.setAttribute("aSize", sizes);
  const uniforms = {
    uProgress: { value: 1 },
    uPixelScale: { value: 500 },
    uFromOpacity: { value: 1 },
    uTargetOpacity: { value: 1 },
    uPour: { value: 0 },
  };
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: NormalBlending,
    toneMapped: false,
  });
  const object3d = new Points(geometry, material);
  object3d.name = "Atoma photographic powder";
  object3d.frustumCulled = false;
  const drawingSize = new Vector2();
  object3d.onBeforeRender = (renderer) => {
    renderer.getDrawingBufferSize(drawingSize);
    uniforms.uPixelScale.value = drawingSize.y * 0.5;
  };

  let selected = 0;
  let stage: PowderStage = "powder";
  let lastTime = 0;
  let startTime: number | null = null;
  let progress = 1;
  let reducedMotion = options.reducedMotion ?? false;
  let disposed = false;
  const duration = Math.max(0.1, options.duration ?? 1.5);
  let transitionDuration = duration;
  let holdingEntry = entryShape !== null;
  let entryScale = 1;

  function snapshotCurrent() {
    const settle = smooth(0, 1, progress);
    const colorBlend = smooth(0.15, 0.85, progress);
    const bloom = Math.max(0, Math.sin(progress * Math.PI)) ** 1.35;
    const lift = uniforms.uPour.value * Math.sin(progress * Math.PI) * 0.23;
    for (let i = 0; i < count; i += 1) {
      const j = i * 3;
      const angle = progress * 2.1 + seed[i]! * TAU;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      const cx = cloud[j]! * cosine - cloud[j + 2]! * sine * 0.58;
      const cy = cloud[j + 1]! + Math.sin(angle * 1.7) * 0.08 + 0.08;
      const cz = cloud[j + 2]! * cosine + cloud[j]! * sine * 0.58;
      source[j] = source[j]! * (1 - settle) + target[j]! * settle + cx * bloom;
      source[j + 1] =
        source[j + 1]! * (1 - settle) +
        target[j + 1]! * settle +
        cy * bloom +
        lift;
      source[j + 2] =
        source[j + 2]! * (1 - settle) + target[j + 2]! * settle + cz * bloom;
      for (let channel = 0; channel < 3; channel += 1) {
        sourceColor[j + channel] =
          sourceColor[j + channel]! * (1 - colorBlend) +
          targetColor[j + channel]! * colorBlend;
      }
      size[i * 2] =
        (size[i * 2]! * (1 - settle) + size[i * 2 + 1]! * settle) *
        (1 - bloom * 0.26);
    }
    const fade =
      uniforms.uTargetOpacity.value < 0.5
        ? smooth(0.65, 1, progress)
        : smooth(0, 0.42, progress);
    uniforms.uFromOpacity.value =
      uniforms.uFromOpacity.value * (1 - fade) +
      uniforms.uTargetOpacity.value * fade;
  }

  function update(index: number, nextStage: PowderStage, force = false) {
    if (disposed) return;
    const nextIndex = Math.max(
      0,
      Math.min(
        shapes.length - 1,
        Number.isFinite(index) ? Math.round(index) : 0,
      ),
    );
    if (holdingEntry) {
      selected = nextIndex;
      stage = nextStage;
      return;
    }
    if (!force && nextIndex === selected && nextStage === stage) return;
    snapshotCurrent();
    selected = nextIndex;
    stage = nextStage;
    const shape = shapes[selected]!;
    target.set(stage === "vessel" ? vessel : shape.positions);
    targetColor.set(shape.colors);
    for (let i = 0; i < count; i += 1) {
      size[i * 2 + 1] = shape.grainSize * (0.93 + seed[i]! * 0.14);
    }
    uniforms.uTargetOpacity.value = stage === "vessel" ? 0 : 1;
    uniforms.uPour.value = stage === "vessel" ? 1 : 0;
    progress = reducedMotion ? 1 : 0;
    transitionDuration = duration;
    uniforms.uProgress.value = progress;
    startTime = null;
    object3d.visible = !(reducedMotion && stage === "vessel");
    positions.needsUpdate = true;
    targets.needsUpdate = true;
    colors.needsUpdate = true;
    targetColors.needsUpdate = true;
    sizes.needsUpdate = true;
  }

  function resetEntry() {
    if (!entryShape || disposed) return;
    holdingEntry = true;
    for (let i = 0; i < source.length; i += 1) {
      source[i] = entryShape.positions[i]! * entryScale;
    }
    target.set(source);
    sourceColor.set(entryShape.colors);
    targetColor.set(entryShape.colors);
    for (let i = 0; i < count; i += 1) {
      size[i * 2] = size[i * 2 + 1] = entryShape.grainSize * entryScale;
    }
    progress = 1;
    startTime = null;
    uniforms.uProgress.value = 1;
    uniforms.uFromOpacity.value = uniforms.uTargetOpacity.value = 1;
    uniforms.uPour.value = 0;
    object3d.visible = true;
    positions.needsUpdate =
      targets.needsUpdate =
      colors.needsUpdate =
      targetColors.needsUpdate =
      sizes.needsUpdate =
        true;
  }

  return {
    object3d,
    get transitionProgress() {
      return progress;
    },
    update,
    setSelection: (index) => update(index, stage),
    setStage: (nextStage) => update(selected, nextStage),
    setEntryFrame(width, height) {
      if (!entryShape || !holdingEntry) return;
      const nextScale = Math.min(
        height / HEIGHT,
        width / (HEIGHT * entryShape.aspect),
      );
      if (Math.abs(entryScale - nextScale) < 0.0001) return;
      entryScale = nextScale;
      resetEntry();
    },
    beginEntry() {
      if (!holdingEntry) return;
      holdingEntry = false;
      update(selected, stage, true);
      transitionDuration = Math.max(0.1, options.entryDuration ?? 0.8);
    },
    resetEntry,
    tick(timeSeconds, nextReducedMotion = reducedMotion) {
      if (disposed) return false;
      reducedMotion = nextReducedMotion;
      lastTime = Number.isFinite(timeSeconds) ? timeSeconds : lastTime;
      if (progress < 1) {
        if (startTime === null) startTime = lastTime;
        progress = reducedMotion
          ? 1
          : Math.max(
              0,
              Math.min(1, (lastTime - startTime) / transitionDuration),
            );
        uniforms.uProgress.value = progress;
      }
      object3d.visible = holdingEntry || !(stage === "vessel" && progress >= 1);
      return progress < 1;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      object3d.removeFromParent();
      geometry.dispose();
      material.dispose();
    },
  };
}
