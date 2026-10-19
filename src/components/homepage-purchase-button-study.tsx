"use client";

import Link from "next/link";
import { useState } from "react";
import { AddToCartButton } from "./add-to-cart-button";
import { SpecimenHero } from "./specimen-hero";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./homepage-purchase-button-study.module.css";

const directions = [
  {
    value: "current",
    name: "Current",
    description: "The original action, at full contrast.",
  },
  {
    value: "soft",
    name: "Soft solid",
    description: "A softer solid face. Clear emphasis, less glare.",
  },
  {
    value: "tonal",
    name: "Tonal",
    description: "A quiet surface, with the label and edge carrying emphasis.",
  },
  {
    value: "outline",
    name: "Outline",
    description: "An open face that sits lightly beneath the order total.",
  },
] as const;

export type HomepagePurchaseSurface = (typeof directions)[number]["value"];
const states = [
  { value: "ready", label: "Ready" },
  { value: "pending", label: "Adding" },
  { value: "updating", label: "Updating prices" },
  { value: "unavailable", label: "Unavailable" },
  { value: "locked", label: "Locked" },
] as const;
type PreviewState = (typeof states)[number]["value"];

export function HomepagePurchaseButtonStudy({
  initialSurface = "soft",
  initialTone,
}: {
  initialSurface?: HomepagePurchaseSurface;
  initialTone?: "light" | "dark";
}) {
  const { tone: storefrontTone } = useStorefrontTheme();
  const { locale } = useStorefrontLocale();
  const [tone, setTone] = useState(initialTone ?? storefrontTone);
  const [surface, setSurface] = useState(initialSurface);
  const [state, setState] = useState<PreviewState>("ready");
  const [status, setStatus] = useState("Interaction preview · cart unchanged.");
  const selected = directions.find((item) => item.value === surface)!;

  function updatePreview(
    nextSurface: HomepagePurchaseSurface,
    nextTone = tone,
  ) {
    setSurface(nextSurface);
    setTone(nextTone);
    const url = new URL(window.location.href);
    url.searchParams.set("surface", nextSurface);
    url.searchParams.set("tone", nextTone);
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  return (
    <div
      className={styles.study}
      data-homepage-purchase-study
      data-storefront-theme={tone}
      data-tone={tone}
      data-preview-state={state}
      lang="en"
    >
      <header className={styles.toolbar}>
        <div className={styles.title}>
          <h1>Button study</h1>
          <span>Homepage / Shop</span>
        </div>
        <fieldset className={styles.directions}>
          <legend className={styles.srOnly}>Purchase button surface</legend>
          {directions.map((item, index) => (
            <label
              className={styles.direction}
              data-selected={surface === item.value}
              key={item.value}
            >
              <input
                type="radio"
                name="homepage-purchase-surface"
                value={item.value}
                checked={surface === item.value}
                onChange={() => updatePreview(item.value)}
              />
              <span aria-hidden="true">0{index + 1}</span>
              {item.name}
            </label>
          ))}
        </fieldset>
        <label className={styles.stateControl}>
          <span>State</span>
          <select
            aria-label="Button state"
            value={state}
            onChange={(event) => setState(event.target.value as PreviewState)}
          >
            {states.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button
          className={styles.theme}
          type="button"
          role="switch"
          aria-label="Dark mode in homepage button study"
          aria-checked={tone === "dark"}
          onClick={() =>
            updatePreview(surface, tone === "light" ? "dark" : "light")
          }
        >
          {tone === "light" ? "Mist" : "Blue hour"}{" "}
          <span aria-hidden="true">↔</span>
        </button>
        <Link className={styles.archive} href="/purchase-button-study/samples">
          Earlier study <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <div className={styles.note}>
        <p>{selected.description}</p>
        <p className={styles.status} role="status" aria-atomic="true">
          {status}
        </p>
      </div>
      <div className={styles.preview} lang={locale}>
        <SpecimenHero
          tone={tone}
          storefrontTheme
          onToneChange={(nextTone) => updatePreview(surface, nextTone)}
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
          sampleOrderLayout="essentials"
          sampleMobileLayout="compact"
          initialView="builder"
          startAtSelection
          purchaseAction={
            <div
              className={styles.purchaseAction}
              data-surface={surface}
              data-homepage-purchase-preview
            >
              <AddToCartButton
                available={state !== "unavailable"}
                pending={state === "pending"}
                updating={state === "updating"}
                disabled={state === "locked"}
                onAdd={() =>
                  setStatus(`${selected.name} previewed · cart unchanged.`)
                }
              />
            </div>
          }
        />
      </div>
    </div>
  );
}
