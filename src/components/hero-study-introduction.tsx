"use client";

import type { RefObject } from "react";
import { ScrambleText } from "./scramble-text";
import { usePeriodicGlitch } from "./use-periodic-glitch";
import {
  HeroIntroductionRevisions,
  type HeroRevisionDirection,
} from "./hero-introduction-revisions";
import styles from "./hero-study-introduction.module.css";

export type HeroIntroductionDirection =
  "specimen" | "margin" | "register" | HeroRevisionDirection;

type HeroStudyIntroductionProps = {
  direction: HeroIntroductionDirection;
  exploring: boolean;
  onExplore: () => void;
  exploreRef: RefObject<HTMLButtonElement | null>;
};

const attributes = ["Flavour.", "Texture.", "Performance."];

export function HeroStudyIntroduction({
  direction,
  exploring,
  onExplore,
  exploreRef,
}: HeroStudyIntroductionProps) {
  const heroGlitchCycle = usePeriodicGlitch(
    direction === "specimen" && !exploring,
  );
  if (
    direction !== "specimen" &&
    direction !== "margin" &&
    direction !== "register"
  ) {
    return (
      <HeroIntroductionRevisions
        direction={direction}
        exploring={exploring}
        onExplore={onExplore}
        exploreRef={exploreRef}
      />
    );
  }
  return (
    <div
      className={styles.root}
      data-direction={direction}
      data-exploring={exploring}
    >
      <p className={styles.eyebrow}>
        <span aria-hidden="true" />
        MATCHA
      </p>

      <div className={styles.statement}>
        <h1 className={styles.heading}>
          {direction === "specimen" ? (
            <>
              <span>
                <ScrambleText
                  text="A closer look"
                  key={heroGlitchCycle}
                  visibleOnly
                  paused={exploring}
                />
              </span>{" "}
              <span>
                <ScrambleText
                  text="at matcha."
                  key={heroGlitchCycle}
                  visibleOnly
                  paused={exploring}
                />
              </span>
            </>
          ) : (
            <>
              <span>A closer</span> <span>look at</span> <span>matcha.</span>
            </>
          )}
        </h1>

        <p className={styles.attributes}>
          {attributes.map((attribute) => (
            <span key={attribute}>
              {direction === "specimen" ? (
                <ScrambleText
                  text={attribute}
                  key={heroGlitchCycle}
                  visibleOnly
                  paused={exploring}
                />
              ) : (
                attribute
              )}
            </span>
          ))}
        </p>
        <p className={styles.application}>
          <ScrambleText
            text="Matcha selected for a specific application."
            key={heroGlitchCycle}
            periodic={direction !== "specimen"}
            visibleOnly={direction === "specimen"}
            paused={exploring}
            wrap
          />
        </p>
      </div>

      <button
        ref={exploreRef}
        type="button"
        className={styles.action}
        aria-expanded={exploring}
        aria-controls="home-selection"
        onClick={onExplore}
      >
        <ScrambleText
          text="EXPLORE MATCHA"
          interactive
          animateOnMount={false}
          paused={exploring}
        />
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 19 19 5M5 5h14v14" />
        </svg>
      </button>
    </div>
  );
}
