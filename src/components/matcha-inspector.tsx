"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import styles from "./matcha-inspector.module.css";

const photograph = "/images/hero/matcha-tray-concept-02.webp";
const photographAspect = 1536 / 1024;
const magnification = 2.5;

export function MatchaInspector({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const targetRef = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const instructionsId = useId();

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    const finePointer = window.matchMedia(
      "(any-hover: hover) and (any-pointer: fine)",
    );
    let frame: number | undefined;
    let mouseInside = false;
    let keyboardActive = false;
    let touchActive = false;
    let touchPointer: number | undefined;
    let position = { x: 0.5, y: 0.5 };

    function imageBounds() {
      if (!target) return null;
      const bounds = target.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return null;
      const localWidth = target.clientWidth;
      const localHeight = target.clientHeight;
      const width = Math.min(localWidth, localHeight * photographAspect);
      const height = width / photographAspect;
      return {
        width,
        height,
        left: (localWidth - width) / 2,
        top: (localHeight - height) / 2,
        viewportLeft: bounds.left,
        viewportTop: bounds.top,
        scaleX: localWidth / bounds.width,
        scaleY: localHeight / bounds.height,
      };
    }

    function cancelFrame() {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
    }

    function paint() {
      frame = undefined;
      const image = imageBounds();
      if (!target || !image || document.hidden) return;
      const diameter = Math.max(
        64,
        Math.min(184, image.width * 0.26, image.height * 0.5),
      );
      const sourceX = position.x * image.width;
      const sourceY = position.y * image.height;
      target.style.setProperty("--lens-size", `${diameter}px`);
      target.style.setProperty("--lens-x", `${image.left + sourceX}px`);
      target.style.setProperty("--lens-y", `${image.top + sourceY}px`);
      target.style.setProperty(
        "--sample-width",
        `${image.width * magnification}px`,
      );
      target.style.setProperty(
        "--sample-height",
        `${image.height * magnification}px`,
      );
      // Both images share the same contained-image origin. The point directly
      // under the aperture's center therefore remains unchanged when enlarged.
      target.style.setProperty(
        "--sample-x",
        `${diameter / 2 - sourceX * magnification}px`,
      );
      target.style.setProperty(
        "--sample-y",
        `${diameter / 2 - sourceY * magnification}px`,
      );
    }

    function schedulePaint() {
      if (frame === undefined && !document.hidden) {
        frame = requestAnimationFrame(paint);
      }
    }

    function updateVisibility() {
      setVisible(
        !document.hidden && (mouseInside || keyboardActive || touchActive),
      );
      schedulePaint();
    }

    function positionFromPointer(event: PointerEvent) {
      const image = imageBounds();
      if (!image) return;
      position = {
        x: Math.max(
          0.2,
          Math.min(
            0.8,
            ((event.clientX - image.viewportLeft) * image.scaleX - image.left) /
              image.width,
          ),
        ),
        y: Math.max(
          0.25,
          Math.min(
            0.75,
            ((event.clientY - image.viewportTop) * image.scaleY - image.top) /
              image.height,
          ),
        ),
      };
      schedulePaint();
    }

    function releaseTouch() {
      const pointerId = touchPointer;
      touchPointer = undefined;
      if (pointerId !== undefined && target?.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId);
      }
    }

    function reset() {
      cancelFrame();
      mouseInside = false;
      keyboardActive = false;
      touchActive = false;
      releaseTouch();
      setVisible(false);
    }

    function pointerEnter(event: PointerEvent) {
      if (event.pointerType === "touch" || !finePointer.matches) return;
      mouseInside = true;
      positionFromPointer(event);
      updateVisibility();
    }

    function pointerMove(event: PointerEvent) {
      if (document.hidden) return;
      if (event.pointerType === "touch") {
        if (touchPointer !== event.pointerId) return;
        positionFromPointer(event);
        return;
      }
      if (!finePointer.matches) return;
      mouseInside = true;
      positionFromPointer(event);
      updateVisibility();
    }

    function pointerLeave(event: PointerEvent) {
      if (event.pointerType === "touch") return;
      mouseInside = false;
      updateVisibility();
    }

    function pointerDown(event: PointerEvent) {
      if (event.pointerType !== "touch" || document.hidden) return;
      event.preventDefault();
      releaseTouch();
      touchPointer = event.pointerId;
      touchActive = true;
      keyboardActive = false;
      target?.setPointerCapture(event.pointerId);
      positionFromPointer(event);
      updateVisibility();
    }

    function pointerUp(event: PointerEvent) {
      if (touchPointer !== event.pointerId) return;
      positionFromPointer(event);
      releaseTouch();
    }

    function pointerCancel(event: PointerEvent) {
      if (touchPointer === event.pointerId || event.pointerType !== "touch") {
        reset();
      }
    }

    function lostCapture(event: PointerEvent) {
      if (touchPointer === event.pointerId) reset();
    }

    function focus() {
      if (!target?.matches(":focus-visible")) return;
      keyboardActive = true;
      position = { x: 0.5, y: 0.5 };
      updateVisibility();
    }

    function activate(event: MouseEvent) {
      if (event.detail !== 0) return;
      keyboardActive = true;
      updateVisibility();
    }

    function keyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        reset();
        return;
      }
      const directions: Record<string, [number, number]> = {
        ArrowLeft: [-0.035, 0],
        ArrowRight: [0.035, 0],
        ArrowUp: [0, -0.035],
        ArrowDown: [0, 0.035],
      };
      const direction = directions[event.key];
      if (!direction) return;
      event.preventDefault();
      keyboardActive = true;
      position = {
        x: Math.max(0.2, Math.min(0.8, position.x + direction[0])),
        y: Math.max(0.25, Math.min(0.75, position.y + direction[1])),
      };
      updateVisibility();
    }

    function visibilityChange() {
      if (document.hidden) reset();
    }

    function pointerPreferenceChange() {
      mouseInside = false;
      updateVisibility();
    }

    target.addEventListener("pointerenter", pointerEnter);
    target.addEventListener("pointermove", pointerMove);
    target.addEventListener("pointerleave", pointerLeave);
    target.addEventListener("pointerdown", pointerDown);
    target.addEventListener("pointerup", pointerUp);
    target.addEventListener("pointercancel", pointerCancel);
    target.addEventListener("lostpointercapture", lostCapture);
    target.addEventListener("focus", focus);
    target.addEventListener("blur", reset);
    target.addEventListener("click", activate);
    target.addEventListener("keydown", keyDown);
    document.addEventListener("visibilitychange", visibilityChange);
    window.addEventListener("blur", reset);
    finePointer.addEventListener("change", pointerPreferenceChange);
    const resizeObserver = new ResizeObserver(schedulePaint);
    resizeObserver.observe(target);
    schedulePaint();

    return () => {
      cancelFrame();
      resizeObserver.disconnect();
      target.removeEventListener("pointerenter", pointerEnter);
      target.removeEventListener("pointermove", pointerMove);
      target.removeEventListener("pointerleave", pointerLeave);
      target.removeEventListener("pointerdown", pointerDown);
      target.removeEventListener("pointerup", pointerUp);
      target.removeEventListener("pointercancel", pointerCancel);
      target.removeEventListener("lostpointercapture", lostCapture);
      target.removeEventListener("focus", focus);
      target.removeEventListener("blur", reset);
      target.removeEventListener("click", activate);
      target.removeEventListener("keydown", keyDown);
      document.removeEventListener("visibilitychange", visibilityChange);
      window.removeEventListener("blur", reset);
      finePointer.removeEventListener("change", pointerPreferenceChange);
      releaseTouch();
    };
  }, []);

  return (
    <div
      className={[styles.inspector, className].filter(Boolean).join(" ")}
      data-tone={tone}
    >
      <button
        ref={targetRef}
        className={styles.target}
        type="button"
        aria-label="Inspect matcha texture"
        aria-describedby={instructionsId}
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Escape"
        data-active={visible}
      >
        <Image
          src={photograph}
          alt=""
          fill
          preload
          sizes="(max-width: 700px) 100vw, 80vw"
          className={styles.photograph}
          draggable={false}
        />
        <span className={styles.lens} aria-hidden="true">
          <span className={styles.aperture} />
          <span className={styles.topRegistration} />
          <span className={styles.sideRegistration} />
        </span>
        <span className={styles.hint} aria-hidden="true">
          <span />
          Inspect texture
        </span>
      </button>
      <span id={instructionsId} className={styles.instructions}>
        Fine matcha in a silver tray. Move the pointer over the powder to
        magnify it. With keyboard focus, use the arrow keys to move the lens and
        Escape to hide it. On a touch screen, tap or drag across the powder. Tab
        continues to the next control.
      </span>
    </div>
  );
}
