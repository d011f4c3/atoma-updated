"use client";

import type { SampleOrderLayout } from "@/lib/sample-order-layouts";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { SampleFoilTrio } from "./sample-foil-trio";
import { SampleSetDetails } from "./sample-set-details";
import { SampleSetPurchase, type useSampleSetPurchase } from "./samples";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./sample-order-panel.module.css";

function SetContents({ numbered = false }: { numbered?: boolean }) {
  const { t } = useStorefrontLocale();
  return (
    <ul className={styles.contents} data-numbered={numbered || undefined}>
      {SAMPLE_SET_CONTENTS.map((item, index) => (
        <li key={item.key}>
          <span className={styles.number} aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className={styles.identity}>
            <span className={styles.name}>
              {t(item.name.replace(/ Matcha$/, ""))}
            </span>
            <span className={styles.use}>{t(item.application)}</span>
          </span>
          <span className={styles.weight}>{item.grams} g</span>
        </li>
      ))}
    </ul>
  );
}

export function SampleOrderPanel({
  layout,
  purchase,
  disabled,
  packagesOnMobile = false,
}: {
  layout: SampleOrderLayout;
  purchase: ReturnType<typeof useSampleSetPurchase>;
  disabled: boolean;
  packagesOnMobile?: boolean;
}) {
  const { t } = useStorefrontLocale();
  const locked = disabled || purchase.locked;

  return (
    <section
      className={styles.panel}
      data-sample-start-entry
      data-sample-order-panel
      data-layout={layout}
      aria-labelledby="sample-start-heading"
    >
      {packagesOnMobile && (
        <div className={styles.mobilePackages}>
          <SampleFoilTrio disabled={locked} compact />
        </div>
      )}
      <header className={styles.heading}>
        <span className={styles.eyebrow}>{t("Start with samples")}</span>
        <div className={styles.titleLine}>
          <h2 id="sample-start-heading" tabIndex={-1}>
            {t("Sample Set")}
          </h2>
          <span className={styles.measure}>3 × 20 g</span>
        </div>
        <p className={styles.introduction}>
          {t(
            "Compare flavour and texture in your own drinks and recipes. Your set includes ¥4,500 credit toward your first eligible wholesale order of 1 kg or more.",
          )}
        </p>
      </header>
      <div className={styles.overview} hidden={layout === "purchase"}>
        <SetContents numbered={layout === "index"} />
      </div>
      {/* Keep the real order surface mounted while its surrounding study changes. */}
      <SampleSetPurchase
        purchase={purchase}
        presentation="study"
        headingId="sample-start-purchase"
        showValueNote={false}
        disabled={disabled}
      />
      <details className={styles.included} hidden={layout !== "purchase"}>
        <summary>
          {t("See what's included")}
          <span aria-hidden="true" />
        </summary>
        <SetContents numbered />
      </details>
      <SampleSetDetails className={styles.detailsLink} disabled={locked} />
    </section>
  );
}
