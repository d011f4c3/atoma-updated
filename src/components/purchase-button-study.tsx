"use client";

import Link from "next/link";
import { useState } from "react";
import { SAMPLE_SET_CONTENTS, SAMPLE_SET_TOTAL_GRAMS } from "@/lib/sample-set";
import { AddToCartButton, type AddToCartTreatment } from "./add-to-cart-button";
import { ShopMaterialImage } from "./shop-material-image";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useStorefrontTheme } from "./storefront-theme-provider";
import styles from "./purchase-button-study.module.css";

const directions = [
  {
    value: "current",
    name: "Current",
    note: "The reference",
    description: "Full contrast, animated label and moving highlight.",
  },
  {
    value: "mineral",
    name: "Mineral",
    note: "Tonal fill",
    description: "A soft mineral tint gives the whole action a quiet presence.",
  },
  {
    value: "split",
    name: "Split",
    note: "Focused contrast",
    description: "A calm surface with emphasis held in a small action square.",
  },
  {
    value: "keyline",
    name: "Keyline",
    note: "Precision edge",
    description: "An open face, a defined edge and a fine weighted baseline.",
  },
] as const;

const states = [
  { value: "ready", label: "Ready" },
  { value: "pending", label: "Adding" },
  { value: "updating", label: "Updating prices" },
  { value: "unavailable", label: "Unavailable" },
  { value: "locked", label: "Locked" },
] as const;
type PreviewState = (typeof states)[number]["value"];

export function PurchaseButtonStudy({
  initialDirection = "mineral",
  initialTone,
}: {
  initialDirection?: AddToCartTreatment;
  initialTone?: "light" | "dark";
}) {
  const { tone: storefrontTone } = useStorefrontTheme();
  const { locale, t } = useStorefrontLocale();
  const [tone, setTone] = useState(initialTone ?? storefrontTone);
  const [direction, setDirection] = useState(initialDirection);
  const [state, setState] = useState<PreviewState>("ready");
  const [status, setStatus] = useState(
    "Interaction preview · no cart changes.",
  );
  const selected = directions.find((item) => item.value === direction)!;

  function updatePreview(nextDirection: AddToCartTreatment, nextTone = tone) {
    setDirection(nextDirection);
    setTone(nextTone);
    const url = new URL(window.location.href);
    url.searchParams.set("direction", nextDirection);
    url.searchParams.set("tone", nextTone);
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}`,
    );
  }

  function previewButton(treatment: AddToCartTreatment) {
    const name = directions.find((item) => item.value === treatment)!.name;
    return (
      <AddToCartButton
        treatment={treatment}
        available={state !== "unavailable"}
        pending={state === "pending"}
        updating={state === "updating"}
        disabled={state === "locked"}
        onAdd={() =>
          setStatus(`${name} interaction previewed. Your cart is unchanged.`)
        }
      />
    );
  }

  return (
    <main
      className={styles.study}
      data-purchase-button-study
      data-storefront-theme={tone}
      data-tone={tone}
      data-preview-state={state}
      lang="en"
    >
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          ATOMA <span>/ Studies</span>
        </Link>
        <Link href="/purchase-button-study" className={styles.return}>
          Homepage study <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className={styles.introduction} aria-labelledby="study-title">
        <p className={styles.eyebrow}>Purchase button / 04 directions</p>
        <h1 id="study-title">A quieter way to add.</h1>
        <p>
          Less glare. A clear action. Compare three softer treatments with the
          current button.
        </p>
      </section>

      <div className={styles.toolbar}>
        <p>
          01—04 <span>Same action, different emphasis.</span>
        </p>
        <div className={styles.controls}>
          <label className={styles.stateControl}>
            <span>State</span>
            <select
              aria-label="Button state"
              value={state}
              onChange={(event) => setState(event.target.value as PreviewState)}
            >
              {states.map((item) => (
                <option value={item.value} key={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className={styles.theme}
            type="button"
            role="switch"
            aria-label="Dark mode in button study"
            aria-checked={tone === "dark"}
            onClick={() =>
              updatePreview(direction, tone === "light" ? "dark" : "light")
            }
          >
            <span className={styles.themeDot} aria-hidden="true" />
            {tone === "light" ? "Mist" : "Blue hour"}
            <span aria-hidden="true">↔</span>
          </button>
        </div>
      </div>

      <div className={styles.workspace}>
        <section className={styles.context} aria-labelledby="context-title">
          <div className={styles.contextHeading}>
            <h2 id="context-title">In context</h2>
            <select
              aria-label="Treatment in context"
              value={direction}
              onChange={(event) =>
                updatePreview(event.target.value as AddToCartTreatment)
              }
            >
              {directions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.purchase}>
            <div className={styles.materials} lang={locale}>
              {SAMPLE_SET_CONTENTS.map((item) => (
                <div key={item.key} className={styles.material}>
                  <ShopMaterialImage src={item.image} alt={t(item.imageAlt)} />
                </div>
              ))}
            </div>
            <div className={styles.product} lang={locale}>
              <h3>{t("Sample Set")}</h3>
              <span>3 × 20 g / {SAMPLE_SET_TOTAL_GRAMS} g</span>
            </div>
            <p className={styles.productNote} lang={locale}>
              {t("Three matcha · 20 g each")}
            </p>
            <div data-purchase-preview lang={locale}>
              {previewButton(direction)}
            </div>
            <p className={styles.previewNotice}>
              Button preview · purchasing is inactive
            </p>
          </div>
          <p className={styles.selectedNote}>{selected.description}</p>
          <p className={styles.status} role="status" aria-atomic="true">
            {status}
          </p>
        </section>

        <fieldset className={styles.comparison}>
          <legend>
            Compare treatments <span>Select one to view in context</span>
          </legend>
          <div className={styles.options}>
            {directions.map((item, index) => (
              <article
                className={styles.option}
                data-button-option={item.value}
                data-selected={direction === item.value}
                key={item.value}
              >
                <label className={styles.optionLabel}>
                  <span className={styles.optionNumber}>0{index + 1}</span>
                  <span className={styles.optionName}>
                    {item.name}
                    <span>{item.note}</span>
                  </span>
                  <input
                    type="radio"
                    name="purchase-direction"
                    value={item.value}
                    checked={direction === item.value}
                    onChange={() => updatePreview(item.value)}
                  />
                </label>
                <div className={styles.optionButton} lang={locale}>
                  {previewButton(item.value)}
                </div>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </fieldset>
      </div>
      <footer className={styles.footer}>
        <span>Study 0209 / Purchase interaction</span>
        <span>Alternatives stay still at rest. Motion follows intent.</span>
      </footer>
    </main>
  );
}
