"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { WebGLRenderer } from "three";
import { getProductContent } from "@/lib/product-content";
import styles from "./bag-scene.module.css";

type BagValues = {
  title: string;
  format: string;
  quantity: number;
  selectionIndex: number;
  open: boolean;
  stage: "powder" | "vessel";
  labelText: string;
  application?: string;
  inspectingLabel?: boolean;
  entryFromTray?: boolean;
  enterPowder?: boolean;
};

type BagSceneProps = BagValues & {
  tone?: "dark" | "light";
  onReady?: () => void;
};
type SceneEngine = {
  update: (values: BagValues) => void;
  photographsReady: () => void;
  photographsFailed: () => void;
};

const POWDER_IMAGES = [
  "/images/matcha/culinary.jpg",
  "/images/matcha/latte.jpg",
  "/images/matcha/tea-service.jpg",
] as const;

// The fallback uses the same pigment boundary as the particle renderer. The
// original photograph remains intact; only a browser-local alpha mask is made.
const powderMasks = new Map<string, Promise<string | null>>();
function powderMask(source: string): Promise<string | null> {
  const cached = powderMasks.get(source);
  if (cached) return cached;
  const pending = (async () => {
    const photograph = new window.Image();
    photograph.decoding = "async";
    photograph.src = source;
    await photograph.decode();
    const scale = Math.min(1, 720 / photograph.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(photograph.naturalWidth * scale);
    canvas.height = Math.round(photograph.naturalHeight * scale);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(photograph, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const { data } = pixels;
    for (let offset = 0; offset < data.length; offset += 4) {
      const r = data[offset]!;
      const g = data[offset + 1]!;
      const b = data[offset + 2]!;
      const pigment = g - r > 3 && g - b > 9 && g > b * 1.16;
      data[offset] = data[offset + 1] = data[offset + 2] = 255;
      data[offset + 3] = pigment ? 255 : 0;
    }
    context.putImageData(pixels, 0, 0);
    const result = canvas.toDataURL("image/png");
    canvas.width = canvas.height = 1;
    return result;
  })().catch(() => null);
  powderMasks.set(source, pending);
  return pending;
}

function drawLabel(canvas: HTMLCanvasElement, values: BagValues, mono: string) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const ctx: CanvasRenderingContext2D = context;
  const left = 88;
  const right = 1448;
  const content = getProductContent(
    values.application
      ? {
          title: `${values.title} for ${values.application}`,
          handle: "",
          description: "",
        }
      : undefined,
  );
  const grade = (values.title || "Matcha")
    .replace(/\s+Matcha$/i, "")
    .toUpperCase();
  function text(
    value: string,
    x: number,
    y: number,
    size: number,
    width = right - x,
  ) {
    ctx.font = `400 ${size}px ${mono}`;
    ctx.fillText(value, x, y, width);
  }
  function paragraph(
    value: string,
    x: number,
    y: number,
    width: number,
    size: number,
    lineHeight: number,
    maxLines: number,
  ) {
    ctx.font = `400 ${size}px ${mono}`;
    let line = "";
    let row = 0;
    for (const word of value.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(next).width > width) {
        ctx.fillText(line, x, y + row * lineHeight);
        row += 1;
        if (row >= maxLines) return;
        line = word;
      } else line = next;
    }
    if (line && row < maxLines) ctx.fillText(line, x, y + row * lineHeight);
  }
  ctx.clearRect(0, 0, 1536, 1664);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "#324f63";
  text("ATOMA", left, 101, 52);
  ctx.fillStyle = "#0c1615";
  text("MATCHA", left - 5, 242, 160);
  text("POWDER", left, 312, 54);
  ctx.strokeStyle = "#26352e";
  ctx.lineWidth = 3.1;
  ctx.beginPath();
  for (const y of [370, 555, 990, 1204, 1500]) {
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
  }
  ctx.moveTo(768, 555);
  ctx.lineTo(768, 990);
  ctx.stroke();
  text("USE", left, 430, 36);
  text(
    (values.application || content.application).toUpperCase(),
    left,
    493,
    65,
    865,
  );
  ctx.textAlign = "right";
  text(grade, right, 493, 49, 440);
  ctx.textAlign = "left";
  text("SAMPLE PROFILE", left, 630, 36);
  text("MATERIAL / USE", 818, 630, 36);
  const profile = content.materialProfile;
  const selectedProperties = [profile[1], profile[2], profile[3]].filter(
    Boolean,
  );
  selectedProperties.forEach((property, index) => {
    text(property!.label.toUpperCase(), left, 690 + index * 92, 32, 585);
    text(property!.value, left, 744 + index * 92, 46, 585);
  });
  text("Matcha powder", 818, 744, 50, 620);
  paragraph(content.purpose, 818, 826, 620, 46, 58, 3);
  text("FORMAT", left, 1050, 36);
  text(values.format || "—", left - 4, 1144, 110, 1110);
  text("MATERIAL NOTES / SAMPLE", left, 1260, 34);
  paragraph(content.materialSummary, left, 1310, right - left, 44, 52, 4);
  text("YOUR REFERENCE", left, 1548, 30);
  const reference = values.labelText.trim() || "—";
  ctx.font = `400 64px ${mono}`;
  if (ctx.measureText(reference).width <= right - left) {
    text(reference, left, 1620, 64);
  } else {
    const characters = Array.from(reference);
    const middle = Math.ceil(characters.length / 2);
    const space = characters.lastIndexOf(" ", middle + 4);
    const split = space > middle - 5 ? space : middle;
    text(characters.slice(0, split).join("").trim(), left, 1592, 52);
    text(characters.slice(split).join("").trim(), left, 1642, 52);
  }
}
const BAG_IMAGES = [
  "/images/concept-02/bag-photographic-closed.webp",
  "/images/concept-02/bag-photographic-open.webp",
] as const;
const PHOTO_WIDTH = 1024;
const PHOTO_HEIGHT = 1536;
type Point = readonly [number, number];
type LabelQuad = readonly [Point, Point, Point, Point];
// Photograph coordinates, clockwise from the upper-left paper corner.
const LABEL_QUADS: readonly LabelQuad[] = [
  [
    [225, 436],
    [800, 435],
    [798, 1232],
    [225, 1233],
  ],
  [
    [225, 433],
    [800, 432],
    [798, 1233],
    [225, 1233],
  ],
];

/** Print transparent ink onto the paper; retain all photographic paper shading. */
function printLabel(
  context: CanvasRenderingContext2D,
  ink: HTMLCanvasElement,
  quad: LabelQuad,
) {
  const [tl, tr, br, bl] = quad;
  const point = (u: number, v: number): Point => [
    (1 - v) * ((1 - u) * tl[0] + u * tr[0]) + v * ((1 - u) * bl[0] + u * br[0]),
    (1 - v) * ((1 - u) * tl[1] + u * tr[1]) + v * ((1 - u) * bl[1] + u * br[1]),
  ];
  function triangle(
    source: readonly [Point, Point, Point],
    target: readonly [Point, Point, Point],
  ) {
    const [a, b, c] = source;
    const [p, q, r] = target;
    const denominator =
      a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]);
    const coefficients = (index: 0 | 1) => [
      (p[index] * (b[1] - c[1]) +
        q[index] * (c[1] - a[1]) +
        r[index] * (a[1] - b[1])) /
        denominator,
      (p[index] * (c[0] - b[0]) +
        q[index] * (a[0] - c[0]) +
        r[index] * (b[0] - a[0])) /
        denominator,
      (p[index] * (b[0] * c[1] - c[0] * b[1]) +
        q[index] * (c[0] * a[1] - a[0] * c[1]) +
        r[index] * (a[0] * b[1] - b[0] * a[1])) /
        denominator,
    ];
    const x = coefficients(0),
      y = coefficients(1);
    context.save();
    context.beginPath();
    context.moveTo(p[0], p[1]);
    context.lineTo(q[0], q[1]);
    context.lineTo(r[0], r[1]);
    context.closePath();
    context.clip();
    context.transform(x[0]!, y[0]!, x[1]!, y[1]!, x[2]!, y[2]!);
    context.drawImage(ink, 0, 0);
    context.restore();
  }
  // The nearly front-on paper needs only two affine triangles. Keeping this
  // small makes live typing and the first photo decode inexpensive.
  const subdivisions = 1;
  for (let y = 0; y < subdivisions; y++)
    for (let x = 0; x < subdivisions; x++) {
      const u = x / subdivisions,
        v = y / subdivisions,
        un = (x + 1) / subdivisions,
        vn = (y + 1) / subdivisions;
      const a: Point = [u * ink.width, v * ink.height],
        b: Point = [un * ink.width, v * ink.height];
      const c: Point = [un * ink.width, vn * ink.height],
        d: Point = [u * ink.width, vn * ink.height];
      triangle([a, b, c], [point(u, v), point(un, v), point(un, vn)]);
      triangle([a, c, d], [point(u, v), point(un, vn), point(u, vn)]);
    }
}

/** Shared photographic material choreography, with real photographed packaging. */
export function BagScene({
  title,
  format,
  quantity,
  selectionIndex,
  open,
  stage = "powder",
  labelText = "",
  application = "",
  inspectingLabel = false,
  entryFromTray = false,
  enterPowder = true,
  tone = "light",
  onReady,
}: BagSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const productCanvasesRef = useRef<Array<HTMLCanvasElement | null>>([]);
  const productImagesRef = useRef<HTMLImageElement[] | null>(null);
  const photographsReadyRef = useRef(false);
  const photographsFailedRef = useRef(false);
  const engineRef = useRef<SceneEngine | null>(null);
  const valuesRef = useRef<BagValues>({
    title,
    format,
    quantity,
    selectionIndex,
    open,
    stage,
    labelText,
    application,
    inspectingLabel,
    entryFromTray,
    enterPowder,
  });
  const readyRef = useRef(onReady);
  const [mode, setMode] = useState<"loading" | "webgl" | "fallback">("loading");
  const [photographsLoaded, setPhotographsLoaded] = useState(false);
  const [productReady, setProductReady] = useState(false);
  const [productFailed, setProductFailed] = useState(false);
  const photograph =
    POWDER_IMAGES[Math.min(2, Math.max(0, selectionIndex))] ?? POWDER_IMAGES[0];
  const [mask, setMask] = useState<{ source: string; url: string } | null>(
    null,
  );
  const [loadedPhotograph, setLoadedPhotograph] = useState<string | null>(null);
  const [failedPhotograph, setFailedPhotograph] = useState<string | null>(null);
  const currentMask = mask?.source === photograph ? mask.url : null;
  const photographFailed = failedPhotograph === photograph;
  const fallbackReady =
    mode === "fallback" &&
    (stage === "vessel"
      ? productReady || productFailed
      : photographFailed ||
        (Boolean(currentMask) && loadedPhotograph === photograph));

  useEffect(() => {
    readyRef.current = onReady;
  }, [onReady]);
  useEffect(() => {
    if (fallbackReady) readyRef.current?.();
  }, [fallbackReady, photograph]);
  useEffect(() => {
    let current = true;
    void powderMask(photograph).then((url) => {
      if (!current) return;
      if (url) setMask({ source: photograph, url });
      else setFailedPhotograph(photograph);
    });
    return () => {
      current = false;
    };
  }, [photograph]);
  useEffect(() => {
    const values = {
      title,
      format,
      quantity,
      selectionIndex,
      open,
      stage,
      labelText,
      application,
      inspectingLabel,
      entryFromTray,
      enterPowder,
    };
    valuesRef.current = values;
    engineRef.current?.update(values);
  }, [
    title,
    format,
    quantity,
    selectionIndex,
    open,
    stage,
    labelText,
    application,
    inspectingLabel,
    entryFromTray,
    enterPowder,
  ]);
  useEffect(() => {
    let current = true;
    void Promise.all(
      BAG_IMAGES.map(async (source) => {
        const image = new window.Image();
        image.decoding = "async";
        image.src = source;
        await image.decode();
        return image;
      }),
    )
      .then((images) => {
        if (!current) return;
        productImagesRef.current = images;
        setPhotographsLoaded(true);
      })
      .catch(() => {
        if (!current) return;
        photographsFailedRef.current = true;
        setProductFailed(true);
        engineRef.current?.photographsFailed();
      });
    return () => {
      current = false;
    };
  }, []);
  useEffect(() => {
    if (!photographsLoaded) return;
    let current = true;
    void document.fonts.ready.then(() => {
      if (!current) return;
      const ink = document.createElement("canvas");
      ink.width = 1536;
      ink.height = 1664;
      const mono = rootRef.current
        ? getComputedStyle(rootRef.current).getPropertyValue(
            "--font-fraktion-mono",
          ) || "monospace"
        : "monospace";
      drawLabel(
        ink,
        {
          title,
          format,
          quantity: 1,
          selectionIndex,
          open: false,
          stage: "vessel",
          labelText,
          application,
        },
        mono,
      );
      productCanvasesRef.current.forEach((canvas, index) => {
        const context = canvas?.getContext("2d");
        const image = productImagesRef.current?.[index % 2];
        if (!canvas || !context || !image) return;
        context.clearRect(0, 0, PHOTO_WIDTH, PHOTO_HEIGHT);
        const original = productCanvasesRef.current[index % 2];
        if (index >= 2 && original) {
          context.drawImage(original, 0, 0);
        } else {
          context.drawImage(image, 0, 0, PHOTO_WIDTH, PHOTO_HEIGHT);
          printLabel(context, ink, LABEL_QUADS[index % 2]!);
        }
      });
      photographsReadyRef.current = true;
      setProductReady(true);
      engineRef.current?.photographsReady();
    });
    return () => {
      current = false;
    };
  }, [
    photographsLoaded,
    title,
    format,
    selectionIndex,
    labelText,
    application,
  ]);

  useEffect(() => {
    const root = rootRef.current,
      host = canvasHostRef.current;
    if (!root || !host) return;
    let disposed = false;
    let release: (() => void) | undefined;
    async function initialize(root: HTMLDivElement, host: HTMLDivElement) {
      let renderer: WebGLRenderer | undefined;
      let frame: number | undefined, previousTime: number | undefined;
      let observer: ResizeObserver | undefined;
      let failed = false,
        released = false;
      const resources: Array<() => void> = [],
        detach: Array<() => void> = [];
      function stop() {
        if (frame !== undefined) cancelAnimationFrame(frame);
        frame = undefined;
        previousTime = undefined;
      }
      release = () => {
        if (released) return;
        released = true;
        stop();
        engineRef.current = null;
        observer?.disconnect();
        for (const remove of detach) remove();
        for (const dispose of resources) dispose();
        renderer?.dispose();
        renderer?.forceContextLoss();
        renderer?.domElement.remove();
      };
      function fallback() {
        if (failed) return;
        failed = true;
        release?.();
        if (!disposed) setMode("fallback");
      }
      try {
        const [three, { createPowderMorph }] = await Promise.all([
          import("three"),
          import("./powder-morph"),
        ]);
        if (disposed) return;
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        renderer = new three.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "low-power",
        });
        renderer.outputColorSpace = three.SRGBColorSpace;
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.setAttribute("aria-hidden", "true");
        renderer.domElement.setAttribute("data-scene-canvas", "");
        renderer.domElement.setAttribute("tabindex", "-1");
        host.append(renderer.domElement);
        const lost = (event: Event) => {
          event.preventDefault();
          fallback();
        };
        renderer.domElement.addEventListener("webglcontextlost", lost);
        detach.push(() =>
          renderer?.domElement.removeEventListener("webglcontextlost", lost),
        );
        const scene = new three.Scene();
        const camera = new three.OrthographicCamera(-2, 2, 2, -2, 0.1, 30);
        camera.position.set(0, 0, 8);
        camera.lookAt(0, 0, 0);
        const powderMorph = await createPowderMorph({
          imageUrls: POWDER_IMAGES,
          entryImageUrl: valuesRef.current.entryFromTray
            ? "/images/hero/matcha-tray-concept-02.webp"
            : undefined,
          reducedMotion: motion.matches,
          vesselTarget: new three.Vector3(0, 1.14, 0),
          duration: 1.5,
          entryDuration: 0.8,
        });
        if (disposed || failed || released) {
          powderMorph.dispose();
          return;
        }
        resources.push(() => powderMorph.dispose());
        scene.add(powderMorph.object3d);
        // No procedural metal, environment lights or artificial surface normals:
        // the camera photograph supplies the actual package material and lighting.
        const photographs = [0, 1].map((index) => {
          const canvas = productCanvasesRef.current[index];
          if (!canvas) throw new Error("Product photograph canvas unavailable");
          const texture = new three.CanvasTexture(canvas);
          texture.colorSpace = three.SRGBColorSpace;
          texture.anisotropy = Math.min(
            renderer!.capabilities.getMaxAnisotropy(),
            8,
          );
          resources.push(() => texture.dispose());
          return texture;
        });
        const assembly = new three.Group();
        scene.add(assembly);
        const plane = new three.PlaneGeometry(
          (3.5 * PHOTO_WIDTH) / PHOTO_HEIGHT,
          3.5,
        );
        resources.push(() => plane.dispose());
        const bags = Array.from({ length: 3 }, (_, index) => {
          const group = new three.Group();
          const materials = photographs.map(
            (map) =>
              new three.MeshBasicMaterial({
                map,
                transparent: true,
                depthWrite: false,
                toneMapped: false,
              }),
          );
          materials.forEach((material, pose) => {
            const mesh = new three.Mesh(plane, material);
            mesh.position.z = pose * 0.0001;
            mesh.renderOrder = (3 - index) * 2 + pose;
            group.add(mesh);
            resources.push(() => material.dispose());
          });
          group.scale.setScalar(index === 0 ? 1 : 0.001);
          assembly.add(group);
          return { group, materials, opening: 0 };
        });
        let values = valuesRef.current;
        let viewportAspect = 1,
          compactViewport = false,
          currentFrustum = 3.8,
          sceneTime = 0,
          cameraTargetY = 0;
        let notifiedReady = false;
        let effectiveStage: BagValues["stage"] =
          values.stage === "vessel" && photographsReadyRef.current
            ? "vessel"
            : "powder";
        let assembling = effectiveStage === "vessel",
          assemblyAmount = motion.matches && assembling ? 1 : 0,
          pourProgress = 0;
        powderMorph.update(values.selectionIndex, effectiveStage);
        if (values.enterPowder) powderMorph.beginEntry();
        function synchronizeStage() {
          const next =
            values.stage === "vessel" && photographsReadyRef.current
              ? "vessel"
              : "powder";
          if (effectiveStage !== next) {
            effectiveStage = next;
            assembling = next === "vessel";
            pourProgress = 0;
          }
          powderMorph.update(values.selectionIndex, effectiveStage);
        }
        function render(delta: number, immediate: boolean) {
          if (!renderer || disposed || failed) return false;
          sceneTime += delta;
          const holdingTray = values.entryFromTray && !values.enterPowder;
          if (holdingTray) {
            currentFrustum = Math.max(3.65, 2.2 / viewportAspect);
            powderMorph.setEntryFrame(
              currentFrustum * viewportAspect,
              currentFrustum,
            );
          }
          const powderMoving = powderMorph.tick(sceneTime, immediate);
          const isVessel = effectiveStage === "vessel";
          if (assembling) {
            pourProgress = Math.max(
              pourProgress,
              powderMorph.transitionProgress,
            );
            if (pourProgress >= 1) assembling = false;
          }
          const inspecting = isVessel && values.inspectingLabel && !assembling;
          const count =
            isVessel && !assembling && !inspecting
              ? Math.min(3, Math.max(1, values.quantity))
              : 1;
          const opened = isVessel && (assembling || values.open);
          const damp = immediate ? 1 : 1 - Math.exp(-delta * 5.4);
          let movement = 0;
          function ease(current: number, target: number) {
            movement += Math.abs(target - current);
            return current + (target - current) * damp;
          }
          const reveal = isVessel
            ? assembling
              ? three.MathUtils.smoothstep(pourProgress, 0.06, 0.62)
              : 1
            : 0;
          assemblyAmount = ease(assemblyAmount, reveal);
          assembly.visible = assemblyAmount > 0.002;
          bags.forEach((bag, index) => {
            const present = index < count;
            const x = count === 1 ? 0 : ([-0.28, 0.73, -0.91][index] ?? 0);
            const y = count === 1 ? 0 : ([-0.06, 0.07, 0.13][index] ?? 0);
            const scale = index === 0 ? 1 : 0.89;
            bag.group.position.x = ease(bag.group.position.x, x);
            bag.group.position.y = ease(
              bag.group.position.y,
              y - 0.08 * (1 - assemblyAmount),
            );
            bag.group.position.z = -index * 0.03;
            bag.group.rotation.z = ease(
              bag.group.rotation.z,
              count === 1 ? 0 : ([-0.014, -0.04, 0.045][index] ?? 0),
            );
            const size = ease(bag.group.scale.x, present ? scale : 0.001);
            bag.group.scale.setScalar(size);
            bag.group.visible = size > 0.002;
            bag.opening = ease(bag.opening, index === 0 && opened ? 1 : 0);
            bag.materials[0]!.opacity = assemblyAmount * (1 - bag.opening);
            bag.materials[1]!.opacity = assemblyAmount * bag.opening;
          });
          const targetFrustum = Math.max(
            inspecting ? (compactViewport ? 1.2 : 3) : 3.85,
            (inspecting ? 2.05 : count > 1 ? 4.1 : isVessel ? 2.6 : 2.2) /
              viewportAspect,
          );
          currentFrustum = holdingTray
            ? currentFrustum
            : ease(currentFrustum, targetFrustum);
          const labelMidY =
            PHOTO_HEIGHT / 2 -
            (LABEL_QUADS[0]![0][1] + LABEL_QUADS[0]![2][1]) / 2;
          cameraTargetY = ease(
            cameraTargetY,
            inspecting
              ? compactViewport
                ? -0.78
                : (labelMidY / PHOTO_HEIGHT) * 3.5
              : 0,
          );
          camera.position.set(0, holdingTray ? 0 : cameraTargetY, 8);
          camera.lookAt(0, holdingTray ? 0 : cameraTargetY, 0);
          camera.left = (-currentFrustum * viewportAspect) / 2;
          camera.right = (currentFrustum * viewportAspect) / 2;
          camera.top = currentFrustum / 2;
          camera.bottom = -currentFrustum / 2;
          camera.updateProjectionMatrix();
          try {
            renderer.render(scene, camera);
            if (!notifiedReady) {
              notifiedReady = true;
              setMode("webgl");
              readyRef.current?.();
            }
          } catch {
            fallback();
          }
          return powderMoving || assembling || movement > 0.001;
        }
        function tick(time: number) {
          frame = undefined;
          if (disposed || failed || document.hidden) return;
          const delta =
            previousTime === undefined
              ? 1 / 60
              : Math.min((time - previousTime) / 1000, 0.08);
          previousTime = time;
          const moving = render(delta, motion.matches);
          if (moving && !motion.matches && !failed)
            frame = requestAnimationFrame(tick);
          else previousTime = undefined;
        }
        function schedule() {
          if (disposed || failed || document.hidden) return;
          if (motion.matches) {
            stop();
            render(0, true);
          } else if (frame === undefined) frame = requestAnimationFrame(tick);
        }
        function resize() {
          if (!renderer || disposed || failed) return;
          const { width, height } = root.getBoundingClientRect();
          if (!width || !height) return;
          viewportAspect = width / height;
          compactViewport = window.innerWidth <= 760;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
          renderer.setSize(width, height, false);
          schedule();
        }
        function synchronize() {
          stop();
          schedule();
        }
        engineRef.current = {
          update(next) {
            if (values.enterPowder !== next.enterPowder) {
              if (next.enterPowder) powderMorph.beginEntry();
              else powderMorph.resetEntry();
            }
            values = next;
            if (photographsFailedRef.current && values.stage === "vessel") {
              fallback();
              return;
            }
            synchronizeStage();
            schedule();
          },
          photographsReady() {
            for (const photograph of photographs) photograph.needsUpdate = true;
            synchronizeStage();
            schedule();
          },
          photographsFailed() {
            if (values.stage === "vessel") fallback();
          },
        };
        if (photographsFailedRef.current && values.stage === "vessel") {
          fallback();
          return;
        }
        motion.addEventListener("change", synchronize);
        document.addEventListener("visibilitychange", synchronize);
        detach.push(
          () => motion.removeEventListener("change", synchronize),
          () => document.removeEventListener("visibilitychange", synchronize),
        );
        observer = new ResizeObserver(resize);
        observer.observe(root);
        resize();
      } catch {
        fallback();
      }
    }
    void initialize(root, host);
    return () => {
      disposed = true;
      release?.();
    };
  }, []);

  const fallbackCount = inspectingLabel
    ? 1
    : Math.min(3, Math.max(1, quantity));
  return (
    <div
      ref={rootRef}
      className={styles.scene}
      data-renderer={mode}
      data-packaging="bag"
      data-material="photographic"
      data-tone={tone}
      data-photograph-failed={photographFailed}
      data-product-ready={productReady}
      data-product-failed={productFailed}
      data-stage={stage}
      data-inspecting-label={stage === "vessel" && inspectingLabel}
      role="img"
      aria-label={
        stage === "powder"
          ? `${title || "Matcha"} powder, formed from its material photograph.`
          : `${title || "Matcha"} in a silver resealable pouch with a printed material label${labelText ? `, reference ${labelText}` : ""}${open ? ", open at the resealable mouth to reveal matcha inside" : ""}. Bag study.`
      }
      aria-busy={
        mode === "loading" ||
        (stage === "vessel" && !productReady && !productFailed)
      }
    >
      <div className={styles.fallbackImage} aria-hidden="true">
        <Image
          src={photograph}
          data-masked={Boolean(currentMask)}
          style={
            currentMask
              ? {
                  maskImage: `url("${currentMask}")`,
                  WebkitMaskImage: `url("${currentMask}")`,
                }
              : undefined
          }
          alt=""
          fill
          sizes="(max-width: 760px) 100vw, 60vw"
          className={styles.fallback}
          onLoad={() => setLoadedPhotograph(photograph)}
          onError={() => setFailedPhotograph(photograph)}
          draggable={false}
        />
      </div>
      <div
        className={styles.photographicFallback}
        data-count={fallbackCount}
        data-open={open}
        aria-hidden="true"
      >
        {[0, 1, 2].map((index) => (
          <div
            className={styles.photographicPackage}
            data-index={index}
            data-visible={index < fallbackCount}
            key={index}
          >
            {[0, 1].map((pose) => (
              <canvas
                key={pose}
                ref={(element) => {
                  productCanvasesRef.current[index * 2 + pose] = element;
                }}
                width={PHOTO_WIDTH}
                height={PHOTO_HEIGHT}
                data-pose={pose}
              />
            ))}
          </div>
        ))}
      </div>
      {mode === "fallback" &&
        (stage === "vessel" ? productFailed : photographFailed) && (
          <div className={styles.fallbackDetails} aria-hidden="true">
            <span>MATCHA POWDER</span>
            <strong>{title || "MATCHA"}</strong>
            <dl>
              <div>
                <dt>APPLICATION</dt>
                <dd>{application || "—"}</dd>
              </div>
              <div>
                <dt>FORMAT</dt>
                <dd>{format || "—"}</dd>
              </div>
              <div>
                <dt>YOUR REFERENCE</dt>
                <dd>{labelText || "—"}</dd>
              </div>
            </dl>
          </div>
        )}
      <div
        ref={canvasHostRef}
        className={styles.canvasLayer}
        aria-hidden="true"
      />
    </div>
  );
}
