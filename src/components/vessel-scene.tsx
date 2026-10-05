"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { WebGLRenderer, WebGLRenderTarget } from "three";
import styles from "./vessel-scene.module.css";

type VesselValues = {
  title: string;
  format: string;
  quantity: number;
  selectionIndex: number;
  open: boolean;
  stage: "powder" | "vessel";
  labelText: string;
  application?: string;
  inspectingLabel?: boolean;
};

type VesselSceneProps = VesselValues & {
  tone?: "dark" | "light";
  onReady?: () => void;
};
type SceneEngine = { update: (values: VesselValues) => void };

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

/** Photographic pigment becomes a physical, individually labeled vessel. */
export function VesselScene({
  title,
  format,
  quantity,
  selectionIndex,
  open,
  stage = "powder",
  labelText = "",
  application = "",
  inspectingLabel = false,
  tone = "light",
  onReady,
}: VesselSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SceneEngine | null>(null);
  const valuesRef = useRef<VesselValues>({
    title,
    format,
    quantity,
    selectionIndex,
    open,
    stage,
    labelText,
    application,
    inspectingLabel,
  });
  const readyRef = useRef(onReady);
  const [mode, setMode] = useState<"loading" | "webgl" | "fallback">("loading");
  const photograph =
    POWDER_IMAGES[Math.min(2, Math.max(0, selectionIndex))] ?? POWDER_IMAGES[0];
  const [mask, setMask] = useState<{ source: string; url: string } | null>(
    null,
  );
  const currentMask = mask?.source === photograph ? mask.url : null;

  useEffect(() => {
    let current = true;
    void powderMask(photograph).then((url) => {
      if (current && url) setMask({ source: photograph, url });
    });
    return () => {
      current = false;
    };
  }, [photograph]);

  useEffect(() => {
    readyRef.current = onReady;
  }, [onReady]);

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
  ]);

  useEffect(() => {
    const root = rootRef.current;
    const host = canvasHostRef.current;
    if (!root || !host) return;
    let disposed = false;
    let release: (() => void) | undefined;

    async function initialize(root: HTMLDivElement, host: HTMLDivElement) {
      let renderer: WebGLRenderer | undefined;
      let environmentMap: WebGLRenderTarget | undefined;
      let frame: number | undefined;
      let previousTime: number | undefined;
      let observer: ResizeObserver | undefined;
      let failed = false;
      let released = false;
      const disposeResources: Array<() => void> = [];
      const detach: Array<() => void> = [];

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
        for (const dispose of disposeResources) dispose();
        environmentMap?.dispose();
        renderer?.dispose();
        renderer?.forceContextLoss();
        renderer?.domElement.remove();
      };

      function fallback() {
        if (failed) return;
        failed = true;
        release?.();
        if (!disposed) {
          setMode("fallback");
          readyRef.current?.();
        }
      }

      try {
        const [three, { createPowderMorph }] = await Promise.all([
          import("three"),
          import("./powder-morph"),
          document.fonts.ready,
        ]);
        if (disposed) return;

        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        renderer = new three.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "low-power",
        });
        renderer.outputColorSpace = three.SRGBColorSpace;
        renderer.toneMapping = three.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = three.PCFSoftShadowMap;
        renderer.setClearColor(0xffffff, 0);
        renderer.domElement.setAttribute("aria-hidden", "true");
        renderer.domElement.setAttribute("tabindex", "-1");
        host.append(renderer.domElement);

        const onContextLost = (event: Event) => {
          event.preventDefault();
          fallback();
        };
        renderer.domElement.addEventListener("webglcontextlost", onContextLost);
        detach.push(() =>
          renderer?.domElement.removeEventListener(
            "webglcontextlost",
            onContextLost,
          ),
        );

        const scene = new three.Scene();
        const camera = new three.OrthographicCamera(-2, 2, 2, -2, 0.1, 30);
        camera.position.set(0.16, 0.25, 8);
        camera.lookAt(0, 0, 0);

        const environment = new three.Scene();
        environment.background = new three.Color().setRGB(0.24, 0.24, 0.24);
        const reflectionCards = [
          { width: 2.6, height: 6, x: -3.2, y: 2, z: 4, power: 3.5 },
          { width: 1.4, height: 5, x: 4, y: 1, z: 2, power: 4 },
          { width: 5, height: 4, x: 0, y: 5, z: 0, power: 3 },
          { width: 4.5, height: 3.5, x: 0, y: 2.6, z: -5, power: 1.6 },
          { width: 2, height: 5, x: -5, y: 1, z: -2, power: 0.08 },
        ].map(({ width, height, x, y, z, power }) => {
          const card = new three.Mesh(
            new three.PlaneGeometry(width, height),
            new three.MeshBasicMaterial({
              color: new three.Color().setRGB(power, power, power),
              side: three.DoubleSide,
            }),
          );
          card.position.set(x, y, z);
          card.lookAt(0, 0, 0);
          environment.add(card);
          return card;
        });
        const pmrem = new three.PMREMGenerator(renderer);
        try {
          environmentMap = pmrem.fromScene(environment, 0.04, 0.1, 100);
          scene.environment = environmentMap.texture;
          scene.environmentIntensity = 0.85;
        } finally {
          for (const card of reflectionCards) {
            card.geometry.dispose();
            card.material.dispose();
          }
          pmrem.dispose();
        }

        const key = new three.DirectionalLight(0xffffff, 1.65);
        key.position.set(-3.5, 5, 5);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);
        key.shadow.camera.left = key.shadow.camera.bottom = -4;
        key.shadow.camera.right = key.shadow.camera.top = 4;
        key.shadow.camera.near = 0.1;
        key.shadow.camera.far = 20;
        key.shadow.bias = -0.0001;
        key.shadow.normalBias = 0.012;
        disposeResources.push(() => key.shadow.dispose());
        const fill = new three.DirectionalLight(0xf4f7fa, 0.45);
        fill.position.set(4, 2, 3);
        scene.add(
          key,
          fill,
          new three.HemisphereLight(0xffffff, 0xa4a59c, 0.3),
        );

        const computed = getComputedStyle(root);
        const sans =
          computed.getPropertyValue("--font-fraktion-sans") || "Arial";
        const mono =
          computed.getPropertyValue("--font-fraktion-mono") || "monospace";
        await Promise.all([
          document.fonts.load(`700 106px ${sans}`),
          document.fonts.load(`300 58px ${sans}`),
          document.fonts.load(`400 24px ${mono}`),
        ]);
        if (disposed || failed || released) return;

        const labelCanvas = document.createElement("canvas");
        labelCanvas.width = 1536;
        labelCanvas.height = 1024;
        const labelContext = labelCanvas.getContext("2d");
        if (!labelContext) throw new Error("Canvas unavailable");
        const labelMap = new three.CanvasTexture(labelCanvas);
        labelMap.colorSpace = three.SRGBColorSpace;
        labelMap.anisotropy = Math.min(
          renderer.capabilities.getMaxAnisotropy(),
          8,
        );
        function drawLabel(values: VesselValues) {
          const ctx = labelContext!;
          const left = 88;
          const right = 1448;
          ctx.fillStyle = "#f1f3ef";
          ctx.fillRect(0, 0, 1536, 1024);
          ctx.fillStyle = "#121814";
          ctx.textBaseline = "alphabetic";
          ctx.textAlign = "left";
          ctx.font = `700 64px ${sans}`;
          ctx.fillText("ATOMA", left, 94);
          ctx.font = `400 32px ${mono}`;
          ctx.textAlign = "right";
          ctx.fillText(
            `SELECTION / ${String(values.selectionIndex + 1).padStart(2, "0")}`,
            right,
            92,
          );
          ctx.textAlign = "left";
          ctx.font =
            '600 300px "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';
          ctx.fillText("抹茶", left, 416, 600);
          ctx.font = `700 124px ${sans}`;
          ctx.fillText("MATCHA", 770, 242, right - 770);
          ctx.fillText("POWDER", 770, 414, right - 770);
          const grade = (values.title.trim() || "MATCHA")
            .toUpperCase()
            .replace(/\s+MATCHA$/, "");
          ctx.strokeStyle = "#121814";
          ctx.lineWidth = 4;
          ctx.beginPath();
          for (const y of [128, 474, 658, 934]) {
            ctx.moveTo(left, y);
            ctx.lineTo(right, y);
          }
          ctx.moveTo(464, 658);
          ctx.lineTo(464, 934);
          ctx.moveTo(914, 474);
          ctx.lineTo(914, 658);
          ctx.stroke();
          ctx.font = `400 44px ${mono}`;
          ctx.fillText("PRODUCT", left, 534);
          ctx.fillText("APPLICATION", 958, 534);
          ctx.font = `700 78px ${sans}`;
          ctx.fillText(grade, left, 611, 760);
          ctx.font = `400 64px ${mono}`;
          ctx.fillText(
            (values.application || "—").toUpperCase(),
            958,
            611,
            right - 958,
          );
          ctx.font = `400 44px ${mono}`;
          ctx.fillText("FORMAT", left, 713);
          ctx.fillText("YOUR REFERENCE", 518, 713);
          ctx.font = `400 102px ${mono}`;
          ctx.fillText(values.format || "—", left, 843, 326);
          const reference = values.labelText.trim() || "—";
          ctx.font = `400 78px ${mono}`;
          if (ctx.measureText(reference).width <= 850) {
            ctx.fillText(reference, 518, 843);
          } else {
            const characters = Array.from(reference);
            const middle = Math.ceil(characters.length / 2);
            const space = characters.lastIndexOf(" ", middle + 4);
            const split = space > middle - 5 ? space : middle;
            const referenceLines = [
              characters.slice(0, split).join("").trim(),
              characters.slice(split).join("").trim(),
            ];
            ctx.font = `400 70px ${mono}`;
            referenceLines.forEach((line, index) => {
              ctx.fillText(line, 518, 817 + index * 82, 850);
            });
          }
          ctx.font = `400 24px ${mono}`;
          ctx.fillText("Carefully specified matcha.", left, 987);
          labelMap.needsUpdate = true;
        }

        disposeResources.push(() => labelMap.dispose());
        const loader = new three.TextureLoader();
        const powderMaps = await Promise.all(
          POWDER_IMAGES.map(async (url) => {
            const texture = await loader.loadAsync(url);
            if (disposed || failed || released) {
              texture.dispose();
              return texture;
            }
            texture.colorSpace = three.SRGBColorSpace;
            texture.repeat.set(0.1, 0.34);
            texture.offset.set(0.44, 0.28);
            texture.anisotropy = Math.min(
              renderer!.capabilities.getMaxAnisotropy(),
              8,
            );
            disposeResources.push(() => texture.dispose());
            return texture;
          }),
        );
        if (disposed || failed || released) return;
        const powderMorph = await createPowderMorph({
          imageUrls: POWDER_IMAGES,
          reducedMotion: motion.matches,
          vesselTarget: new three.Vector3(0, 0.85, 0),
          duration: 1.5,
        });
        if (disposed || failed || released) {
          powderMorph.dispose();
          return;
        }
        disposeResources.push(() => powderMorph.dispose());
        scene.add(powderMorph.object3d);

        const metal = new three.MeshStandardMaterial({
          color: 0xc6c9c8,
          metalness: 0.94,
          roughness: 0.27,
          envMapIntensity: 1.25,
        });
        const edgeMetal = new three.MeshStandardMaterial({
          color: 0xd6d8d7,
          metalness: 0.98,
          roughness: 0.2,
        });
        const labelMaterial = new three.MeshStandardMaterial({
          map: labelMap,
          roughness: 0.94,
          metalness: 0,
          envMapIntensity: 0.3,
        });
        const powderMaterial = new three.MeshStandardMaterial({
          color: 0xffffff,
          map: powderMaps[0],
          bumpMap: powderMaps[0],
          bumpScale: 0.006,
          roughness: 1,
          metalness: 0,
          envMapIntensity: 0.35,
        });

        // The overcap seats over the narrower raised neck. Both lathed sections
        // have real inner walls and rolled edges, including the hollow cap skirt.
        const bodyGeometry = new three.LatheGeometry(
          [
            [0, -0.945],
            [0.95, -0.945],
            [0.99, -0.934],
            [1.003, -0.911],
            [1.005, -0.875],
            [0.987, -0.85],
            [0.987, 0.475],
            [0.984, 0.5],
            [0.963, 0.518],
            [0.963, 0.945],
            [0.952, 0.97],
            [0.933, 0.97],
            [0.925, 0.945],
            [0.925, -0.78],
            [0, -0.78],
          ].map(([radius, y]) => new three.Vector2(radius, y)),
          128,
        );
        const lidGeometry = new three.LatheGeometry(
          [
            [0, 0.3],
            [0.85, 0.3],
            [0.982, 0.297],
            [1.004, 0.279],
            [1.012, 0.253],
            [1.012, -0.245],
            [1.004, -0.268],
            [0.982, -0.268],
            [0.976, -0.245],
            [0.976, 0.21],
            [0.946, 0.238],
            [0, 0.238],
          ]
            .reverse()
            .map(([radius, y]) => new three.Vector2(radius, y)),
          128,
        );
        const labelGeometry = new three.CylinderGeometry(
          0.98982,
          0.98982,
          1.18,
          96,
          1,
          true,
          -0.95,
          1.9,
        );
        const rimGeometry = new three.TorusGeometry(1.00016, 0.006, 8, 128);
        const powderGeometry = new three.CylinderGeometry(
          0.919,
          0.919,
          0.035,
          128,
        );

        const assembly = new three.Group();
        scene.add(assembly);
        const vessels = Array.from({ length: 3 }, (_, index) => {
          const group = new three.Group();
          const body = new three.Mesh(bodyGeometry, metal);
          body.castShadow = true;
          body.receiveShadow = true;
          const label = new three.Mesh(labelGeometry, labelMaterial);
          label.receiveShadow = true;
          label.position.y = -0.18;
          const powder = new three.Mesh(powderGeometry, powderMaterial);
          powder.receiveShadow = true;
          powder.position.y = 0.842;
          const lid = new three.Group();
          const lidSurface = new three.Mesh(lidGeometry, metal);
          lidSurface.castShadow = true;
          lidSurface.receiveShadow = true;
          lid.add(lidSurface);
          const lidRim = new three.Mesh(rimGeometry, edgeMetal);
          lidRim.rotation.x = Math.PI / 2;
          lidRim.position.y = -0.257;
          lid.add(lidRim);
          lid.position.y = 0.78;
          group.add(body, powder, label, lid);
          group.scale.setScalar(index === 0 ? 1 : 0.001);
          if (index === 1) group.position.set(1.2, 0.02, -0.95);
          if (index === 2) group.position.set(-0.65, 0.05, -1.95);
          assembly.add(group);
          return { group, lid };
        });

        disposeResources.push(() => {
          for (const geometry of [
            bodyGeometry,
            lidGeometry,
            labelGeometry,
            rimGeometry,
            powderGeometry,
          ])
            geometry.dispose();
          for (const material of [
            metal,
            edgeMetal,
            labelMaterial,
            powderMaterial,
          ]) {
            material.dispose();
          }
        });

        let values = valuesRef.current;
        let previousLabel = "";
        let viewportAspect = 1;
        let compactViewport = false;
        let notifiedReady = false;
        let currentFrustum = 3.8;
        let sceneTime = 0;
        let cameraTargetY = 0;
        let assembling = values.stage === "vessel";
        let assemblyAmount =
          values.stage === "vessel" && motion.matches ? 1 : 0;
        let pourProgress = 0;
        powderMorph.update(values.selectionIndex, values.stage);

        function updateLabel() {
          const signature = JSON.stringify([
            values.title,
            values.format,
            values.selectionIndex,
            values.labelText,
            values.application,
          ]);
          if (signature === previousLabel) return;
          previousLabel = signature;
          drawLabel(values);
          const index = Math.min(2, Math.max(0, values.selectionIndex));
          powderMaterial.map = powderMaps[index] ?? powderMaps[0]!;
          powderMaterial.bumpMap = powderMaterial.map;
          powderMaterial.needsUpdate = true;
        }

        function render(delta: number, immediate: boolean) {
          if (!renderer || disposed || failed) return false;
          sceneTime += delta;
          const powderMoving = powderMorph.tick(sceneTime, immediate);
          updateLabel();
          const isVessel = values.stage === "vessel";
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
          const labelCloseup = inspecting && !opened;
          const damp = immediate ? 1 : 1 - Math.exp(-delta * 5.4);
          let movement = 0;
          function ease(current: number, target: number) {
            movement += Math.abs(target - current);
            return current + (target - current) * damp;
          }

          const pose = Math.max(0, values.selectionIndex) % 3;
          const reveal = isVessel
            ? assembling
              ? three.MathUtils.smoothstep(pourProgress, 0.02, 0.48)
              : 1
            : 0;
          assemblyAmount = ease(assemblyAmount, reveal);
          assembly.scale.setScalar(Math.max(0.001, assemblyAmount));
          assembly.visible = assemblyAmount > 0.002;
          assembly.rotation.y = ease(
            assembly.rotation.y,
            assembling || inspecting
              ? 0
              : ([-0.14, 0.12, -0.27][pose] ?? -0.14),
          );
          assembly.rotation.z = ease(
            assembly.rotation.z,
            assembling || inspecting
              ? 0
              : ([-0.018, 0.015, -0.03][pose] ?? -0.018),
          );

          vessels.forEach(({ group, lid }, index) => {
            const present = index < count;
            const configurations: Array<[number, number, number, number]> =
              count === 1
                ? [
                    [0, 0, 0, 1],
                    [1.2, 0.02, -0.95, 0],
                    [-0.65, 0.05, -1.95, 0],
                  ]
                : [
                    [-0.65, -0.03, 0.45, 1],
                    [1.2, 0.02, -0.95, 0.86],
                    [-0.65, 0.05, -1.95, 0.8],
                  ];
            const [x, y, z, scale] = configurations[index] ?? [0, 0, 0, 1];
            group.position.x = ease(group.position.x, x);
            group.position.y = ease(group.position.y, y);
            group.position.z = ease(group.position.z, z);
            const nextScale = ease(group.scale.x, present ? scale : 0.001);
            group.scale.setScalar(nextScale);
            group.visible = nextScale > 0.002;
            const lidOpen = index === 0 && opened;
            lid.position.y = ease(lid.position.y, lidOpen ? 1.8 : 0.78);
            lid.rotation.y = ease(lid.rotation.y, lidOpen ? 0.18 : 0);
            lid.rotation.x = ease(lid.rotation.x, lidOpen ? -0.06 : 0);
          });

          const targetFrustum = Math.max(
            labelCloseup
              ? compactViewport
                ? 1.36
                : 2.45
              : isVessel
                ? opened
                  ? 4.1
                  : 3.55
                : 3.65,
            (labelCloseup ? 2.25 : count > 1 ? 4.6 : isVessel ? 2.6 : 2.2) /
              viewportAspect,
          );
          currentFrustum = ease(currentFrustum, targetFrustum);
          camera.position.x = ease(camera.position.x, labelCloseup ? 0 : 0.16);
          camera.position.y = ease(
            camera.position.y,
            labelCloseup ? 0.45 : isVessel ? 2.75 : 0.25,
          );
          cameraTargetY = ease(
            cameraTargetY,
            labelCloseup
              ? compactViewport
                ? -0.18
                : 0.08
              : isVessel
                ? opened
                  ? 0.48
                  : 0.14
                : 0,
          );
          camera.lookAt(0, cameraTargetY, 0);
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
          } else if (frame === undefined) {
            frame = requestAnimationFrame(tick);
          }
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
            if (values.stage !== next.stage) {
              assembling = next.stage === "vessel";
              pourProgress = 0;
            }
            if (
              values.selectionIndex !== next.selectionIndex ||
              values.stage !== next.stage
            ) {
              powderMorph.update(next.selectionIndex, next.stage);
            }
            values = next;
            schedule();
          },
        };
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

  return (
    <div
      ref={rootRef}
      className={styles.scene}
      data-renderer={mode}
      data-tone={tone}
      data-packaging="canister"
      data-stage={stage}
      data-inspecting-label={stage === "vessel" && inspectingLabel}
      role="img"
      aria-label={
        stage === "powder"
          ? `${title || "Matcha"} powder, formed from its material photograph.`
          : mode === "webgl"
            ? `${title || "Matcha"} in an aluminum vessel with a printed specification label${labelText ? `, reference ${labelText}` : ""}${open ? ", open to reveal the matcha inside" : ""}. Vessel study.`
            : `${title || "Matcha"} powder photograph, with selected format ${format || "not specified"}${labelText ? ` and reference ${labelText}` : ""}.`
      }
      aria-busy={mode === "loading"}
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
          draggable={false}
        />
      </div>
      {mode === "fallback" && stage === "vessel" && (
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
