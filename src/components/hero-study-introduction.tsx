"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

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
const heroGlitchPlayback = { durationMs: 800, mobileDurationMs: 1200 };

export function HeroStudyIntroduction({
  direction,
  exploring,
  onExplore,
  exploreRef,
}: HeroStudyIntroductionProps) {
  const { t } = useStorefrontLocale();
  const heroGlitchCycle = usePeriodicGlitch(
    direction === "specimen" && !exploring,
    { intervalMs: 4200, mobileIntervalMs: 7000 },
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
        {t("MATCHA")}
      </p>

      <div className={styles.statement}>
        <h1 className={styles.heading}>
          {direction === "specimen" ? (
            <>
              <span>
                <ScrambleText
                  text={t("A closer look")}
                  key={heroGlitchCycle}
                  {...heroGlitchPlayback}
                  visibleOnly
                  paused={exploring}
                />
              </span>{" "}
              <span>
                <ScrambleText
                  text={t("at matcha.")}
                  key={heroGlitchCycle}
                  {...heroGlitchPlayback}
                  visibleOnly
                  paused={exploring}
                />
              </span>
            </>
          ) : (
            <>
              <span>{t("A closer")}</span> <span>{t("look at")}</span>{" "}
              <span>{t("matcha.")}</span>
            </>
          )}
        </h1>

        <p className={styles.attributes}>
          {attributes.map((attribute) => (
            <span key={attribute}>
              {direction === "specimen" ? (
                <ScrambleText
                  text={t(attribute)}
                  key={heroGlitchCycle}
                  {...heroGlitchPlayback}
                  visibleOnly
                  paused={exploring}
                />
              ) : (
                t(attribute)
              )}
            </span>
          ))}
        </p>
        <p className={styles.application}>
          <ScrambleText
            text={t("Matcha selected for a specific application.")}
            key={heroGlitchCycle}
            {...(direction === "specimen" ? heroGlitchPlayback : {})}
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
          text={t("EXPLORE MATCHA")}
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
