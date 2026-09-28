"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ScrambleText } from "./scramble-text";
import { HeroCapsuleHeader } from "./hero-capsule-header";
import { SpecimenField } from "./specimen-field";
import { usePeriodicGlitch } from "./use-periodic-glitch";
import styles from "./hybrid-hero.module.css";

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19 19 5M5 5h14v14" />
    </svg>
  );
}

export function HybridHero() {
  const compositionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [labelHovered, setLabelHovered] = useState(false);
  const [labelEntry, setLabelEntry] = useState(0);
  const hoverCycle = usePeriodicGlitch(hovered);
  const labelCycle = usePeriodicGlitch(labelHovered);

  useEffect(() => {
    const composition = compositionRef.current;
    const stage = stageRef.current;
    const cue = cueRef.current;
    if (!composition || !stage || !cue) return;

    const pointerPreference = window.matchMedia(
      "(any-hover: hover) and (any-pointer: fine)",
    );
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let frame: number | undefined;
    let active = false;
    let pointerX = 0;
    let pointerY = 0;

    const cancelFrame = () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
    };

    const reset = () => {
      cancelFrame();
      active = false;
      setHovered(false);
      stage.style.removeProperty("--pointer-x");
      stage.style.removeProperty("--pointer-y");
      composition.style.removeProperty("--field-x");
      composition.style.removeProperty("--field-y");
    };

    const positionCue = () => {
      frame = undefined;
      const bounds = stage.getBoundingClientRect();
      // Keep the entire annotation inside the frame, including at its corners.
      const insetX = Math.min(cue.offsetWidth / 2 + 12, bounds.width / 2);
      const insetY = Math.min(cue.offsetHeight / 2 + 12, bounds.height / 2);
      const x = Math.max(
        insetX,
        Math.min(bounds.width - insetX, pointerX - bounds.left),
      );
      const y = Math.max(
        insetY,
        Math.min(bounds.height - insetY, pointerY - bounds.top),
      );
      stage.style.setProperty("--pointer-x", `${x}px`);
      stage.style.setProperty("--pointer-y", `${y}px`);
      const unitX = Math.max(
        -1,
        Math.min(1, ((pointerX - bounds.left) / bounds.width - 0.5) * 2),
      );
      const unitY = Math.max(
        -1,
        Math.min(1, ((pointerY - bounds.top) / bounds.height - 0.5) * 2),
      );
      composition.style.setProperty("--field-x", `${unitX * 10}px`);
      composition.style.setProperty("--field-y", `${unitY * 6}px`);
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !pointerPreference.matches) return;
      if (!active) {
        active = true;
        setHovered(true);
      }
      if (motionPreference.matches) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame === undefined) frame = requestAnimationFrame(positionCue);
    };

    stage.addEventListener("pointerenter", move);
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerleave", reset);
    stage.addEventListener("pointercancel", reset);
    pointerPreference.addEventListener("change", reset);
    motionPreference.addEventListener("change", reset);
    window.addEventListener("resize", reset);
    window.addEventListener("blur", reset);

    return () => {
      cancelFrame();
      stage.removeEventListener("pointerenter", move);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", reset);
      stage.removeEventListener("pointercancel", reset);
      pointerPreference.removeEventListener("change", reset);
      motionPreference.removeEventListener("change", reset);
      window.removeEventListener("resize", reset);
      window.removeEventListener("blur", reset);
    };
  }, []);

  return (
    <main className={styles.hero} data-concept="04">
      <HeroCapsuleHeader repeatExplore />

      <section
        ref={compositionRef}
        className={styles.composition}
        aria-label="Matcha"
      >
        <div className={styles.fieldWindow}>
          <div className={styles.fieldDepth}>
            <SpecimenField className={styles.field} />
          </div>
        </div>
        <div className={styles.introduction}>
          <div className={styles.category}>
            <span className={styles.statusDot} aria-hidden="true" />
            <ScrambleText text="MATCHA" delay={260} />
          </div>
          <h1 className={styles.heading}>
            <span>Carefully</span>
            <span>specified</span>
            <span>matcha.</span>
          </h1>
          <div
            className={styles.exploreLabel}
            onPointerEnter={(event) => {
              if (event.pointerType !== "touch") {
                setLabelHovered(true);
                setLabelEntry((previous) => previous + 1);
              }
            }}
            onPointerLeave={() => setLabelHovered(false)}
            onPointerCancel={() => setLabelHovered(false)}
          >
            <ScrambleText
              key={`${labelEntry}-${labelCycle}`}
              text="EXPLORE MATCHA"
              delay={labelEntry ? 0 : 380}
            />
            <Arrow />
          </div>
          <div className={styles.introRegistration} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className={styles.viewer}>
          <div className={styles.viewerHeading} aria-hidden="true">
            <span className={styles.ordinal}>
              [ <ScrambleText text="01" delay={420} /> ]
            </span>
            <span className={styles.registrationLine} />
            <ScrambleText text="MATCHA" delay={470} />
          </div>
          <div
            ref={stageRef}
            className={styles.imageStage}
            data-hovered={hovered}
          >
            <div className={styles.tray}>
              <Image
                src="/images/hero/matcha-tray-concept-02.webp"
                alt="An overhead view of fine green matcha in a shallow rectangular metal tray."
                fill
                preload
                sizes="(max-width: 700px) 110vw, 70vw"
                className={styles.trayImage}
                draggable={false}
              />
            </div>
            <div className={styles.frame} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className={styles.exposureLine} aria-hidden="true" />
            <div ref={cueRef} className={styles.exploreCue} aria-hidden="true">
              <span className={styles.targetMark} />
              <span className={styles.targetLeader} />
              <span className={styles.targetLabel}>
                <ScrambleText
                  key={hovered ? `active-${hoverCycle}` : "rest"}
                  text="EXPLORE MATCHA"
                />
                <Arrow />
              </span>
            </div>
          </div>
          <div className={styles.viewerFooter} aria-hidden="true">
            <ScrambleText text="MATCHA POWDER" delay={520} />
            <span className={styles.footerRegistration}>
              <span />
              <span />
              <span />
            </span>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span className={styles.footerMark} aria-hidden="true">
          ATOMA<span> / </span>MATCHA
        </span>
        <span className={styles.footerCross} aria-hidden="true" />
      </footer>
    </main>
  );
}
