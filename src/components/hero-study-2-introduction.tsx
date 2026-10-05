"use client";

import type { RefObject } from "react";
import { HeroStudyIntroduction } from "./hero-study-introduction";
import { ScrambleText } from "./scramble-text";
import heroStyles from "./specimen-hero.module.css";
import baselineStyles from "./hero-study-introduction.module.css";
import styles from "./hero-study-2-introduction.module.css";

export type HeroStudy2Direction = "current" | "display" | "cadence" | "proof";

export function HeroStudy2Introduction({
  direction,
  exploring,
  onExplore,
  exploreRef,
}: {
  direction: HeroStudy2Direction;
  exploring: boolean;
  onExplore: () => void;
  exploreRef: RefObject<HTMLButtonElement | null>;
}) {
  if (direction === "current") {
    return (
      <div
        className={styles.root}
        data-hero-introduction-2
        data-direction={direction}
      >
        <HeroStudyIntroduction
          direction="specimen"
          exploring={exploring}
          onExplore={onExplore}
          exploreRef={exploreRef}
        />
      </div>
    );
  }

  return (
    <div
      className={styles.root}
      data-hero-introduction-2
      data-direction={direction}
    >
      <div className={heroStyles.category}>
        <span className={heroStyles.statusDot} aria-hidden="true" />
        <ScrambleText text="MATCHA" delay={260} periodic />
      </div>
      <div className={styles.group}>
        {/* Reuse the adopted Specimen text row's responsive height so the
            mobile bag retains its homepage position across directions. */}
        <div
          className={`${heroStyles.introStatement} ${baselineStyles.statement} ${styles.statement}`}
        >
          <div key={direction} className={styles.copy}>
            <h1 className={styles.heading}>
              {direction === "proof" ? (
                <>
                  <span>A closer look</span> <span>at matcha.</span>
                </>
              ) : (
                <>
                  <span>A closer</span> <span>look at</span>{" "}
                  <span>matcha.</span>
                </>
              )}
            </h1>
            <div className={styles.supporting}>
              <p className={styles.attributes}>
                <span>Flavour.</span> <span>Texture.</span>{" "}
                <span>Performance.</span>
              </p>
              <p className={styles.application}>
                Matcha selected for a specific application.
              </p>
            </div>
          </div>
        </div>
        <button
          ref={exploreRef}
          type="button"
          className={`${heroStyles.exploreLabel} ${styles.action}`}
          data-brand-part="explore-action"
          aria-expanded={exploring}
          aria-controls="home-selection"
          onClick={onExplore}
        >
          <ScrambleText text="EXPLORE MATCHA" interactive />
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 19 19 5M5 5h14v14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
