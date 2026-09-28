"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { WebGLRenderer, WebGLRenderTarget } from "three";
import type { createPrecisionTray as buildPrecisionTray } from "./precision-tray";
import styles from "./precision-scene.module.css";

type RendererMode = "loading" | "webgl" | "fallback";
type MotionMode = "running" | "reduced" | "hidden";

export function PrecisionScene({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const [rendererMode, setRendererMode] = useState<RendererMode>("loading");
  const [motionMode, setMotionMode] = useState<MotionMode>("running");

  useEffect(() => {
    const root = rootRef.current;
    const canvasHost = canvasHostRef.current;
    if (!root || !canvasHost) return;
    let disposed = false;
    let release: (() => void) | undefined;

    async function initialize(
      root: HTMLDivElement,
      canvasHost: HTMLDivElement,
    ) {
      try {
        const [three, { createPrecisionTray }] = await Promise.all([
          import("three"),
          import("./precision-tray"),
        ]);
        if (disposed) return;
        setRendererMode("loading");
        const light = tone === "light";

        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const finePointer = window.matchMedia(
          "(any-hover: hover) and (any-pointer: fine)",
        );
        let renderer: WebGLRenderer | undefined;
        let environmentMap: WebGLRenderTarget | undefined;
        let tray: ReturnType<typeof buildPrecisionTray> | undefined;
        let resizeObserver: ResizeObserver | undefined;
        let frame: number | undefined;
        let previousTime: number | undefined;
        let elapsed = 0;
        let failed = false;
        let released = false;
        const detach: Array<() => void> = [];
        const pointer = new three.Vector2();
        const pointerTarget = new three.Vector2();

        const stop = () => {
          if (frame !== undefined) cancelAnimationFrame(frame);
          frame = undefined;
          previousTime = undefined;
        };

        release = () => {
          if (released) return;
          released = true;
          stop();
          resizeObserver?.disconnect();
          for (const removeListener of detach) removeListener();
          tray?.dispose();
          environmentMap?.dispose();
          renderer?.dispose();
          renderer?.forceContextLoss();
          renderer?.domElement.remove();
          renderer = undefined;
          tray = undefined;
          resizeObserver = undefined;
        };

        const fallback = () => {
          failed = true;
          release?.();
          if (!disposed) setRendererMode("fallback");
        };

        renderer = new three.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "low-power",
        });
        renderer.outputColorSpace = three.SRGBColorSpace;
        renderer.toneMapping = three.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = three.PCFShadowMap;
        renderer.setClearColor(0x000000, 0);
        renderer.domElement.setAttribute("aria-hidden", "true");
        renderer.domElement.setAttribute("tabindex", "-1");
        canvasHost.append(renderer.domElement);

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
        scene.background = null;
        const camera = new three.PerspectiveCamera(32, 1, 0.1, 100);
        // Original studio reflection cards: a long key, narrow edge, and soft fill.
        const environment = new three.Scene();
        environment.background = light
          ? new three.Color().setRGB(0.16, 0.17, 0.16)
          : new three.Color().setRGB(0.025, 0.027, 0.03);
        const cards = [
          { width: 9, height: 1.6, x: 0, y: 5, z: -4, power: 7 },
          { width: 1.2, height: 7, x: -5, y: 2, z: 1, power: 5 },
          { width: 3, height: 5, x: 5, y: 4, z: 2, power: light ? 3.5 : 2.5 },
          { width: 2, height: 5, x: 3, y: 3, z: -3, power: 0.005 },
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
          environmentMap = pmrem.fromScene(environment, 0.025, 0.1, 100, {
            size: 128,
          });
          scene.environment = environmentMap.texture;
        } finally {
          for (const card of cards) {
            card.geometry.dispose();
            card.material.dispose();
          }
          pmrem.dispose();
        }
        const keyLight = new three.DirectionalLight(
          0xffffff,
          light ? 3.1 : 2.9,
        );
        keyLight.position.set(-3, 3.3, 6);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        keyLight.shadow.camera.left = -4.5;
        keyLight.shadow.camera.right = 4.5;
        keyLight.shadow.camera.top = 3.5;
        keyLight.shadow.camera.bottom = -3.5;
        keyLight.shadow.camera.near = 0.1;
        keyLight.shadow.camera.far = 20;
        keyLight.shadow.normalBias = 0.006;
        keyLight.shadow.bias = -0.0001;
        detach.push(() => keyLight.shadow.dispose());
        const fillLight = new three.DirectionalLight(
          0xe9efff,
          light ? 0.7 : 0.45,
        );
        fillLight.position.set(5, 3, -2);
        scene.add(keyLight, fillLight);
        tray = createPrecisionTray(three);
        const specimen = new three.Group();
        specimen.add(tray.group);
        scene.add(specimen);
        const direction = new three.Vector3();
        let distance = 12;

        function paint(delta = 0) {
          if (disposed || failed || !renderer) return;
          const reduced = motion.matches;
          const progress = reduced ? 1 : Math.min(elapsed / 4000, 1);
          const reveal = 1 - (1 - progress) ** 3;
          const ambient = reduced ? 0 : Math.max(0, elapsed - 4000) / 1000;
          if (reduced) {
            pointer.set(0, 0);
          } else {
            pointer.lerp(pointerTarget, 1 - Math.exp(-delta * 5));
          }
          specimen.rotation.set(
            0.022 + pointer.y * 0.025,
            0.26 * (1 - reveal) -
              0.12 +
              Math.sin(ambient * 0.23) * 0.016 +
              pointer.x * 0.04,
            -0.025 + (1 - reveal) * 0.07 + Math.sin(ambient * 0.19) * 0.008,
          );
          specimen.position.y = Math.sin(ambient * 0.22) * 0.015;
          direction
            .set(
              0.06 * (1 - reveal),
              0.42 + reveal * 0.34,
              0.91 - reveal * 0.26,
            )
            .normalize();
          const pullback = 0.83 + reveal * 0.17;
          camera.position.copy(direction.multiplyScalar(distance * pullback));
          camera.lookAt(0, 0.02, 0);
          try {
            renderer.render(scene, camera);
          } catch {
            fallback();
          }
        }

        function tick(time: number) {
          frame = undefined;
          if (disposed || failed || document.hidden || motion.matches) return;
          const delta =
            previousTime === undefined ? 0 : Math.min(time - previousTime, 100);
          previousTime = time;
          elapsed += delta;
          paint(delta / 1000);
          if (!failed) frame = requestAnimationFrame(tick);
        }

        function synchronize() {
          stop();
          pointerTarget.set(0, 0);
          pointer.set(0, 0);
          if (disposed || failed) return;
          if (document.hidden) {
            setMotionMode("hidden");
            return;
          }
          if (motion.matches) {
            elapsed = Math.max(elapsed, 4000);
            setMotionMode("reduced");
            paint();
            return;
          }
          setMotionMode("running");
          paint();
          frame = requestAnimationFrame(tick);
        }

        function resize() {
          if (!renderer || disposed || failed) return;
          const { width, height } = root.getBoundingClientRect();
          if (!width || !height) return;
          renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          const halfAngle = Math.tan(three.MathUtils.degToRad(camera.fov / 2));
          distance = Math.max(
            5.15 / (2 * halfAngle),
            8.9 / (2 * halfAngle * camera.aspect),
          );
          if (!document.hidden) paint();
        }

        const move = (event: PointerEvent) => {
          if (
            event.pointerType === "touch" ||
            !finePointer.matches ||
            motion.matches ||
            document.hidden
          )
            return;
          const bounds = root.getBoundingClientRect();
          pointerTarget.set(
            three.MathUtils.clamp(
              ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
              -1,
              1,
            ),
            three.MathUtils.clamp(
              ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
              -1,
              1,
            ),
          );
        };
        const resetPointer = () => pointerTarget.set(0, 0);
        root.addEventListener("pointermove", move);
        root.addEventListener("pointerleave", resetPointer);
        root.addEventListener("pointercancel", resetPointer);
        window.addEventListener("blur", resetPointer);
        finePointer.addEventListener("change", resetPointer);
        motion.addEventListener("change", synchronize);
        document.addEventListener("visibilitychange", synchronize);
        detach.push(
          () => root.removeEventListener("pointermove", move),
          () => root.removeEventListener("pointerleave", resetPointer),
          () => root.removeEventListener("pointercancel", resetPointer),
          () => window.removeEventListener("blur", resetPointer),
          () => finePointer.removeEventListener("change", resetPointer),
          () => motion.removeEventListener("change", synchronize),
          () => document.removeEventListener("visibilitychange", synchronize),
        );
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(root);
        resize();
        synchronize();
        if (!failed && !disposed) setRendererMode("webgl");
      } catch {
        release?.();
        if (!disposed) setRendererMode("fallback");
      }
    }

    void initialize(root, canvasHost);
    return () => {
      disposed = true;
      release?.();
    };
  }, [tone]);

  return (
    <div
      ref={rootRef}
      className={[styles.scene, className].filter(Boolean).join(" ")}
      role="img"
      aria-label="A shallow bank of fine green matcha with a gently swept depression, held in a machined metal tray under studio light."
      aria-busy={rendererMode === "loading"}
      data-tone={tone}
      data-renderer={rendererMode}
      data-motion={motionMode}
    >
      <Image
        src="/images/hero/matcha-tray-concept-02.webp"
        alt=""
        fill
        sizes="(max-width: 700px) 100vw, 85vw"
        className={styles.fallback}
        draggable={false}
      />
      <div
        ref={canvasHostRef}
        className={styles.canvasLayer}
        aria-hidden="true"
      />
    </div>
  );
}
