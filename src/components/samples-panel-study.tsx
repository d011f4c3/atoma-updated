"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  samplePanelLayouts,
  type SamplePanelLayout,
} from "@/lib/sample-panel-layouts";
import { useCart } from "./cart-drawer";
import { SpecimenHero } from "./specimen-hero";
import { useStorefrontTheme } from "./storefront-theme-provider";
import styles from "./samples-study.module.css";

export function SamplesPanelStudy({
  initialLayout = "lead",
}: {
  initialLayout?: SamplePanelLayout;
}) {
  const [layout, setLayout] = useState(initialLayout);
  const theme = useStorefrontTheme();
  const [tone, setTone] = useState(theme.tone);
  const { busy } = useCart();
  const id = useId();
  const selected = samplePanelLayouts.find((item) => item.value === layout)!;

  function changeLayout(next: SamplePanelLayout) {
    if (busy || layout === next) return;
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
      data-samples-panel-study
      data-layout={layout}
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <header className={styles.toolbar} lang="en">
        <p className={styles.title}>
          Samples panel study <span>Left selection / Sample Set first</span>
        </p>
        <div className={styles.field}>
          <label htmlFor={`${id}-layout`}>Sample panel layout</label>
          <select
            id={`${id}-layout`}
            value={layout}
            disabled={busy}
            onChange={(event) =>
              changeLayout(event.target.value as SamplePanelLayout)
            }
          >
            {samplePanelLayouts.map((item) => (
              <option value={item.value} key={item.value}>
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
            onChange={(event) =>
              setTone(event.target.value as "light" | "dark")
            }
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
          Page study ↗
        </Link>
        <Link
          href="/samples-study"
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          Earlier study ↗
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
        samplePanelVariant={layout}
      />
    </div>
  );
}
