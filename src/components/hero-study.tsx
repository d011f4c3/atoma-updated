"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { useCart } from "./cart-drawer";
import { SpecimenHero } from "./specimen-hero";
import { useSmoothScroll } from "./smooth-scroll";
import { useStorefrontTheme } from "./storefront-theme-provider";
import type { HeroIntroductionDirection } from "./hero-study-introduction";
import styles from "./hero-study.module.css";

type Direction = "current" | HeroIntroductionDirection;

const directions = [
  { value: "current", name: "Current", number: "00" },
  { value: "specimen", name: "Specimen", number: "01" },
  { value: "margin", name: "Margin", number: "02" },
  { value: "register", name: "Register", number: "03" },
  { value: "fieldnote", name: "Fieldnote", number: "04" },
  { value: "ledger", name: "Ledger", number: "05" },
  { value: "signal", name: "Signal", number: "06" },
  { value: "axis", name: "Axis", number: "07" },
] as const;

export function HeroStudy({
  initialDirection = "specimen",
}: {
  initialDirection?: Direction;
}) {
  const [direction, setDirection] = useState<Direction>(initialDirection);
  const theme = useStorefrontTheme();
  const [tone, setTone] = useState(theme.tone);
  const { busy } = useCart();
  const selectorId = useId();
  const previewRef = useRef<HTMLDivElement>(null);
  useSmoothScroll(previewRef);

  function changeDirection(next: Direction) {
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
      data-hero-study
      data-direction={direction}
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <header className={styles.toolbar}>
        <p className={styles.title}>
          Hero study <span>Left side</span>
        </p>
        <div
          className={styles.directions}
          role="group"
          aria-label="Hero direction"
        >
          {directions.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-label={item.name}
              aria-pressed={direction === item.value}
              disabled={busy}
              onClick={() => changeDirection(item.value)}
            >
              <span aria-hidden="true">{item.number}</span>
              {item.name}
            </button>
          ))}
        </div>
        <div className={styles.mobileSelector}>
          <label htmlFor={selectorId}>Direction</label>
          <select
            id={selectorId}
            value={direction}
            disabled={busy}
            onChange={(event) =>
              changeDirection(event.target.value as Direction)
            }
          >
            {directions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.number} — {item.name}
              </option>
            ))}
          </select>
        </div>
        <Link
          className={styles.home}
          href="/"
          aria-label="Current homepage"
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <span>Current site</span> ↗
        </Link>
      </header>
      <div ref={previewRef} className={styles.preview}>
        <SpecimenHero
          tone={tone}
          onToneChange={(next) => {
            if (!busy) setTone(next);
          }}
          materialObject="silver-bag"
          selectorVariant="slides"
          sectionSelectorVariant="tabs"
          selectorPlacement="left"
          originPreviewVariant="panorama"
          shopPreviewVariant="refined"
          shopExplorationLayout="compact"
          introductionVariant={direction}
        />
      </div>
    </div>
  );
}
