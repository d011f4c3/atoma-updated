"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  sampleOrderLayouts,
  type SampleOrderLayout,
} from "@/lib/sample-order-layouts";
import { useCart } from "./cart-drawer";
import { SpecimenHero } from "./specimen-hero";
import { useStorefrontTheme } from "./storefront-theme-provider";
import styles from "./samples-order-study.module.css";

export function SamplesOrderStudy({
  initialLayout,
}: {
  initialLayout: SampleOrderLayout;
}) {
  const [layout, setLayout] = useState(initialLayout);
  const theme = useStorefrontTheme();
  const [tone, setTone] = useState(theme.tone);
  const { busy } = useCart();
  const id = useId();
  const selected = sampleOrderLayouts.find(
    (option) => option.value === layout,
  )!;

  function changeLayout(next: SampleOrderLayout) {
    if (busy || next === layout) return;
    setLayout(next);
    const url = new URL(window.location.href);
    url.searchParams.set("layout", next);
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  return (
    <div
      className={styles.study}
      data-samples-order-study
      data-study-layout={layout}
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <header
        className={styles.toolbar}
        lang="en"
        data-sample-entry-study-controls
      >
        <p className={styles.title}>
          Sample Set<span>Final ordering study</span>
        </p>
        <div className={styles.comparison}>
          <div
            className={styles.options}
            role="group"
            aria-label="Sample ordering layout"
          >
            {sampleOrderLayouts.map((option) => (
              <button
                type="button"
                key={option.value}
                disabled={busy}
                aria-pressed={layout === option.value}
                onClick={() => changeLayout(option.value)}
              >
                {option.name}
              </button>
            ))}
          </div>
          <p className={styles.note} aria-live="polite">
            {selected.description}
          </p>
        </div>
        <label className={styles.appearance} htmlFor={`${id}-tone`}>
          <span>Appearance</span>
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
        </label>
        <Link
          href="/"
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
          onNavigate={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          Current site ↗
        </Link>
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
        sampleEntryDirection="quiet"
        sampleEntryScope="left"
        sampleRightEntry="start"
        sampleImageryVariant="sachets"
        sampleOrderLayout={layout}
      />
    </div>
  );
}
