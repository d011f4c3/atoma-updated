"use client";

import Link from "next/link";
import { useState } from "react";
import { ScrambleText } from "./scramble-text";
import { usePeriodicGlitch } from "./use-periodic-glitch";
import styles from "./hero-capsule-header.module.css";

export function HeroCapsuleHeader({
  repeatExplore = false,
}: {
  repeatExplore?: boolean;
}) {
  const [replay, setReplay] = useState({ matcha: 0, explore: 0 });
  const [exploreHovered, setExploreHovered] = useState(false);
  const cycle = usePeriodicGlitch(repeatExplore && exploreHovered);

  return (
    <header className={styles.header}>
      <Link className={styles.brand} href="/" aria-label="ATOMA home">
        ATOMA
      </Link>
      <span
        className={styles.sectionLabel}
        onPointerEnter={() =>
          setReplay((previous) => ({
            ...previous,
            matcha: previous.matcha + 1,
          }))
        }
      >
        <span aria-hidden="true">
          <ScrambleText key={replay.matcha} text="01" delay={160} />
        </span>
        <ScrambleText key={replay.matcha} text="MATCHA" delay={220} />
      </span>
      <span
        className={styles.explore}
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") setExploreHovered(true);
          setReplay((previous) => ({
            ...previous,
            explore: previous.explore + 1,
          }));
        }}
        onPointerLeave={() => setExploreHovered(false)}
        onPointerCancel={() => setExploreHovered(false)}
      >
        <ScrambleText
          key={`${replay.explore}-${cycle}`}
          text="EXPLORE"
          delay={replay.explore ? 0 : 300}
        />
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 19 19 5M5 5h14v14" />
        </svg>
      </span>
    </header>
  );
}
