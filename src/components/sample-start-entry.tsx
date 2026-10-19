"use client";

import Link from "next/link";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import type { SampleOrderLayout } from "@/lib/sample-order-layouts";
import type { SampleMobileLayout } from "@/lib/sample-mobile-layouts";
import { SampleOrderPanel } from "./sample-order-panel";
import { ShopMaterialImage } from "./shop-material-image";
import { SampleFoilTrio } from "./sample-foil-trio";
import { SampleSetPurchase, useSampleSetPurchase } from "./samples";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./sample-start-entry.module.css";

export function SampleStartEntry({
  disabled,
  packagesOnMobile = false,
  studyLayout,
  sampleMobileLayout,
}: {
  disabled: boolean;
  packagesOnMobile?: boolean;
  studyLayout?: SampleOrderLayout;
  sampleMobileLayout?: SampleMobileLayout;
}) {
  const { t } = useStorefrontLocale();
  const purchase = useSampleSetPurchase();
  const locked = disabled || purchase.locked;
  if (studyLayout) {
    return (
      <SampleOrderPanel
        layout={studyLayout}
        purchase={purchase}
        disabled={disabled}
        packagesOnMobile={packagesOnMobile}
        sampleMobileLayout={sampleMobileLayout}
      />
    );
  }
  return (
    <section
      className={styles.entry}
      data-sample-start-entry
      data-mobile-packages={packagesOnMobile || undefined}
      aria-labelledby="sample-start-heading"
    >
      <header className={styles.heading}>
        <span>{t("Start with samples")}</span>
        <h2 id="sample-start-heading" tabIndex={-1}>
          {t("Sample Set")}
        </h2>
        <p>{t("Three matcha · 20 g each")}</p>
      </header>
      {packagesOnMobile && (
        <div className={styles.mobilePackages}>
          <SampleFoilTrio disabled={locked} compact />
        </div>
      )}
      <ul className={styles.contents}>
        {SAMPLE_SET_CONTENTS.map((item) => (
          <li key={item.key}>
            <div className={styles.material} aria-hidden="true">
              <ShopMaterialImage src={item.image} alt="" />
            </div>
            <span className={styles.name}>
              {t(item.name.replace(/ Matcha$/, ""))}
            </span>
            <span className={styles.use}>{t(item.application)}</span>
          </li>
        ))}
      </ul>
      <div className={styles.summary}>
        <span>{t("All three included.")}</span>
        <span>{t("60 g total")}</span>
      </div>
      <SampleSetPurchase
        purchase={purchase}
        presentation="entry"
        headingId="sample-start-purchase"
        disabled={disabled}
      />
      <div className={styles.progression}>
        <span>{t("Try 20 g → Choose 1 kg → Reorder")}</span>
        <Link
          href="/samples#samples-next"
          aria-disabled={locked || undefined}
          onClick={(event) => {
            if (locked) event.preventDefault();
          }}
          onNavigate={(event) => {
            if (locked) event.preventDefault();
          }}
        >
          {t("After your samples")} <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <Link
        className={styles.action}
        href="/samples"
        aria-disabled={locked || undefined}
        onClick={(event) => {
          if (locked) event.preventDefault();
        }}
        onNavigate={(event) => {
          if (locked) event.preventDefault();
        }}
        data-sample-entry="start"
        data-sample-entry-point="information-start"
      >
        <span>{t("Explore the sample set")}</span>
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 19 19 5M5 5h14v14" />
        </svg>
      </Link>
      <noscript>
        <style>{`[data-sample-start-entry] [data-pending="true"] img { opacity: 1 !important; }`}</style>
      </noscript>
    </section>
  );
}
