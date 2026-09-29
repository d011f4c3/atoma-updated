"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ScrambleText } from "./scramble-text";
import { SpecimenField } from "./specimen-field";
import { usePeriodicGlitch } from "./use-periodic-glitch";
import styles from "./orbital-hero.module.css";

type View = "overview" | "texture";

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19 19 5M5 5h14v14" />
    </svg>
  );
}

function ViewIcon({ view }: { view: View }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {view === "overview" ? (
        <>
          <rect x="6" y="10" width="20" height="12" rx="3" />
          <path d="M9 13h14M9 19h14" opacity="0.5" />
        </>
      ) : (
        <>
          <circle cx="16" cy="16" r="8" />
          <path d="M16 4v5m0 14v5M4 16h5m14 0h5" />
          <circle cx="16" cy="16" r="1.5" />
        </>
      )}
    </svg>
  );
}

export function OrbitalHero({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const stageId = useId();
  const [view, setView] = useState<View>("overview");
  const [hidden, setHidden] = useState(false);
  const [exploreHovered, setExploreHovered] = useState(false);
  const [exploreEntry, setExploreEntry] = useState(0);
  const cycle = usePeriodicGlitch(exploreHovered && !hidden);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia(
      "(any-hover: hover) and (any-pointer: fine)",
    );
    let frame: number | undefined;
    let x = 0;
    let y = 0;

    const reset = () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      stage.style.removeProperty("--drift-x");
      stage.style.removeProperty("--drift-y");
    };
    const paint = () => {
      frame = undefined;
      if (document.hidden || reduced.matches || !pointer.matches) return;
      const bounds = stage.getBoundingClientRect();
      const horizontal = Math.max(
        -1,
        Math.min(1, ((x - bounds.left) / bounds.width) * 2 - 1),
      );
      const vertical = Math.max(
        -1,
        Math.min(1, ((y - bounds.top) / bounds.height) * 2 - 1),
      );
      stage.style.setProperty("--drift-x", `${horizontal * 7}px`);
      stage.style.setProperty("--drift-y", `${vertical * 4}px`);
    };
    const move = (event: PointerEvent) => {
      if (
        event.pointerType === "touch" ||
        reduced.matches ||
        !pointer.matches ||
        document.hidden
      )
        return;
      x = event.clientX;
      y = event.clientY;
      if (frame === undefined) frame = requestAnimationFrame(paint);
    };
    const visibility = () => {
      setHidden(document.hidden);
      if (document.hidden) {
        reset();
        setExploreHovered(false);
      }
    };
    const blur = () => {
      reset();
      setExploreHovered(false);
    };

    visibility();
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerleave", reset);
    stage.addEventListener("pointercancel", reset);
    reduced.addEventListener("change", reset);
    pointer.addEventListener("change", reset);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blur);
    window.addEventListener("resize", reset);
    return () => {
      reset();
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerleave", reset);
      stage.removeEventListener("pointercancel", reset);
      reduced.removeEventListener("change", reset);
      pointer.removeEventListener("change", reset);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", blur);
      window.removeEventListener("resize", reset);
    };
  }, []);

  return (
    <main
      className={styles.hero}
      data-concept="06"
      data-tone={tone}
      data-view={view}
      data-hidden={hidden}
      onKeyDown={(event) => {
        if (event.key === "Escape" && view === "texture") setView("overview");
      }}
    >
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="ATOMA home">
          ATOMA
        </Link>
        <span className={styles.current}>
          <span className={styles.currentDot} aria-hidden="true" />
          <ScrambleText text="MATCHA" delay={200} interactive paused={hidden} />
        </span>
        <nav className={styles.themes} aria-label="Color theme">
          <Link
            href="/concept-06"
            aria-label="Dark theme"
            aria-current={tone === "dark" ? "page" : undefined}
            title="Dark theme"
          >
            <span className={styles.darkSwatch} aria-hidden="true" />
          </Link>
          <Link
            href="/concept-06/light"
            aria-label="Light theme"
            aria-current={tone === "light" ? "page" : undefined}
            title="Light theme"
          >
            <span className={styles.lightSwatch} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <div ref={stageRef} className={styles.stage} id={stageId}>
        <div className={styles.sceneLabel}>
          <span className={styles.labelDot} aria-hidden="true" />
          <ScrambleText text="MATCHA POWDER" delay={700} paused={hidden} />
        </div>
        <div className={styles.fieldWindow} aria-hidden="true">
          <div className={styles.fieldDepth}>
            <SpecimenField className={styles.field} />
          </div>
        </div>
        <div className={styles.orbit} aria-hidden="true">
          <svg viewBox="0 0 1200 640" fill="none" preserveAspectRatio="none">
            <ellipse cx="600" cy="320" rx="553" ry="284" />
            <ellipse
              className={styles.innerOrbit}
              cx="600"
              cy="320"
              rx="528"
              ry="265"
            />
            <ellipse
              className={styles.tracingOrbit}
              cx="600"
              cy="320"
              rx="553"
              ry="284"
              pathLength="100"
            />
          </svg>
        </div>
        <div className={styles.visualEntrance}>
          <div
            className={styles.visual}
            role="img"
            aria-label={
              view === "overview"
                ? "Fine green matcha presented in a shallow silver tray."
                : "A close view of the fine matcha powder in the same tray."
            }
          >
            <div className={styles.plate}>
              <Image
                src="/images/hero/matcha-tray-concept-02.webp"
                alt=""
                fill
                preload
                sizes="(max-width: 700px) 115vw, 85vw"
                draggable={false}
                className={styles.photograph}
              />
            </div>
            <div className={styles.texture} aria-hidden="true">
              <div className={styles.texturePhoto} />
              <span className={styles.textureMark} />
            </div>
          </div>
        </div>

        <div
          className={styles.viewControls}
          role="group"
          aria-label="Matcha view"
        >
          {(["overview", "texture"] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={styles.viewButton}
              aria-pressed={view === option}
              aria-controls={stageId}
              onClick={() => setView(option)}
            >
              <span className={styles.viewCircle}>
                <ViewIcon view={option} />
              </span>
              <span>
                <ScrambleText
                  text={option.toUpperCase()}
                  interactive
                  paused={hidden}
                />
              </span>
            </button>
          ))}
        </div>
      </div>

      <footer className={styles.footer}>
        <h1 className={styles.heading}>
          <span>Carefully specified</span>
          <span>matcha.</span>
        </h1>
        {/* Shop entry remains unlinked while only the hero is being explored. */}
        <div
          className={styles.explore}
          onPointerEnter={(event) => {
            if (event.pointerType === "touch") return;
            setExploreEntry((entry) => entry + 1);
            setExploreHovered(true);
          }}
          onPointerLeave={() => setExploreHovered(false)}
          onPointerCancel={() => setExploreHovered(false)}
        >
          <ScrambleText
            key={`${exploreEntry}-${cycle}`}
            text="EXPLORE MATCHA"
            delay={exploreEntry ? 0 : 1000}
            paused={hidden}
          />
          <span className={styles.exploreArrow}>
            <Arrow />
          </span>
        </div>
      </footer>
    </main>
  );
}
