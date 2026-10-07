"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { useCart } from "./cart-drawer";
import { SpecimenHero } from "./specimen-hero";
import { useSmoothScroll } from "./smooth-scroll";
import { useStorefrontTheme } from "./storefront-theme-provider";
import styles from "./overview-study.module.css";

export type OverviewStudyDirection = "current" | "digest" | "index" | "folded";

const directions = [
  {
    value: "current",
    name: "Original",
    description: "The previous Overview, retained for comparison.",
  },
  {
    value: "digest",
    name: "Digest",
    description:
      "Three material qualities and the available format, with longer copy in Product details.",
  },
  {
    value: "index",
    name: "Index",
    description:
      "A ruled application and quality index, with expandable formats and Product details.",
  },
  {
    value: "folded",
    name: "Folded",
    description:
      "One introduction, with three compact disclosures for formats, preparation and the product record.",
  },
] as const;

export function OverviewStudy({
  initialDirection = "digest",
}: {
  initialDirection?: OverviewStudyDirection;
}) {
  const [direction, setDirection] =
    useState<OverviewStudyDirection>(initialDirection);
  const theme = useStorefrontTheme();
  const [tone, setTone] = useState(theme.tone);
  const { busy } = useCart();
  const selectorId = useId();
  const preview = useRef<HTMLDivElement>(null);
  useSmoothScroll(preview);
  const selected =
    directions.find((item) => item.value === direction) ?? directions[1];

  function changeDirection(next: OverviewStudyDirection) {
    if (busy || direction === next) return;
    setDirection(next);
    const url = new URL(window.location.href);
    url.searchParams.set("direction", next);
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  return (
    <div
      className={styles.study}
      data-overview-study
      data-direction={direction}
      data-storefront-theme={tone}
    >
      <header className={styles.toolbar}>
        <div className={styles.title}>
          Overview study<span>Three lighter directions</span>
        </div>
        <div
          className={styles.directions}
          role="group"
          aria-label="Overview direction"
        >
          {directions.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={direction === item.value}
              disabled={busy}
              onClick={() => changeDirection(item.value)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <label className={styles.mobileLabel} htmlFor={selectorId}>
          Overview direction
        </label>
        <select
          className={styles.mobileSelect}
          id={selectorId}
          value={direction}
          disabled={busy}
          onChange={(event) =>
            changeDirection(event.target.value as OverviewStudyDirection)
          }
        >
          {directions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.name}
            </option>
          ))}
        </select>
        <Link
          className={styles.home}
          href="/"
          aria-label="Current homepage"
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          Current site ↗
        </Link>
        <p className={styles.description} aria-live="polite">
          {selected.description}
        </p>
      </header>
      <div ref={preview} className={styles.preview}>
        <SpecimenHero
          tone={tone}
          onToneChange={(next) => {
            if (!busy) setTone(next);
          }}
          materialObject="silver-bag"
          introductionVariant="specimen"
          selectorVariant="slides"
          sectionSelectorVariant="tabs"
          selectorPlacement="left"
          originPreviewVariant="panorama"
          shopPreviewVariant="refined"
          shopExplorationLayout="compact"
          productCodePlacement="register"
          overviewStudyVariant={direction}
          initialView="overview"
          startAtSelection
        />
      </div>
    </div>
  );
}
