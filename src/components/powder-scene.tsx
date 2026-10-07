"use client";

import Image from "next/image";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useEffect, useRef, useState } from "react";
import type { WebGLRenderer } from "three";
import { powderMask } from "@/lib/powder-mask";
import styles from "./powder-scene.module.css";

type PowderValues = {
  selectionIndex: number;
  enterPowder: boolean;
};
type PowderSceneProps = {
  title: string;
  selectionIndex: number;
  entryFromTray?: boolean;
  enterPowder?: boolean;
  tone?: "dark" | "light";
  onReady?: () => void;
};
type SceneEngine = { update: (values: PowderValues) => void };
const POWDER_IMAGES = [
  "/images/matcha/culinary.jpg",
  "/images/matcha/latte.jpg",
  "/images/matcha/tea-service.jpg",
] as const;

/** The selected matcha remains present through every purchase and label step. */
export function PowderScene({
  title,
  selectionIndex,
  entryFromTray = false,
  enterPowder = true,
  tone = "light",
  onReady,
}: PowderSceneProps) {
  const { t } = useStorefrontLocale();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<SceneEngine | null>(null);
  const valuesRef = useRef<PowderValues>({ selectionIndex, enterPowder });
  const entryFromTrayRef = useRef(entryFromTray);
  const readyRef = useRef(onReady);
  const [mode, setMode] = useState<"loading" | "webgl" | "fallback">("loading");
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
    (photographFailed ||
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
    const values = { selectionIndex, enterPowder };
    valuesRef.current = values;
    engineRef.current?.update(values);
  }, [selectionIndex, enterPowder]);

  useEffect(() => {
    const root = rootRef.current;
    const host = canvasHostRef.current;
    if (!root || !host) return;
    let disposed = false;
    let release: (() => void) | undefined;

    async function initialize(root: HTMLDivElement, host: HTMLDivElement) {
      let renderer: WebGLRenderer | undefined;
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
        const contextLost = (event: Event) => {
          event.preventDefault();
          fallback();
        };
        renderer.domElement.addEventListener("webglcontextlost", contextLost);
        detach.push(() =>
          renderer?.domElement.removeEventListener(
            "webglcontextlost",
            contextLost,
          ),
        );

        const scene = new three.Scene();
        const camera = new three.OrthographicCamera(-2, 2, 2, -2, 0.1, 30);
        camera.position.set(0, 0, 8);
        camera.lookAt(0, 0, 0);
        const powderMorph = await createPowderMorph({
          imageUrls: POWDER_IMAGES,
          entryImageUrl: entryFromTrayRef.current
            ? "/images/hero/matcha-tray-concept-02.webp"
            : undefined,
          reducedMotion: motion.matches,
          duration: 1.1,
          entryDuration: 0.8,
        });
        if (disposed || failed || released) {
          powderMorph.dispose();
          return;
        }
        disposeResources.push(() => powderMorph.dispose());
        scene.add(powderMorph.object3d);
        let values = valuesRef.current;
        let viewportAspect = 1;
        let sceneTime = 0;
        let notifiedReady = false;
        powderMorph.update(values.selectionIndex, "powder");
        if (values.enterPowder) powderMorph.beginEntry();

        function render(delta: number, immediate: boolean) {
          if (!renderer || disposed || failed) return false;
          sceneTime += delta;
          const frustum = Math.max(3.65, 2.2 / viewportAspect);
          // The held tray pigment occupies exactly the same contained photo
          // frame as the DOM tray; quantity and labels never move this camera.
          if (entryFromTrayRef.current && !values.enterPowder)
            powderMorph.setEntryFrame(frustum * viewportAspect, frustum);
          const moving = powderMorph.tick(sceneTime, immediate);
          camera.left = (-frustum * viewportAspect) / 2;
          camera.right = (frustum * viewportAspect) / 2;
          camera.top = frustum / 2;
          camera.bottom = -frustum / 2;
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
          return moving;
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
          // Camera and backing buffer use layout dimensions. A rotated ancestor
          // changes the visual bounding box without changing the canvas layout.
          const width = root.clientWidth;
          const height = root.clientHeight;
          if (!width || !height) return;
          viewportAspect = width / height;
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
            if (values.selectionIndex !== next.selectionIndex)
              powderMorph.setSelection(next.selectionIndex);
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
      data-stage="powder"
      data-material="matcha"
      data-tone={tone}
      data-photograph-failed={photographFailed}
      role="img"
      aria-label={t("{name} powder, formed from its material photograph.", {
        name: title || t("Matcha"),
      })}
      aria-busy={mode === "loading" || (mode === "fallback" && !fallbackReady)}
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
      {mode === "fallback" && photographFailed && (
        <p className={styles.unavailable} aria-hidden="true">
          {title || t("Matcha")}
          <span>{t("Matcha powder")}</span>
        </p>
      )}
      <div
        ref={canvasHostRef}
        className={styles.canvasLayer}
        aria-hidden="true"
      />
    </div>
  );
}
