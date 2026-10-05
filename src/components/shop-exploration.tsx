"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { useCart } from "./cart-drawer";
import type { ShopExplorationLayout } from "./shop-exploration-panel";
import { SpecimenHero } from "./specimen-hero";
import { useSmoothScroll } from "./smooth-scroll";
import styles from "./shop-exploration.module.css";

type Direction = "current" | ShopExplorationLayout;

const directions = [
  {
    value: "current",
    name: "Previous",
    number: "00",
    description: "The previous homepage Shop, retained for comparison.",
  },
  {
    value: "guided",
    name: "Guided order",
    number: "01",
    description: "Format, quantity and purchase in a clear, numbered sequence.",
  },
  {
    value: "compact",
    name: "Quick order",
    number: "02",
    description: "All order controls together, with a direct path to the cart.",
  },
  {
    value: "receipt",
    name: "Order receipt",
    number: "03",
    description:
      "Adjust your selection beside a clear, itemized order summary.",
  },
] as const;

export function ShopExploration({
  initialLayout = "compact",
}: {
  initialLayout?: Direction;
}) {
  const [layout, setLayout] = useState<Direction>(initialLayout);
  const [tone, setTone] = useState<"light" | "dark">("light");
  const { busy } = useCart();
  const id = useId();
  const preview = useRef<HTMLDivElement>(null);
  useSmoothScroll(preview);
  const direction = directions.find((item) => item.value === layout)!;

  function changeLayout(next: Direction) {
    if (busy || next === layout) return;
    setLayout(next);
    const url = new URL(window.location.href);
    url.searchParams.set("layout", next);
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  return (
    <div
      className={styles.study}
      data-shop-exploration
      data-layout={layout}
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <header className={styles.toolbar}>
        <div className={styles.title}>
          Shop exploration <span>02 / Homepage section</span>
        </div>
        <div className={styles.layouts} role="group" aria-label="Shop layout">
          {directions.map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={layout === item.value}
              disabled={busy}
              onClick={() => changeLayout(item.value)}
            >
              <span aria-hidden="true">{item.number}</span>
              {item.name}
            </button>
          ))}
        </div>
        <label className={styles.mobileLabel} htmlFor={id}>
          Shop layout
        </label>
        <select
          className={styles.mobileSelect}
          id={id}
          value={layout}
          disabled={busy}
          onChange={(event) => changeLayout(event.target.value as Direction)}
        >
          {directions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.number} — {item.name}
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
        <p className={styles.description}>{direction.description}</p>
      </header>
      <div ref={preview} className={styles.preview}>
        <SpecimenHero
          tone={tone}
          onToneChange={(next) => {
            if (!busy) setTone(next);
          }}
          materialObject="silver-bag"
          introductionVariant="specimen"
          shopPreviewVariant="refined"
          shopExplorationLayout={layout === "current" ? undefined : layout}
          originPreviewVariant="panorama"
          initialView="builder"
          selectorVariant="slides"
          sectionSelectorVariant="tabs"
          selectorPlacement="left"
          startAtSelection
        />
      </div>
    </div>
  );
}
