"use client";

import { getProductApplicationImage } from "@/lib/product-application-imagery";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import {
  HERO_CX_APPLICATIONS,
  type HeroCxLayoutProps,
} from "./hero-cx-layout-types";
import { ProductApplicationImage } from "./product-application-image";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./hero-cx-directory.module.css";

export function HeroCxDirectory({
  selected,
  busy,
  headingRef,
  onChoose,
  onBack,
  actions,
}: HeroCxLayoutProps) {
  const { t } = useStorefrontLocale();

  return (
    <section
      className={styles.directory}
      data-cx-layout-directory
      aria-labelledby="cx-heading"
    >
      <header className={styles.heading}>
        <p className={styles.eyebrow}>{t("Explore by application")}</p>
        <h1 id="cx-heading" ref={headingRef} tabIndex={-1}>
          {t("What are you making?")}
        </h1>
        <p className={styles.description}>
          {t("Choose the application you want to explore.")}
        </p>
      </header>

      <div className={styles.rows}>
        {SAMPLE_SET_CONTENTS.map((item) => {
          const expanded = selected?.key === item.key;
          const reference = getProductApplicationImage(item.productHandle);
          const toggleId = `cx-directory-${item.key}`;
          const detailId = `${toggleId}-detail`;

          return (
            <article
              key={item.key}
              className={styles.row}
              data-cx-directory-row={item.key}
              data-expanded={expanded}
            >
              <div className={styles.rowHeader}>
                <button
                  id={toggleId}
                  type="button"
                  className={styles.rowToggle}
                  data-cx-choice={item.key}
                  data-cx-back={expanded ? "" : undefined}
                  aria-expanded={expanded}
                  aria-controls={expanded ? detailId : undefined}
                  disabled={busy}
                  onClick={() => (expanded ? onBack() : onChoose(item.key))}
                >
                  <span className={styles.rowCopy}>
                    <span className={styles.application}>
                      {t(HERO_CX_APPLICATIONS[item.key])}
                    </span>
                    <span className={styles.name}>{t(item.name)}</span>
                    <span className={styles.code}>◇ {item.productCode}</span>
                  </span>
                  <span className={styles.indicator} aria-hidden="true">
                    {expanded ? "−" : "+"}
                  </span>
                </button>

                <div className={styles.photograph}>
                  <ProductApplicationImage handle={item.productHandle} />
                </div>
              </div>

              {expanded && (
                <div
                  id={detailId}
                  className={styles.detail}
                  data-cx-product={item.key}
                  role="region"
                  aria-labelledby={toggleId}
                >
                  {reference && (
                    <p className={styles.usage}>{t(reference.usage)}</p>
                  )}
                  <div className={styles.actions}>{actions}</div>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {!selected && actions && (
        <div className={styles.alternative}>{actions}</div>
      )}
    </section>
  );
}
