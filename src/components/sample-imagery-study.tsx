"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { useCart } from "./cart-drawer";
import { SpecimenHero } from "./specimen-hero";
import { useStorefrontTheme } from "./storefront-theme-provider";
import {
  sampleImageryOptions,
  type SampleImageryVariant,
} from "./sample-set-imagery";
import styles from "./sample-imagery-study.module.css";

export function SampleImageryStudy({
  initialVariant = "sachets",
}: {
  initialVariant?: SampleImageryVariant;
}) {
  const [variant, setVariant] = useState(initialVariant);
  const theme = useStorefrontTheme();
  const [tone, setTone] = useState(theme.tone);
  const { busy } = useCart();
  const id = useId();
  const selected = sampleImageryOptions.find((item) => item.value === variant)!;

  function changeVariant(next: SampleImageryVariant) {
    if (busy || next === variant) return;
    setVariant(next);
    const url = new URL(window.location.href);
    url.searchParams.set("imagery", next);
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  return (
    <div
      className={styles.study}
      data-sample-imagery-study
      data-imagery={variant}
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <header
        className={styles.toolbar}
        lang="en"
        data-sample-entry-study-controls
      >
        <p className={styles.title}>
          Sample Set / Imagery<span>Left material study</span>
        </p>
        <div
          className={styles.options}
          role="group"
          aria-label="Sample imagery direction"
        >
          {sampleImageryOptions.map((item) => (
            <button
              type="button"
              key={item.value}
              disabled={busy}
              aria-pressed={variant === item.value}
              data-concept-option={
                item.value === "sachets" ||
                item.value === "box" ||
                item.value === "landscape" ||
                undefined
              }
              onClick={() => changeVariant(item.value)}
            >
              {item.name}
            </button>
          ))}
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
          onNavigate={(event) => {
            if (busy) event.preventDefault();
          }}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          Current site ↗
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
        sampleEntryDirection="quiet"
        sampleEntryScope="left"
        sampleRightEntry="start"
        sampleImageryVariant={variant}
      />
    </div>
  );
}
