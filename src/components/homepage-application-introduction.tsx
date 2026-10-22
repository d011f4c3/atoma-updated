"use client";

import Link from "next/link";
import type { RefObject } from "react";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import type { ProductKey } from "@/lib/product-codes";
import { useCart } from "./cart-drawer";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./homepage-application-introduction.module.css";

const applications: Record<ProductKey, string> = {
  ceremonial: "Tea service",
  barista: "Lattes",
  culinary: "Recipes & baking",
};

export function HomepageApplicationIntroduction({
  exploring,
  onExplore,
  exploreRef,
}: {
  exploring: boolean;
  onExplore: () => void;
  exploreRef: RefObject<HTMLButtonElement | null>;
}) {
  const { t } = useStorefrontLocale();
  const { busy, navigationBusy } = useCart();

  return (
    <div className={styles.root} data-homepage-application-introduction>
      <p className={styles.eyebrow}>
        <span aria-hidden="true" />
        {t("MATCHA")}
      </p>
      <div className={styles.statement}>
        <h1 className={styles.heading}>
          {t("Matcha for the way you make it.")}
        </h1>
        <p className={styles.support}>
          {t("Japanese matcha for tea service, lattes and recipes.")}
        </p>
      </div>
      <div className={styles.actions}>
        <Link
          href="/samples"
          className={styles.primary}
          data-homepage-samples-entry
          aria-disabled={navigationBusy || undefined}
          onClick={(event) => {
            if (navigationBusy) event.preventDefault();
          }}
          onNavigate={(event) => {
            if (navigationBusy) event.preventDefault();
          }}
        >
          <span>{t("Start with the Sample Set")}</span>
          <span aria-hidden="true">↗</span>
        </Link>
        <p className={styles.contents}>{t("Three matcha · 20 g each")}</p>
        <button
          ref={exploreRef}
          type="button"
          className={styles.explore}
          data-homepage-application-explore
          aria-expanded={exploring}
          aria-controls="home-selection"
          disabled={busy}
          onClick={onExplore}
        >
          <span>{t("Explore by application")}</span>
          <span aria-hidden="true">→</span>
        </button>
        <nav className={styles.applications} aria-label={t("Application")}>
          {SAMPLE_SET_CONTENTS.map((item) => (
            <Link
              key={item.key}
              href={`/shop/${encodeURIComponent(item.productHandle)}`}
              data-homepage-application={item.key}
              aria-label={`${t(applications[item.key])} · ${t(item.name)}`}
              aria-disabled={navigationBusy || undefined}
              onClick={(event) => {
                if (navigationBusy) event.preventDefault();
              }}
              onNavigate={(event) => {
                if (navigationBusy) event.preventDefault();
              }}
            >
              {t(applications[item.key])}
              <span aria-hidden="true">↗</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
