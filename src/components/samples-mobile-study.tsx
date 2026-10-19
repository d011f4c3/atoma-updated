"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  sampleMobileLayouts,
  type SampleMobileLayout,
} from "@/lib/sample-mobile-layouts";
import { useCart } from "./cart-drawer";
import { SpecimenHero } from "./specimen-hero";
import { useStorefrontTheme } from "./storefront-theme-provider";
import styles from "./samples-mobile-study.module.css";

export function SamplesMobileStudy({
  initialLayout,
  initialTone,
}: {
  initialLayout: SampleMobileLayout;
  initialTone?: "light" | "dark";
}) {
  const [layout, setLayout] = useState(initialLayout);
  const theme = useStorefrontTheme();
  const [tone, setTone] = useState(initialTone ?? theme.tone);
  const { busy } = useCart();
  const id = useId();
  const selected = sampleMobileLayouts.find((item) => item.value === layout)!;

  function update(nextLayout: SampleMobileLayout, nextTone = tone) {
    if (busy || document.querySelector("dialog[open]")) return;
    setLayout(nextLayout);
    setTone(nextTone);
    const url = new URL(window.location.href);
    url.searchParams.set("layout", nextLayout);
    url.searchParams.set("tone", nextTone);
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  return (
    <div
      className={styles.study}
      data-samples-mobile-study
      data-study-layout={layout}
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <header className={styles.toolbar} lang="en">
        <div className={styles.title}>
          <h1>Sample Set / Mobile</h1>
          <Link
            href="/"
            aria-disabled={busy || undefined}
            onNavigate={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            Current site ↗
          </Link>
        </div>
        <label className={styles.appearance} htmlFor={`${id}-tone`}>
          <span>Study appearance</span>
          <select
            id={`${id}-tone`}
            value={tone}
            disabled={busy}
            onChange={(event) =>
              update(layout, event.target.value as "light" | "dark")
            }
          >
            <option value="light">Mist</option>
            <option value="dark">Blue hour</option>
          </select>
        </label>
        <div className={styles.comparison}>
          <div
            className={styles.options}
            role="group"
            aria-label="Mobile Sample Set layout"
          >
            {sampleMobileLayouts.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={busy}
                aria-pressed={layout === option.value}
                onClick={() => update(option.value)}
              >
                {option.name}
              </button>
            ))}
          </div>
          <p className={styles.note} aria-live="polite">
            {selected.description}
          </p>
          <p className={styles.desktopNote}>
            Open on a phone or narrow this window to compare. Desktop keeps the
            current Sample Set layout.
          </p>
        </div>
      </header>
      <SpecimenHero
        storefrontTheme
        tone={tone}
        onToneChange={(next) => update(layout, next)}
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
        sampleEntryDirection="quiet"
        sampleEntryScope="left"
        sampleRightEntry="start"
        sampleImageryVariant="sachets"
        sampleOrderLayout="essentials"
        sampleMobileLayout={layout}
      />
    </div>
  );
}
