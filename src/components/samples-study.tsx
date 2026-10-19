"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useCart } from "./cart-drawer";
import { SpecimenHero } from "./specimen-hero";
import { useStorefrontTheme } from "./storefront-theme-provider";
import styles from "./samples-study.module.css";

export type SamplesStudyDirection = "selector" | "tile" | "panel" | "footer";

const directions = [
  {
    value: "selector",
    name: "01 — Selection rail",
    description:
      "A compact Sample Set entrance just beneath the three matcha choices.",
  },
  {
    value: "tile",
    name: "02 — Sample tile",
    description: "A separate photographic tile alongside the matcha choices.",
  },
  {
    value: "panel",
    name: "03 — Panel note",
    description:
      "A photographic Sample Set note within the active information or purchase panel.",
  },
  {
    value: "footer",
    name: "04 — Workspace bar",
    description:
      "A calm, full-width Sample Set entrance beneath the opened experience.",
  },
] as const;

export function SamplesStudy({
  initialDirection = "selector",
}: {
  initialDirection?: SamplesStudyDirection;
}) {
  const [direction, setDirection] = useState(initialDirection);
  const theme = useStorefrontTheme();
  const [tone, setTone] = useState(theme.tone);
  const { busy } = useCart();
  const id = useId();
  const selected = directions.find((item) => item.value === direction)!;

  function changeDirection(next: SamplesStudyDirection) {
    if (busy || next === direction) return;
    setDirection(next);
    const url = new URL(window.location.href);
    url.searchParams.set("direction", next);
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  return (
    <div
      className={styles.study}
      data-samples-study
      data-direction={direction}
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <header className={styles.toolbar} lang="en">
        <p className={styles.title}>
          Samples study <span>After Explore matcha</span>
        </p>
        <div className={styles.field}>
          <label htmlFor={`${id}-direction`}>Sample entrance</label>
          <select
            id={`${id}-direction`}
            value={direction}
            disabled={busy}
            onChange={(event) =>
              changeDirection(event.target.value as SamplesStudyDirection)
            }
          >
            {directions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-tone`}>Study appearance</label>
          <select
            id={`${id}-tone`}
            value={tone}
            disabled={busy}
            onChange={(event) => {
              if (!busy) setTone(event.target.value as "light" | "dark");
            }}
          >
            <option value="light">Mist</option>
            <option value="dark">Blue hour</option>
          </select>
        </div>
        <Link
          href="/samples-page-study"
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          Page study <span aria-hidden="true">↗</span>
        </Link>
        <Link
          href="/"
          aria-label="Current homepage"
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          Home <span aria-hidden="true">↗</span>
        </Link>
        <p className={styles.note}>{selected.description}</p>
      </header>
      <SpecimenHero
        tone={tone}
        onToneChange={(next) => {
          if (!busy) setTone(next);
        }}
        startAtSelection
        materialObject="silver-bag"
        introductionVariant="specimen"
        selectorVariant="slides"
        sectionSelectorVariant="tabs"
        selectorPlacement="left"
        originPreviewVariant="panorama"
        overviewStudyVariant="folded"
        shopPreviewVariant="refined"
        shopExplorationLayout="compact"
        productCodePlacement="register"
        sampleEntrancePlacement={direction}
      />
    </div>
  );
}
