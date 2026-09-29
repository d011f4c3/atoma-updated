"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ScrambleText } from "./scramble-text";
import { HeroCapsuleHeader } from "./hero-capsule-header";
import { SpecimenField } from "./specimen-field";
import styles from "./chamber-hero.module.css";

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19 19 5M5 5h14v14" />
    </svg>
  );
}

export function ChamberHero({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const scene = sceneRef.current;
    const subject = subjectRef.current;
    const cue = cueRef.current;
    if (!scene || !subject || !cue) return;

    const finePointer = window.matchMedia(
      "(any-hover: hover) and (any-pointer: fine)",
    );
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame: number | undefined;
    let active = false;
    let x = 0;
    let y = 0;

    const cancel = () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
    };
    const reset = () => {
      cancel();
      active = false;
      setHovered(false);
      scene.style.removeProperty("--field-x");
      scene.style.removeProperty("--field-y");
      subject.style.removeProperty("--cue-x");
      subject.style.removeProperty("--cue-y");
    };
    const position = () => {
      frame = undefined;
      const bounds = scene.getBoundingClientRect();
      const object = subject.getBoundingClientRect();
      const inside =
        x >= object.left &&
        x <= object.right &&
        y >= object.top &&
        y <= object.bottom;
      if (active !== inside) {
        active = inside;
        setHovered(inside);
      }
      if (reducedMotion.matches) return;

      const unitX = Math.max(
        -1,
        Math.min(1, ((x - bounds.left) / bounds.width - 0.5) * 2),
      );
      const unitY = Math.max(
        -1,
        Math.min(1, ((y - bounds.top) / bounds.height - 0.5) * 2),
      );
      scene.style.setProperty("--field-x", `${unitX * 12}px`);
      scene.style.setProperty("--field-y", `${unitY * 7}px`);
      const insetX = Math.min(cue.offsetWidth / 2 + 16, object.width / 2);
      const insetY = Math.min(cue.offsetHeight / 2 + 16, object.height / 2);
      subject.style.setProperty(
        "--cue-x",
        `${Math.max(insetX, Math.min(object.width - insetX, x - object.left))}px`,
      );
      subject.style.setProperty(
        "--cue-y",
        `${Math.max(insetY, Math.min(object.height - insetY, y - object.top))}px`,
      );
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !finePointer.matches) return;
      x = event.clientX;
      y = event.clientY;
      if (frame === undefined) frame = requestAnimationFrame(position);
    };

    scene.addEventListener("pointermove", move);
    scene.addEventListener("pointerenter", move);
    scene.addEventListener("pointerleave", reset);
    scene.addEventListener("pointercancel", reset);
    finePointer.addEventListener("change", reset);
    reducedMotion.addEventListener("change", reset);
    window.addEventListener("resize", reset);
    window.addEventListener("blur", reset);
    return () => {
      cancel();
      scene.removeEventListener("pointermove", move);
      scene.removeEventListener("pointerenter", move);
      scene.removeEventListener("pointerleave", reset);
      scene.removeEventListener("pointercancel", reset);
      finePointer.removeEventListener("change", reset);
      reducedMotion.removeEventListener("change", reset);
      window.removeEventListener("resize", reset);
      window.removeEventListener("blur", reset);
    };
  }, []);

  return (
    <main className={styles.hero} data-concept="03" data-tone={tone}>
      <HeroCapsuleHeader tone={tone} />

      <div ref={sceneRef} className={styles.scene} data-hovered={hovered}>
        <div className={styles.fieldWindow}>
          <div className={styles.fieldDepth}>
            <SpecimenField className={styles.field} />
          </div>
        </div>
        <div className={styles.sceneCaption} aria-hidden="true">
          <span className={styles.smallCross} />
          <ScrambleText text="MATCHA POWDER" delay={500} />
        </div>
        <div className={styles.sceneOrdinal} aria-hidden="true">
          [ <ScrambleText text="01" delay={570} /> ]
        </div>
        <div ref={subjectRef} className={styles.subject}>
          <div className={styles.plate}>
            <Image
              src="/images/hero/matcha-tray-concept-02.webp"
              alt="Fine green matcha presented in a shallow metal tray."
              fill
              preload
              sizes="(max-width: 700px) 115vw, 95vw"
              draggable={false}
              className={styles.trayImage}
            />
          </div>
          <div ref={cueRef} className={styles.exploreCue} aria-hidden="true">
            <span className={styles.reticle} />
            <span className={styles.cueLeader} />
            <span className={styles.cueLabel}>
              <ScrambleText
                key={hovered ? "active" : "rest"}
                text="EXPLORE MATCHA"
              />
              <Arrow />
            </span>
          </div>
        </div>
        <div className={styles.sceneBaseline} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>

      <section className={styles.content} aria-label="Matcha">
        <h1 className={styles.heading}>
          <span>Carefully specified</span>
          <span>matcha.</span>
        </h1>
        {/* Intentionally unlinked until the exploration destination is designed. */}
        <div className={styles.exploreLabel}>
          <span className={styles.exploreNumber} aria-hidden="true">
            <ScrambleText text="01" delay={650} />
          </span>
          <ScrambleText text="EXPLORE MATCHA" delay={720} />
          <Arrow />
        </div>
      </section>
      <footer className={styles.footer}>
        <span aria-hidden="true">
          ATOMA<span className={styles.slash}>/</span>MATCHA
        </span>
        <span className={styles.smallCross} aria-hidden="true" />
      </footer>
    </main>
  );
}
