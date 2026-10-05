"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./cart-drawer";
import { SpecimenHero } from "./specimen-hero";
import styles from "./color-study.module.css";

type Palette = "mist" | "blue-hour";

const palettes = [
  { value: "mist", name: "Mist", description: "Porcelain / Sage / Graphite" },
  { value: "blue-hour", name: "Blue hour", description: "Ink / Ice / Silver" },
] as const;

export function ColorStudy({
  initialPalette = "mist",
  initialProductHandle,
}: {
  initialPalette?: Palette;
  initialProductHandle?: string;
}) {
  const [palette, setPalette] = useState<Palette>(initialPalette);
  const { busy } = useCart();
  const tone = palette === "mist" ? "light" : "dark";
  const direction = palettes.find((item) => item.value === palette)!;

  function changePalette(next: Palette) {
    if (busy || next === palette) return;
    setPalette(next);
    const url = new URL(window.location.href);
    url.searchParams.set("palette", next);
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  return (
    <div
      className={styles.study}
      data-color-study
      data-palette={palette}
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <header className={styles.toolbar}>
        <h1>Color studies</h1>
        <div
          className={styles.palettes}
          role="group"
          aria-label="Color palette"
        >
          {palettes.map((item, index) => (
            <button
              type="button"
              key={item.value}
              aria-pressed={palette === item.value}
              aria-label={item.name}
              disabled={busy}
              onClick={() => changePalette(item.value)}
            >
              <span
                className={styles.swatch}
                data-swatch={item.value}
                aria-hidden="true"
              />
              <span className={styles.number} aria-hidden="true">
                0{index + 1}
              </span>
              {item.name}
            </button>
          ))}
        </div>
        <p className={styles.description}>{direction.description}</p>
        <Link
          className={styles.home}
          href="/"
          aria-label="Current homepage"
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <span className={styles.homeLabel}>Current site</span>
          <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <div className={styles.preview}>
        <SpecimenHero
          tone={tone}
          onToneChange={(next) =>
            changePalette(next === "light" ? "mist" : "blue-hour")
          }
          selectorVariant="slides"
          sectionSelectorVariant="tabs"
          selectorPlacement="left"
          originPreviewVariant="split"
          shopPreviewVariant="refined"
          initialProductHandle={initialProductHandle}
          startAtSelection={Boolean(initialProductHandle)}
        />
      </div>
    </div>
  );
}
