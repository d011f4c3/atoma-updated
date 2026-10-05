"use client";

import type { RefObject } from "react";
import styles from "./hero-introduction-revisions.module.css";

export type HeroRevisionDirection = "fieldnote" | "ledger" | "signal" | "axis";

export function HeroIntroductionRevisions({
  direction,
  exploring,
  onExplore,
  exploreRef,
}: {
  direction: HeroRevisionDirection;
  exploring: boolean;
  onExplore: () => void;
  exploreRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <div className={styles.root} data-direction={direction}>
      <p className={styles.eyebrow}>
        <span aria-hidden="true" />
        MATCHA
      </p>
      <div className={styles.group}>
        <div className={styles.copy}>
          <h1 className={styles.heading}>
            {direction === "signal" || direction === "axis" ? (
              <>
                <span className={styles.lead}>A closer look at</span>{" "}
                <span className={styles.subject}>matcha.</span>
              </>
            ) : direction === "ledger" ? (
              <>
                <span>A closer look</span> <span>at matcha.</span>
              </>
            ) : (
              <>
                <span>A closer</span> <span>look at matcha.</span>
              </>
            )}
          </h1>
          <p className={styles.application}>
            Matcha selected for a specific application.
          </p>
          <p className={styles.attributes}>
            <span>Flavour.</span> <span>Texture.</span>{" "}
            <span>Performance.</span>
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
          <span>EXPLORE MATCHA</span>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 19 19 5M5 5h14v14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
