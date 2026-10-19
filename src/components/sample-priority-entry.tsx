"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { SAMPLE_SET_CONTENTS, type SampleSetContent } from "@/lib/sample-set";
import type { ProductKey } from "@/lib/product-codes";
import { ShopMaterialImage } from "./shop-material-image";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./sample-priority-entry.module.css";

export type SamplePriorityTreatment =
  "invitation" | "preparation" | "alongside" | "spotlight";

function Powder({ item }: { item: SampleSetContent }) {
  return (
    <span className={styles.powder} aria-hidden="true">
      <ShopMaterialImage src={item.image} alt="" />
    </span>
  );
}

/** Promotional previews use the same set contents; none alter the order. */
export function SamplePriorityEntry({
  treatment,
  selectedHandle,
  disabled,
}: {
  treatment: SamplePriorityTreatment;
  selectedHandle?: string;
  disabled: boolean;
}) {
  const { t } = useStorefrontLocale();
  const id = useId();
  const [preview, setPreview] = useState<ProductKey>("ceremonial");
  const current =
    SAMPLE_SET_CONTENTS.find((item) => item.productHandle === selectedHandle) ??
    SAMPLE_SET_CONTENTS[0];
  const active =
    SAMPLE_SET_CONTENTS.find((item) => item.key === preview) ?? current;
  if (!current || !active) return null;

  const destination = (
    <Link
      href="/samples"
      className={styles.destination}
      data-sample-entry={treatment}
      data-sample-entry-point={`information-${treatment}`}
      aria-label={t("Explore the sample set")}
      aria-disabled={disabled || undefined}
      onClick={(event) => {
        if (disabled) event.preventDefault();
      }}
      onNavigate={(event) => {
        if (disabled) event.preventDefault();
      }}
    >
      <span>{t("Explore the set")}</span>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 19 19 5M5 5h14v14" />
      </svg>
    </Link>
  );

  if (treatment === "invitation") {
    return (
      <aside
        className={styles.entry}
        data-sample-right-treatment={treatment}
        aria-labelledby={id}
      >
        <div className={styles.invitationCopy}>
          <span className={styles.eyebrow}>{t("Start with samples")}</span>
          <h2 id={id}>{t("Find your matcha.")}</h2>
          <p className={styles.detail}>{t("Three matcha · 20 g each")}</p>
          {destination}
        </div>
        <div className={styles.fan} aria-hidden="true">
          <span className={styles.orbit} />
          {SAMPLE_SET_CONTENTS.map((item) => (
            <span className={styles.fanPiece} key={item.key}>
              <Powder item={item} />
            </span>
          ))}
        </div>
      </aside>
    );
  }

  if (treatment === "preparation") {
    return (
      <section
        className={styles.entry}
        data-sample-right-treatment={treatment}
        data-sample-preview-active={active.key}
        aria-labelledby={id}
      >
        <header className={styles.heading}>
          <span className={styles.eyebrow}>{t("Sample Set")}</span>
          <h2 id={id}>{t("Three ways to prepare.")}</h2>
        </header>
        <div className={styles.preparations}>
          <div
            className={styles.uses}
            role="group"
            aria-label={t("Preview the samples by preparation")}
          >
            {SAMPLE_SET_CONTENTS.map((item, index) => (
              <button
                key={item.key}
                type="button"
                data-sample-preview={item.key}
                aria-pressed={item.key === active.key}
                disabled={disabled}
                onClick={() => setPreview(item.key)}
                onFocus={() => {
                  if (!disabled) setPreview(item.key);
                }}
              >
                <span className={styles.index} aria-hidden="true">
                  0{index + 1}
                </span>
                <span>{t(item.application)}</span>
                <span className={styles.useIndicator} aria-hidden="true">
                  ↗
                </span>
              </button>
            ))}
          </div>
          <div className={styles.usePreview}>
            <div className={styles.useVisual} aria-hidden="true">
              {SAMPLE_SET_CONTENTS.map((item) => (
                <div
                  className={styles.usePowder}
                  data-active={item.key === active.key || undefined}
                  key={item.key}
                >
                  <Powder item={item} />
                </div>
              ))}
            </div>
            <p className={styles.previewCaption} aria-live="polite">
              <span>{t(active.name.replace(/ Matcha$/, ""))}</span>
              <span>20 g</span>
            </p>
          </div>
        </div>
        <footer className={styles.preparationFoot}>
          <div className={styles.detail}>
            <span>{t("All three included.")}</span>
            <span>{t("Three matcha · 20 g each")}</span>
          </div>
          {destination}
        </footer>
      </section>
    );
  }

  if (treatment === "alongside") {
    return (
      <aside
        className={styles.entry}
        data-sample-right-treatment={treatment}
        data-sample-selected={current.key}
        aria-labelledby={id}
      >
        <div className={styles.alongsideContext}>
          <span className={styles.eyebrow}>{t("Included in the set")}</span>
          <span className={styles.current}>
            <span aria-hidden="true">◇</span> {t(current.name)}
          </span>
        </div>
        <div className={styles.alongsideBody}>
          <div className={styles.alongsideMaterials} aria-hidden="true">
            {SAMPLE_SET_CONTENTS.map((item) => (
              <span
                className={styles.alongsidePiece}
                key={item.key}
                data-current={item.key === current.key || undefined}
              >
                <Powder item={item} />
              </span>
            ))}
          </div>
          <div className={styles.alongsideCopy}>
            <h2 id={id}>{t("Try it alongside the other two.")}</h2>
            <p className={styles.detail}>{t("Three matcha · 20 g each")}</p>
          </div>
        </div>
        {destination}
      </aside>
    );
  }

  return (
    <section
      className={styles.entry}
      data-sample-right-treatment={treatment}
      aria-labelledby={id}
    >
      <header className={styles.spotlightHeading}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>{t("Sample Set")}</span>
          <h2 id={id}>{t("Your starting point.")}</h2>
        </div>
        <span className={styles.measure}>3 × 20 g</span>
      </header>
      <ul className={styles.spotlightMaterials}>
        {SAMPLE_SET_CONTENTS.map((item, index) => (
          <li key={item.key}>
            <span className={styles.spotlightImage}>
              <span className={styles.sampleIndex} aria-hidden="true">
                0{index + 1}
              </span>
              <Powder item={item} />
            </span>
            <span className={styles.spotlightName}>
              {t(item.name.replace(/ Matcha$/, ""))}
            </span>
            <span className={styles.application}>{t(item.application)}</span>
          </li>
        ))}
      </ul>
      <div className={styles.spotlightFoot}>
        <p>{t("Compare in your own preparation.")}</p>
        {destination}
      </div>
    </section>
  );
}
