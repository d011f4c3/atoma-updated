"use client";

import Link from "next/link";
import { useId } from "react";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { useCart } from "./cart-drawer";
import { ShopMaterialImage } from "./shop-material-image";
import { useStorefrontLocale } from "./storefront-locale-provider";
import {
  SamplePriorityEntry,
  type SamplePriorityTreatment,
} from "./sample-priority-entry";
import styles from "./sample-right-entry.module.css";

export type SampleRightTreatment =
  "folio" | "companion" | "compare" | SamplePriorityTreatment;

/** Study-only right-side entrances. The Samples page remains the offer owner. */
export function SampleRightEntry({
  treatment,
  selectedHandle,
  disabled = false,
}: {
  treatment: SampleRightTreatment;
  selectedHandle?: string;
  disabled?: boolean;
}) {
  const { t } = useStorefrontLocale();
  const { busy } = useCart();
  const id = useId();
  const locked = disabled || busy;
  if (
    treatment === "invitation" ||
    treatment === "preparation" ||
    treatment === "alongside" ||
    treatment === "spotlight"
  ) {
    return (
      <SamplePriorityEntry
        treatment={treatment}
        selectedHandle={selectedHandle}
        disabled={locked}
      />
    );
  }
  const destination = (
    <Link
      href="/samples"
      className={styles.destination}
      data-sample-entry={treatment}
      data-sample-entry-point={`information-${treatment}`}
      aria-label={t("Explore the sample set")}
      aria-disabled={locked || undefined}
      onClick={(event) => {
        if (locked) event.preventDefault();
      }}
      onNavigate={(event) => {
        if (locked) event.preventDefault();
      }}
    >
      <span>{t("Explore the set")}</span>
      <span className={styles.arrow} aria-hidden="true">
        ↗
      </span>
    </Link>
  );
  const materials = (
    <span className={styles.materials} aria-hidden="true">
      {SAMPLE_SET_CONTENTS.map((item) => (
        <span className={styles.material} key={item.key}>
          <ShopMaterialImage src={item.image} alt="" showWhilePreparing />
        </span>
      ))}
    </span>
  );

  if (treatment === "companion") {
    return (
      <aside
        className={styles.entry}
        data-sample-right-treatment={treatment}
        aria-labelledby={id}
      >
        {materials}
        <div className={styles.copy}>
          <h2 id={id}>{t("Sample Set")}</h2>
          <p>{t("Three matcha · 20 g each")}</p>
        </div>
        {destination}
      </aside>
    );
  }

  if (treatment === "compare") {
    return (
      <details
        className={styles.entry}
        data-sample-right-treatment={treatment}
        onKeyDown={(event) => {
          if (event.key === "Escape" && event.currentTarget.open) {
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
            event.stopPropagation();
          }
        }}
      >
        <summary
          className={styles.summary}
          aria-disabled={locked || undefined}
          onClick={(event) => {
            if (locked) event.preventDefault();
          }}
        >
          {materials}
          <span className={styles.copy}>
            <span className={styles.title}>{t("Sample Set")}</span>
            <span className={styles.detail}>{t("See what's included")}</span>
          </span>
          <span className={styles.toggle} aria-hidden="true" />
        </summary>
        <div className={styles.comparison}>
          <ul className={styles.rows}>
            {SAMPLE_SET_CONTENTS.map((item) => (
              <li
                key={item.key}
                data-selected={
                  item.productHandle === selectedHandle || undefined
                }
              >
                <span className={styles.rowImage} aria-hidden="true">
                  <ShopMaterialImage
                    src={item.image}
                    alt=""
                    showWhilePreparing
                  />
                </span>
                <span className={styles.rowCopy}>
                  <span>{t(item.name)}</span>
                  <span>{t(item.application)}</span>
                </span>
                <span className={styles.amount}>20 g</span>
              </li>
            ))}
          </ul>
          <div className={styles.comparisonFoot}>
            <span>{t("60 g total")}</span>
            {destination}
          </div>
        </div>
      </details>
    );
  }

  return (
    <section
      className={styles.entry}
      data-sample-right-treatment={treatment}
      aria-labelledby={id}
    >
      <div className={styles.folioHead}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>{t("Start with samples")}</span>
          <h2 id={id}>
            {t("Three matcha.")} {t("One starting point.")}
          </h2>
        </div>
        <span className={styles.total}>{t("60 g total")}</span>
      </div>
      <ul className={styles.specimens}>
        {SAMPLE_SET_CONTENTS.map((item) => (
          <li key={item.key}>
            <span className={styles.folioImage} aria-hidden="true">
              <ShopMaterialImage src={item.image} alt="" showWhilePreparing />
            </span>
            <span>{t(item.name.replace(/ Matcha$/, ""))}</span>
            <span className={styles.amount}>20 g</span>
          </li>
        ))}
      </ul>
      {destination}
    </section>
  );
}
