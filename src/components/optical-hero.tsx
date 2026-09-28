"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MatchaInspector } from "./matcha-inspector";
import { ScrambleText } from "./scramble-text";
import { SheetInformation } from "./sheet-information";
import { usePeriodicGlitch } from "./use-periodic-glitch";
import styles from "./optical-hero.module.css";

export function OpticalHero({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [hidden, setHidden] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [entry, setEntry] = useState(0);
  const cycle = usePeriodicGlitch(hovered && !hidden);
  const currentRoute = tone === "light" ? "/concept-06/light" : "/concept-06";

  useEffect(() => {
    const update = () => setHidden(document.hidden);
    const clearHover = () => setHovered(false);
    update();
    document.addEventListener("visibilitychange", update);
    window.addEventListener("blur", clearHover);
    return () => {
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("blur", clearHover);
    };
  }, []);

  return (
    <main
      className={styles.hero}
      data-concept="06"
      data-tone={tone}
      data-hidden={hidden}
    >
      <div className={styles.light} aria-hidden="true" />
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="ATOMA home">
          ATOMA
        </Link>
        <nav className={styles.navigation} aria-label="Main navigation">
          <Link
            href={currentRoute}
            className={styles.current}
            aria-current="page"
          >
            <span aria-hidden="true" className={styles.activeMark} />
            <ScrambleText
              text="MATCHA"
              delay={150}
              interactive
              paused={hidden}
            />
          </Link>
          <SheetInformation tone={tone} />
        </nav>
      </header>

      <div className={styles.composition}>
        <div className={styles.heading}>
          <span className={styles.preTitle} aria-hidden="true">
            <span />
            ATOMA / MATCHA
          </span>
          <h1>
            <span>Carefully</span>
            <span>specified matcha.</span>
          </h1>
        </div>
        <div className={styles.optics} aria-hidden="true">
          <svg viewBox="0 0 1000 700" fill="none">
            <ellipse cx="500" cy="360" rx="455" ry="278" />
            <ellipse
              cx="500"
              cy="360"
              rx="431"
              ry="254"
              strokeDasharray="1 15"
            />
            <path d="M500 49v26M500 645v26M27 360h27M947 360h27" />
            <path
              className={styles.opticArc}
              d="M97 232C165 105 319 75 500 82"
            />
          </svg>
        </div>
        <div className={styles.specimenEntrance}>
          <MatchaInspector className={styles.inspector} tone={tone} />
        </div>
        <div className={styles.marginLabel} aria-hidden="true">
          <span />
          <ScrambleText text="FINE POWDER" delay={1400} paused={hidden} />
        </div>
      </div>

      <footer className={styles.footer}>
        <div
          className={styles.explore}
          onPointerEnter={(event) => {
            if (event.pointerType === "touch") return;
            setHovered(true);
            setEntry((previous) => previous + 1);
          }}
          onPointerLeave={() => setHovered(false)}
          onPointerCancel={() => setHovered(false)}
          data-hovered={hovered}
        >
          <ScrambleText
            key={`${entry}-${cycle}`}
            text="EXPLORE MATCHA"
            delay={entry ? 0 : 1700}
            paused={hidden}
          />
          <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M6 26 26 6M6 6h20v20" />
          </svg>
        </div>
        <span className={styles.footerRule} aria-hidden="true" />
        <nav className={styles.appearance} aria-label="Appearance">
          <Link
            href="/concept-06"
            aria-current={tone === "dark" ? "page" : undefined}
          >
            DARK
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href="/concept-06/light"
            aria-current={tone === "light" ? "page" : undefined}
          >
            LIGHT
          </Link>
        </nav>
      </footer>
    </main>
  );
}
