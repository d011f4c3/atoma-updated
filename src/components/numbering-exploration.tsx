"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import type { ProductCodePlacement } from "@/lib/product-display-index";
import { useCart } from "./cart-drawer";
import { SpecimenHero } from "./specimen-hero";
import { useSmoothScroll } from "./smooth-scroll";
import { useStorefrontTheme } from "./storefront-theme-provider";
import styles from "./numbering-exploration.module.css";

type Direction = "current" | ProductCodePlacement;
const directions = [
  {
    value: "current",
    name: "No code",
    description: "The existing product cards and information, without codes.",
  },
  {
    value: "eyebrow",
    name: "Above name",
    description:
      "A small identifier above the name. The original text stays aligned.",
  },
  {
    value: "corner",
    name: "Corner",
    description:
      "The code lives in the corner, keeping the product name clear.",
  },
  {
    value: "footline",
    name: "Footer line",
    description:
      "A fine rule separates the product identity from its reference code.",
  },
  {
    value: "caption",
    name: "Caption",
    description:
      "The code joins the supporting caption, keeping the name clear.",
  },
  {
    value: "edge",
    name: "Edge note",
    description:
      "A vertical reference sits along a fine line at the right edge.",
  },
  {
    value: "register",
    name: "Register",
    description:
      "An open diamond and fine line align the code with the material.",
  },
  {
    value: "tag",
    name: "Specimen tag",
    description:
      "An open-ended label sets the code beneath the product identity.",
  },
] as const;

export function NumberingExploration({
  initialDirection = "register",
}: {
  initialDirection?: Direction;
}) {
  const [direction, setDirection] = useState<Direction>(initialDirection);
  const theme = useStorefrontTheme();
  const [tone, setTone] = useState(theme.tone);
  const { busy } = useCart();
  const selectorId = useId();
  const preview = useRef<HTMLDivElement>(null);
  useSmoothScroll(preview);
  const selected =
    directions.find((item) => item.value === direction) ?? directions[1];

  function changeDirection(next: Direction) {
    if (busy || direction === next) return;
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
      data-numbering-exploration
      data-direction={direction}
      data-storefront-theme={tone}
    >
      <header className={styles.toolbar}>
        <div className={styles.title}>
          Product identity<span>Overview · Specifications · Shop</span>
        </div>
        <div
          className={styles.directions}
          role="group"
          aria-label="Identity direction"
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
              {["caption", "edge", "register", "tag"].includes(item.value) && (
                <span className={styles.newLabel}>New</span>
              )}
            </button>
          ))}
        </div>
        <label className={styles.mobileLabel} htmlFor={selectorId}>
          Identity direction
        </label>
        <select
          className={styles.mobileSelect}
          id={selectorId}
          value={direction}
          disabled={busy}
          onChange={(event) => changeDirection(event.target.value as Direction)}
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
        <p className={styles.description}>
          {selected.description}{" "}
          <span>Register is used on the current site.</span>
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
          productCodePlacement={direction === "current" ? undefined : direction}
          initialView="overview"
          startAtSelection
        />
      </div>
    </div>
  );
}
