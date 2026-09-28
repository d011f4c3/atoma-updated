"use client";

import { useEffect, useRef } from "react";
import styles from "./scramble-text.module.css";

type ScrambleTextProps = {
  text: string;
  paused?: boolean;
  delay?: number;
  interactive?: boolean;
};

const duration = 500;
const frameInterval = 40;
const glyphPattern = /^[a-z0-9]$/i;

function randomGlyph(character: string) {
  const alphabet = /\d/.test(character)
    ? "0123456789"
    : character === character.toUpperCase()
      ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
      : "abcdefghijklmnopqrstuvwxyz";

  return alphabet.charAt(Math.floor(Math.random() * alphabet.length));
}

export function ScrambleText({
  text,
  paused = false,
  delay = 0,
  interactive = false,
}: ScrambleTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const glyphs = Array.from(
      root.querySelectorAll<HTMLSpanElement>("[data-scramble-glyph]"),
    );
    const characters = Array.from(text).filter((character) =>
      glyphPattern.test(character),
    );
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const target = interactive ? root.closest("button, a[href]") : null;
    let animationFrame: number | undefined;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    let running = false;

    function cancel() {
      if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
      if (delayTimer !== undefined) clearTimeout(delayTimer);
      animationFrame = undefined;
      delayTimer = undefined;
      running = false;
    }

    function settle() {
      cancel();
      glyphs.forEach((glyph, index) => {
        glyph.textContent = characters[index] ?? "";
      });
    }

    function start(wait = 0) {
      if (paused || motionPreference.matches || running || !glyphs.length)
        return;
      running = true;

      function animate() {
        delayTimer = undefined;
        const startedAt = performance.now();
        let previousTick = -1;
        glyphs.forEach((glyph, index) => {
          glyph.textContent = randomGlyph(characters[index] ?? "");
        });

        function frame(now: number) {
          const progress = Math.min((now - startedAt) / duration, 1);
          if (progress >= 1) {
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
                glyph.textContent = randomGlyph(characters[index] ?? "");
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
      start();
    }

    function onMotionPreferenceChange() {
      if (motionPreference.matches) settle();
    }

    settle();
    start(Math.max(0, delay));
    target?.addEventListener("pointerenter", replay);
    target?.addEventListener("focus", replay);
    motionPreference.addEventListener("change", onMotionPreferenceChange);

    return () => {
      cancel();
      target?.removeEventListener("pointerenter", replay);
      target?.removeEventListener("focus", replay);
      motionPreference.removeEventListener("change", onMotionPreferenceChange);
    };
  }, [text, paused, delay, interactive]);

  return (
    <span className={styles.root} ref={rootRef}>
      <span className={styles.accessible}>{text}</span>
      <span className={styles.visual} aria-hidden="true">
        {Array.from(text).map((character, index) =>
          glyphPattern.test(character) ? (
            <span className={styles.slot} key={`${index}-${character}`}>
              <span className={styles.measure}>{character}</span>
              <span className={styles.glyph} data-scramble-glyph>
                {character}
              </span>
            </span>
          ) : (
            character
          ),
        )}
      </span>
    </span>
  );
}
