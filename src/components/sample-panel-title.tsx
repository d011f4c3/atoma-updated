"use client";

import type { Ref } from "react";
import type { SampleTitleTreatment } from "@/lib/sample-title-treatments";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./sample-panel-title.module.css";

export function SamplePanelTitle({
  treatment,
  compact = false,
  headingId,
  headingRef,
}: {
  treatment: SampleTitleTreatment;
  compact?: boolean;
  headingId?: string;
  headingRef?: Ref<HTMLHeadingElement>;
}) {
  const { t } = useStorefrontLocale();
  const name = t("Sample Set");
  return (
    <header
      className={styles.title}
      data-sample-title={treatment}
      data-compact={compact || undefined}
    >
      {treatment === "current" && (
        <p className={styles.eyebrow}>ATOMA / {t("Samples")}</p>
      )}
      {treatment === "register" && (
        <span className={styles.diamond} aria-hidden="true" />
      )}
      {treatment === "quantity" && <p className={styles.quantity}>3 × 20 g</p>}
      <h2
        className={styles.name}
        id={headingId}
        ref={headingRef}
        tabIndex={headingRef ? -1 : undefined}
      >
        {name}
      </h2>
      <p className={styles.specification}>
        {treatment !== "quantity" && <span>3 × 20 g</span>}
        <span className={styles.total}>{t("60 g total")}</span>
      </p>
    </header>
  );
}
