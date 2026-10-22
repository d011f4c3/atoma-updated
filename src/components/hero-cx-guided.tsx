"use client";

import { getProductApplicationImage } from "@/lib/product-application-imagery";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import {
  HERO_CX_APPLICATIONS,
  type HeroCxLayoutProps,
} from "./hero-cx-layout-types";
import { ProductApplicationImage } from "./product-application-image";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./hero-cx-guided.module.css";

export function HeroCxGuided({
  selected,
  selectedKey,
  busy,
  headingRef,
  onChoose,
  onBack,
  actions,
  sampleAction,
}: HeroCxLayoutProps) {
  const { t } = useStorefrontLocale();
  const reference = selected
    ? getProductApplicationImage(selected.productHandle)
    : undefined;

  return (
    <section
      className={styles.guided}
      data-cx-layout-guided
      data-result={Boolean(selected)}
      aria-labelledby="cx-heading"
    >
      <ol className={styles.progress} data-cx-guided-progress>
        <li aria-current={!selected ? "step" : undefined}>
          <span>01</span> {t("Application")}
        </li>
        <li aria-current={selected ? "step" : undefined}>
          <span>02</span> {t("Your matcha")}
        </li>
      </ol>

      <header className={styles.heading}>
        <p className={styles.eyebrow}>
          {t(selected ? HERO_CX_APPLICATIONS[selected.key] : "Japanese matcha")}
        </p>
        <h1 id="cx-heading" ref={headingRef} tabIndex={-1}>
          {selected ? t(selected.name) : t("What are you making?")}
        </h1>
        <p
          className={styles.description}
          data-cx-choice-explanation={selected ? selected.key : undefined}
          data-cx-product-usage={selected ? "" : undefined}
        >
          {selected
            ? t(reference?.usage ?? HERO_CX_APPLICATIONS[selected.key])
            : t("Choose an application to find your matcha.")}
        </p>
        {selected && <p className={styles.code}>◇ {selected.productCode}</p>}
      </header>

      {selected ? (
        <div className={styles.resultSheet} data-cx-product={selected.key}>
          <div className={styles.nextStep}>
            <p className={styles.sampleExplanation} data-cx-sample-explanation>
              {t(
                "The Sample Set includes all three matcha. Compare them in your own recipes, then choose your 1 kg matcha.",
              )}
            </p>
            <div className={styles.actions}>{actions}</div>
            <button
              type="button"
              className={styles.back}
              data-cx-back
              disabled={busy}
              onClick={onBack}
            >
              ← {t("Change application")}
            </button>
          </div>
          <div className={styles.photograph}>
            <ProductApplicationImage
              handle={selected.productHandle}
              presentation="retail"
            />
          </div>
        </div>
      ) : (
        <>
          <div className={styles.choices} data-count="3">
            {SAMPLE_SET_CONTENTS.map((item, index) => (
              <button
                type="button"
                key={item.key}
                className={styles.choice}
                data-cx-choice={item.key}
                aria-pressed={selectedKey === item.key}
                disabled={busy}
                onClick={() => onChoose(item.key)}
              >
                <span className={styles.choiceIndex}>0{index + 1}</span>
                <span className={styles.choiceCopy}>
                  <span className={styles.choiceLabel}>
                    {t(HERO_CX_APPLICATIONS[item.key])}
                  </span>
                  <span className={styles.choiceProduct}>{t(item.name)}</span>
                </span>
                <span aria-hidden="true">
                  {selectedKey === item.key ? "✓" : "→"}
                </span>
              </button>
            ))}
          </div>
          <div className={styles.sampleEntry} data-cx-guided-sample-entry>
            <p>{t("Try all three before choosing your 1 kg matcha.")}</p>
            {sampleAction}
          </div>
        </>
      )}
    </section>
  );
}
