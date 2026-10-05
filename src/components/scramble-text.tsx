"use client";

import { useEffect, useRef } from "react";
import { createPeriodicTextScheduler } from "@/lib/periodic-text-scheduler";
import styles from "./scramble-text.module.css";

type ScrambleTextProps = {
  text: string;
  paused?: boolean;
  delay?: number;
  interactive?: boolean;
  wrap?: boolean;
  periodic?: boolean;
  connected?: boolean;
  animateOnMount?: boolean;
  visibleOnly?: boolean;
};

const duration = 500;
const tapDuration = 950;
const tapMovementThreshold = 10;
const frameInterval = 40;
const glyphPattern = /^[a-z0-9]$/i;

let ambientScheduler:
  ReturnType<typeof createPeriodicTextScheduler> | undefined;
let ambientUsers = 0;
let stopAmbientListeners: (() => void) | undefined;

function registerAmbientPassage(canPlay: () => boolean, play: () => void) {
  if (!ambientScheduler) {
    const scheduler = createPeriodicTextScheduler();
    ambientScheduler = scheduler;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const synchronize = () =>
      scheduler.setEnabled(!preference.matches && !document.hidden);
    synchronize();
    preference.addEventListener("change", synchronize);
    document.addEventListener("visibilitychange", synchronize);
    stopAmbientListeners = () => {
      preference.removeEventListener("change", synchronize);
      document.removeEventListener("visibilitychange", synchronize);
    };
  }
  ambientUsers += 1;
  const remove = ambientScheduler.add({ canPlay, play });
  return () => {
    remove();
    ambientUsers -= 1;
    if (ambientUsers === 0) {
      stopAmbientListeners?.();
      stopAmbientListeners = undefined;
      ambientScheduler = undefined;
    }
  };
}

function randomGlyph(character: string) {
  const alphabet = /\d/.test(character)
    ? "0123456789"
    : character === character.toUpperCase()
      ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
      : "abcdefghijklmnopqrstuvwxyz";

  return alphabet.charAt(Math.floor(Math.random() * alphabet.length));
}

function randomizeText(text: string) {
  return Array.from(text)
    .map((character) =>
      glyphPattern.test(character) ? randomGlyph(character) : character,
    )
    .join("");
}

function renderCharacters(text: string, connected: boolean) {
  return (connected ? [text] : Array.from(text)).map((character, index) =>
    connected || glyphPattern.test(character) ? (
      <span className={styles.slot} key={`${index}-${character}`}>
        <span className={styles.measure}>{character}</span>
        <span className={styles.glyph} data-scramble-glyph>
          {character}
        </span>
      </span>
    ) : (
      character
    ),
  );
}

export function ScrambleText({
  text,
  paused = false,
  delay = 0,
  interactive = false,
  wrap = false,
  periodic = false,
  connected = false,
  animateOnMount = true,
  visibleOnly = false,
}: ScrambleTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const glyphs = Array.from(
      root.querySelectorAll<HTMLSpanElement>("[data-scramble-glyph]"),
    );
    const characters = connected
      ? wrap
        ? text.split(/\s+/u).filter(Boolean)
        : [text]
      : Array.from(text).filter((character) => glyphPattern.test(character));
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const mobile = window.matchMedia("(max-width: 760px)");
    // The entire native control owns the interaction, including the padding
    // around a label and the radio input that receives its keyboard focus.
    const target = interactive
      ? root.closest<HTMLElement>("button, a[href], label, summary")
      : null;
    let animationFrame: number | undefined;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    let repeatTimer: ReturnType<typeof setInterval> | undefined;
    let running = false;
    let hovered = false;
    let tapRunning = false;
    let suppressPointerFocusUntil = 0;
    let tapGesture:
      { pointerId: number; x: number; y: number; moved: boolean } | undefined;

    function isVisible() {
      if (!root || root.closest("[inert], [hidden], dialog:not([open])"))
        return false;
      const disclosure = root.closest("details:not([open])");
      if (disclosure && !root.closest("summary")) return false;
      const modal = Array.from(document.querySelectorAll("dialog:modal")).at(
        -1,
      );
      if (modal && !modal.contains(root)) return false;
      if (
        !root.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
      )
        return false;
      return Array.from(root.getClientRects()).some(
        (rect) =>
          rect.width > 0 &&
          rect.height > 0 &&
          rect.bottom > 0 &&
          rect.top < window.innerHeight &&
          rect.right > 0 &&
          rect.left < window.innerWidth,
      );
    }

    function cancel() {
      if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
      if (delayTimer !== undefined) clearTimeout(delayTimer);
      animationFrame = undefined;
      delayTimer = undefined;
      running = false;
      tapRunning = false;
    }

    function restoreGlyphs() {
      glyphs.forEach((glyph, index) => {
        glyph.textContent = characters[index] ?? "";
      });
    }

    function settle() {
      cancel();
      restoreGlyphs();
    }

    function canAnimate() {
      return (
        !paused &&
        !motionPreference.matches &&
        !document.hidden &&
        !root?.closest("[inert], [hidden], [aria-disabled='true']") &&
        !target?.matches(":disabled") &&
        !(
          target instanceof HTMLLabelElement &&
          target.control?.matches(":disabled, [aria-disabled='true']")
        ) &&
        (!(periodic || interactive || visibleOnly) || isVisible())
      );
    }

    function start(wait = 0, tapped = false) {
      if (!canAnimate() || running || !glyphs.length) return;
      running = true;
      tapRunning = tapped;
      const playbackDuration =
        tapped || mobile.matches ? tapDuration : duration;

      function animate() {
        delayTimer = undefined;
        if (!canAnimate()) {
          settle();
          return;
        }
        const startedAt = performance.now();
        let previousTick = -1;
        glyphs.forEach((glyph, index) => {
          glyph.textContent = randomizeText(characters[index] ?? "");
        });

        function frame(now: number) {
          const progress = Math.min((now - startedAt) / playbackDuration, 1);
          if (progress >= 1 || !canAnimate()) {
            settle();
            return;
          }

          const tick = Math.floor((now - startedAt) / frameInterval);
          if (tick !== previousTick) {
            previousTick = tick;
            const eased = -(Math.cos(Math.PI * progress) - 1) / 2;
            const resolved = Math.floor(eased * glyphs.length);
            glyphs.slice(0, resolved).forEach((glyph, index) => {
              glyph.textContent = characters[index] ?? "";
            });

            // Only two unsettled glyphs change per tick, keeping the effect quiet.
            const remaining = glyphs.length - resolved;
            for (let offset = 0; offset < Math.min(2, remaining); offset += 1) {
              const index = resolved + ((tick * 2 + offset) % remaining);
              const glyph = glyphs[index];
              if (glyph)
                glyph.textContent = randomizeText(characters[index] ?? "");
            }
          }

          animationFrame = requestAnimationFrame(frame);
        }

        animationFrame = requestAnimationFrame(frame);
      }

      if (wait > 0) delayTimer = setTimeout(animate, wait);
      else animate();
    }

    function replay() {
      // An entry delay must never swallow an intentional hover or focus.
      if (delayTimer !== undefined) settle();
      start();
    }

    function synchronize() {
      if (repeatTimer !== undefined) clearInterval(repeatTimer);
      repeatTimer = undefined;
      if (!canAnimate()) {
        tapGesture = undefined;
        settle();
        return;
      }
      if (!hovered) {
        if (!tapRunning) settle();
        return;
      }
      replay();
      repeatTimer = setInterval(replay, 2800);
    }

    function onPointerEnter(event: PointerEvent) {
      if (event.pointerType === "touch" || event.pointerType === "pen") return;
      hovered = true;
      synchronize();
    }

    function onPointerLeave() {
      hovered = false;
      synchronize();
    }

    function onFocus() {
      // Keyboard entry resolves once; dialog autofocus must not keep moving
      // while someone reads. Ambient copy is coordinated separately.
      if (!tapGesture && performance.now() >= suppressPointerFocusUntil)
        replay();
    }

    function onBlur(event: FocusEvent) {
      const staysWithinControl =
        event.relatedTarget instanceof Node &&
        Boolean(target?.contains(event.relatedTarget));
      if (!staysWithinControl && !hovered && !tapRunning) settle();
    }

    function onPointerDown(event: PointerEvent) {
      if (
        (event.pointerType !== "touch" && event.pointerType !== "pen") ||
        !event.isPrimary ||
        event.button !== 0
      )
        return;
      tapGesture = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        moved: false,
      };
      suppressPointerFocusUntil = performance.now() + tapDuration;
      hovered = false;
      settle();
      synchronize();
    }

    function onPointerMove(event: PointerEvent) {
      if (!tapGesture || event.pointerId !== tapGesture.pointerId) return;
      if (
        Math.hypot(event.clientX - tapGesture.x, event.clientY - tapGesture.y) >
        tapMovementThreshold
      )
        tapGesture.moved = true;
    }

    function onPointerUp(event: PointerEvent) {
      if (!tapGesture || event.pointerId !== tapGesture.pointerId) return;
      onPointerMove(event);
      const tapped = !tapGesture.moved;
      tapGesture = undefined;
      suppressPointerFocusUntil = performance.now() + tapDuration;
      if (
        tapped &&
        target?.contains(
          document.elementFromPoint(event.clientX, event.clientY),
        )
      ) {
        settle();
        start(0, true);
      }
    }

    function onPointerCancel(event: PointerEvent) {
      if (event.pointerId === tapGesture?.pointerId) tapGesture = undefined;
      if (event.pointerType !== "touch" && event.pointerType !== "pen")
        onPointerLeave();
    }

    settle();
    // Supporting copy enters settled; the coordinator gives it a turn instead
    // of scrambling every paragraph together when a panel opens.
    if (animateOnMount && !periodic) start(Math.max(0, delay));
    const stopAmbient = periodic
      ? registerAmbientPassage(
          () =>
            !paused &&
            !running &&
            !hovered &&
            !motionPreference.matches &&
            !document.hidden &&
            !target?.matches(":disabled, :focus-within") &&
            isVisible(),
          () => start(),
        )
      : undefined;
    target?.addEventListener("pointerenter", onPointerEnter);
    target?.addEventListener("pointerleave", onPointerLeave);
    target?.addEventListener("pointerdown", onPointerDown);
    target?.addEventListener("focusin", onFocus);
    target?.addEventListener("focusout", onBlur);
    if (target) {
      document.addEventListener("pointermove", onPointerMove, {
        passive: true,
      });
      document.addEventListener("pointerup", onPointerUp);
      document.addEventListener("pointercancel", onPointerCancel);
    }
    motionPreference.addEventListener("change", synchronize);
    document.addEventListener("visibilitychange", synchronize);

    return () => {
      stopAmbient?.();
      cancel();
      if (repeatTimer !== undefined) clearInterval(repeatTimer);
      target?.removeEventListener("pointerenter", onPointerEnter);
      target?.removeEventListener("pointerleave", onPointerLeave);
      target?.removeEventListener("pointerdown", onPointerDown);
      target?.removeEventListener("focusin", onFocus);
      target?.removeEventListener("focusout", onBlur);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerCancel);
      motionPreference.removeEventListener("change", synchronize);
      document.removeEventListener("visibilitychange", synchronize);
    };
  }, [
    text,
    paused,
    delay,
    interactive,
    wrap,
    periodic,
    connected,
    animateOnMount,
    visibleOnly,
  ]);

  return (
    <span
      className={styles.root}
      ref={rootRef}
      data-wrap={wrap || undefined}
      data-periodic={periodic || undefined}
      data-connected={connected || undefined}
    >
      <span className={styles.accessible}>{text}</span>
      <span className={styles.visual} aria-hidden="true">
        {wrap
          ? text.split(/(\s+)/u).map((word, index) =>
              !word || /^\s+$/u.test(word) ? (
                word
              ) : (
                <span className={styles.word} key={`${index}-${word}`}>
                  {renderCharacters(word, connected)}
                </span>
              ),
            )
          : renderCharacters(text, connected)}
      </span>
    </span>
  );
}
