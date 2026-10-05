"use client";

import { useState } from "react";
import type { NavigationVariant } from "./home-header";
import { SpecimenHero } from "./specimen-hero";
import styles from "./navigation-study.module.css";

const directions = [
  {
    value: "index",
    name: "01 Index",
    round: "kept",
    description:
      "Kept — a compact directory beside Cart. Open Index to compare.",
  },
  {
    value: "folio",
    name: "02 Folio",
    round: "kept",
    description: "Kept — a ruled directory unfolds beside the wordmark.",
  },
  {
    value: "dial",
    name: "03 Dial",
    round: "kept",
    description: "Kept — destinations orbit a circular Index control.",
  },
  {
    value: "quiet",
    name: "04 Plain text",
    round: "kept",
    description:
      "Selected — plain text, with button surfaces on hover or keyboard focus.",
  },
  {
    value: "edge",
    name: "05 Edge",
    round: "new",
    description:
      "New — a vertical edge tab slides open a directory. Open Index to try it.",
  },
  {
    value: "stack",
    name: "06 Stack",
    round: "new",
    description:
      "New — a stack of index cards unfolds into three destinations.",
  },
  {
    value: "shutter",
    name: "07 Shutter",
    round: "new",
    description: "New — a central Index reveals a wide navigation panel.",
  },
  {
    value: "frame",
    name: "08 Frame",
    round: "new",
    description:
      "New — destinations frame the page, leaving its centre to the product.",
  },
  {
    value: "track",
    name: "09 Track",
    round: "new",
    description:
      "New — open Index, then move along a fine rail between destinations.",
  },
] as const;

export function NavigationStudy() {
  const [variant, setVariant] = useState<NavigationVariant>("quiet");
  const [tone, setTone] = useState<"dark" | "light">("light");
  const current =
    directions.find((direction) => direction.value === variant) ??
    directions[0];

  return (
    <div
      className={styles.study}
      data-navigation-study
      data-navigation-variant={current.value}
    >
      <section className={styles.controls} aria-label="Navigation study">
        <h1>Navigation study</h1>
        <div
          className={styles.options}
          role="group"
          aria-label="Navigation options"
        >
          {(["kept", "new"] as const).map((round) => (
            <div
              key={round}
              className={styles.optionSet}
              data-round={round}
              role="group"
              aria-label={
                round === "kept" ? "Retained directions" : "New directions"
              }
            >
              {directions
                .filter((direction) => direction.round === round)
                .map((direction) => (
                  <button
                    key={direction.value}
                    type="button"
                    aria-pressed={current.value === direction.value}
                    onClick={() => setVariant(direction.value)}
                  >
                    {direction.name}
                  </button>
                ))}
            </div>
          ))}
        </div>
        <p aria-live="polite">{current.description}</p>
      </section>
      <div className={styles.preview}>
        <SpecimenHero
          tone={tone}
          navigationVariant={current.value}
          onToneChange={setTone}
        />
      </div>
    </div>
  );
}
