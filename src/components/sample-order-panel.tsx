"use client";

import { useId, useRef, useState } from "react";
import type { SampleMobileLayout } from "@/lib/sample-mobile-layouts";
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
  sampleMobileLayout,
}: {
  layout: SampleOrderLayout;
  purchase: ReturnType<typeof useSampleSetPurchase>;
  disabled: boolean;
  packagesOnMobile?: boolean;
  sampleMobileLayout?: SampleMobileLayout;
}) {
  const { t } = useStorefrontLocale();
  const locked = disabled || purchase.locked;
  const id = useId();
  const [view, setView] = useState<"overview" | "contents" | "order">(
    "overview",
  );
  const [orderOpen, setOrderOpen] = useState(false);
  const orderViewButton = useRef<HTMLButtonElement>(null);
  const activeLayout = packagesOnMobile ? sampleMobileLayout : undefined;
  const mobileLayout = activeLayout ?? "current";
  const alternative = mobileLayout !== "current";
  const tabbed = mobileLayout === "tabs";
  const purchaseHidden =
    (tabbed && view !== "order") || (mobileLayout === "reveal" && !orderOpen);
  const contentsHidden = tabbed
    ? view !== "contents"
    : alternative || layout === "purchase";
  const summaryHidden = !alternative || (tabbed && view !== "overview");

  function openOrder() {
    if (locked) return;
    setView("order");
    orderViewButton.current?.focus({ preventScroll: true });
  }

  return (
    <section
      className={styles.panel}
      data-sample-start-entry
      data-sample-order-panel
      data-layout={layout}
      data-sample-mobile-layout={activeLayout}
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
        <p className={styles.introduction} hidden={alternative}>
          {t(
            "Compare flavour and texture in your own drinks and recipes. Your set includes ¥4,500 credit toward your first eligible wholesale order of 1 kg or more.",
          )}
        </p>
      </header>
      <div
        className={styles.mobileViews}
        role="group"
        aria-label={t("Sample Set view")}
        data-sample-mobile-nav
        hidden={!tabbed}
        inert={!tabbed}
      >
        {(
          [
            ["overview", "Overview"],
            ["contents", "In the set"],
            ["order", "Order"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            ref={value === "order" ? orderViewButton : undefined}
            type="button"
            data-sample-mobile-view={value}
            aria-pressed={view === value}
            aria-controls={`${id}-${value}`}
            disabled={locked}
            onClick={() => {
              if (!locked) setView(value);
            }}
          >
            {t(label)}
          </button>
        ))}
      </div>
      <div
        id={`${id}-overview`}
        className={styles.mobileSummary}
        data-sample-mobile-overview
        hidden={summaryHidden}
        inert={summaryHidden}
      >
        <p>{t("Try three matcha in your own recipes.")}</p>
        <p className={styles.mobileCredit}>
          {t(
            "¥4,500 credit toward your first eligible wholesale order of 1 kg or more.",
          )}
        </p>
        <button
          type="button"
          className={styles.mobileOrderAction}
          data-sample-mobile-open-order
          aria-controls={`${id}-order`}
          hidden={!tabbed}
          disabled={locked}
          onClick={openOrder}
        >
          <span>{t("Order the set")}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <div
        id={`${id}-contents`}
        className={styles.overview}
        data-sample-mobile-contents
        hidden={contentsHidden}
        inert={contentsHidden}
      >
        <SetContents numbered={layout === "index" || tabbed} />
      </div>
      <button
        type="button"
        className={styles.mobileReveal}
        data-sample-mobile-reveal
        aria-expanded={orderOpen}
        aria-controls={`${id}-order`}
        hidden={mobileLayout !== "reveal"}
        disabled={locked}
        onClick={() => {
          if (!locked) setOrderOpen((open) => !open);
        }}
      >
        <span>{t(orderOpen ? "Close order" : "Order the set")}</span>
        <span aria-hidden="true">{orderOpen ? "−" : "+"}</span>
      </button>
      {/* Keep the real order surface mounted while its surrounding layout changes. */}
      <div
        id={`${id}-order`}
        className={styles.purchasePane}
        data-sample-mobile-purchase
        hidden={purchaseHidden}
        inert={purchaseHidden}
      >
        <SampleSetPurchase
          purchase={purchase}
          presentation="study"
          headingId="sample-start-purchase"
          showValueNote={false}
          disabled={disabled}
        />
      </div>
      <details
        className={styles.included}
        hidden={alternative || layout !== "purchase"}
      >
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
