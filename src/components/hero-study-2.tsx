"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useCart } from "./cart-drawer";
import { SpecimenHero } from "./specimen-hero";
import { useStorefrontTheme } from "./storefront-theme-provider";
import type { HeroStudy2Direction } from "./hero-study-2-introduction";
import styles from "./hero-study-2.module.css";

const directions = [
  {
    value: "current",
    name: "00 — Current",
    description:
      "The adopted Specimen introduction from the homepage, kept as the comparison baseline.",
  },
  {
    value: "display",
    name: "01 — Display",
    description:
      "A large, three-line statement with split supporting copy and a connected Explore action.",
  },
  {
    value: "cadence",
    name: "02 — Cadence",
    description:
      "Three ruled lines pair the headline with Flavour, Texture and Performance.",
  },
  {
    value: "proof",
    name: "03 — Proof",
    description:
      "Flavour, Texture and Performance become the main typographic statement.",
  },
] as const;

export function HeroStudy2({
  initialDirection = "display",
}: {
  initialDirection?: HeroStudy2Direction;
}) {
  const [direction, setDirection] = useState(initialDirection);
  const { tone: storefrontTone } = useStorefrontTheme();
  const [tone, setTone] = useState(storefrontTone);
  const { busy } = useCart();
  const id = useId();
  const selected = directions.find((item) => item.value === direction)!;

  function changeDirection(next: HeroStudy2Direction) {
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
      data-hero-study-2
      data-direction={direction}
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <header className={styles.toolbar}>
        <p className={styles.title}>
          Hero study 02 <span>Left side</span>
        </p>
        <div className={styles.field}>
          <label htmlFor={`${id}-direction`}>Hero layout</label>
          <select
            id={`${id}-direction`}
            value={direction}
            disabled={busy}
            onChange={(event) =>
              changeDirection(event.target.value as HeroStudy2Direction)
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
          href="/hero-study"
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          Study 01 <span aria-hidden="true">↗</span>
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
        materialObject="silver-bag"
        selectorVariant="slides"
        sectionSelectorVariant="tabs"
        selectorPlacement="left"
        originPreviewVariant="panorama"
        shopPreviewVariant="refined"
        introductionStudy2Variant={direction}
      />
    </div>
  );
}
