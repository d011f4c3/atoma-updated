"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./cart-drawer";
import { SpecimenHero } from "./specimen-hero";
import styles from "./selector-placement-study.module.css";

export function SelectorPlacementStudy() {
  const [placement, setPlacement] = useState<"left" | "right">("left");
  const [tone, setTone] = useState<"dark" | "light">("light");
  const { busy } = useCart();

  return (
    <div
      className={styles.study}
      data-selector-placement-study
      data-placement={placement}
      data-tone={tone}
    >
      <header className={styles.toolbar}>
        <h1>Slide placement</h1>
        <div
          className={styles.placements}
          role="group"
          aria-label="Selector placement"
        >
          {(["left", "right"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={placement === value}
              disabled={busy}
              onClick={() => {
                if (!busy) setPlacement(value);
              }}
            >
              {value === "left" ? "Left" : "Right"}
            </button>
          ))}
        </div>
        <Link
          className={styles.home}
          href="/"
          aria-label="Current homepage"
          aria-disabled={busy || undefined}
          onNavigate={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <span className={styles.fullLabel}>Current homepage</span>
          <span className={styles.compactLabel} aria-hidden="true">
            Home
          </span>
          <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <div className={styles.preview}>
        <SpecimenHero
          tone={tone}
          onToneChange={(nextTone) => {
            if (!busy) setTone(nextTone);
          }}
          selectorVariant="slides"
          sectionSelectorVariant="tabs"
          selectorPlacement={placement}
          originPreviewVariant="split"
          startAtSelection
        />
      </div>
    </div>
  );
}
