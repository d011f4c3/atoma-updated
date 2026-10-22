"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { FIELD_ENTRIES } from "@/lib/origins-content";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { oneKilogramProductUrl } from "@/lib/sample-journey";
import { useCart } from "./cart-drawer";
import { NewHeroApplicationHero } from "./new-hero-application-hero";
import { NewHeroProducts } from "./new-hero-products";
import { useOrigins } from "./origins-provider";
import { SampleFoilTrio } from "./sample-foil-trio";
import { SampleSetPurchase, useSampleSetPurchase } from "./samples";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useStorefrontTheme } from "./storefront-theme-provider";
import heroStyles from "./new-hero-five.module.css";
import styles from "./new-hero-six.module.css";

export function NewHeroSix() {
  const { t } = useStorefrontLocale();
  const { tone } = useStorefrontTheme();
  const {
    navigationBusy,
    destinationReviewRequired,
    reviewRequired,
    openCart,
  } = useCart();
  const samplePurchase = useSampleSetPurchase("new-hero6");
  const { openOrigins } = useOrigins();
  const [originFailed, setOriginFailed] = useState(false);
  const field = FIELD_ENTRIES[0]!;
  const ceremonial = SAMPLE_SET_CONTENTS.find(
    (item) => item.key === "ceremonial",
  )!;

  function guardNavigation(event: MouseEvent<HTMLAnchorElement>) {
    if (navigationBusy) event.preventDefault();
  }
  const linkGuard = {
    "aria-disabled": navigationBusy || undefined,
    onClick: guardNavigation,
  } as const;

  return (
    <div
      className={heroStyles.page}
      data-new-hero6
      data-tone={tone}
      data-storefront-theme={tone}
      data-client-reading
    >
      <main className={heroStyles.main}>
        <NewHeroApplicationHero idPrefix="new-hero6" />
        <div className={styles.content} data-new-hero6-content>
          <section
            id="hero6-applications"
            className={styles.applications}
            data-new-hero6-section="applications"
            aria-labelledby="hero6-applications-heading"
            tabIndex={-1}
          >
            <header className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrow}>01 / {t("The matcha")}</p>
                <h2 id="hero6-applications-heading">
                  {t("Explore by Application")}
                </h2>
                <p className={styles.body}>
                  {t("Three matcha. Choose by what you make.")}
                </p>
              </div>
              <a
                href="#hero6-samples"
                className={styles.textLink}
                {...linkGuard}
              >
                {t("Not sure yet? Try all three.")}
                <span aria-hidden="true">↓</span>
              </a>
            </header>
            <NewHeroProducts
              presentation="gallery"
              idPrefix="new-hero6"
              selectionMemoryKey="new-hero6"
            />
          </section>

          <section
            id="hero6-samples"
            className={styles.samples}
            data-new-hero6-section="samples"
            aria-labelledby="hero6-samples-heading"
            tabIndex={-1}
          >
            <div className={styles.sampleIntroduction}>
              <p className={styles.eyebrow}>02 / {t("The Sample Set")}</p>
              <h2 id="hero6-samples-heading">
                {t("Try all three. Find your matcha.")}
              </h2>
              <p className={styles.body}>
                {t(
                  "Compare the three matcha in your own drinks and recipes before choosing a larger format.",
                )}
              </p>
              <ul className={styles.contents}>
                {SAMPLE_SET_CONTENTS.map((item) => (
                  <li key={item.key}>
                    <span className={styles.contentName}>{t(item.name)}</span>
                    <span>{item.grams} g</span>
                  </li>
                ))}
              </ul>
              <p className={styles.sampleSummary}>
                <span>{t("All three included.")}</span>
                <span>{t("60 g total")}</span>
              </p>
            </div>
            <div className={styles.sampleOrder}>
              {(destinationReviewRequired || reviewRequired) && (
                <button
                  className={styles.textLink}
                  type="button"
                  disabled={navigationBusy}
                  onClick={openCart}
                >
                  {t(
                    destinationReviewRequired
                      ? "Confirm country"
                      : "Refresh selection",
                  )}
                </button>
              )}
              <SampleSetPurchase
                purchase={samplePurchase}
                presentation="entry"
                showValueNote={false}
                headingId="hero6-sample-order"
                className={heroStyles.samplePurchase}
              />
              <Link
                href="/samples"
                className={styles.textLink}
                data-new-hero6-sample-details
                {...linkGuard}
              >
                {t("Sample Set details")}
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className={styles.sampleVisual}>
              <SampleFoilTrio contained disabled={navigationBusy} />
            </div>
          </section>

          <section
            id="hero6-origin"
            className={styles.origin}
            data-new-hero6-section="origin"
            aria-labelledby="hero6-origin-heading"
            tabIndex={-1}
          >
            <figure className={styles.originFigure}>
              <div className={styles.originImage}>
                {originFailed ? (
                  <p className={styles.imageFallback}>
                    {t("Image unavailable.")}
                  </p>
                ) : (
                  <Image
                    src={field.image}
                    alt={t(field.imageAlt)}
                    fill
                    sizes="(max-width: 900px) 100vw, 65vw"
                    onError={() => setOriginFailed(true)}
                  />
                )}
              </div>
              <figcaption>{t(field.imageCaption)}</figcaption>
            </figure>
            <div className={styles.originNotes}>
              <p className={styles.eyebrow}>03 / {t("Product & origin")}</p>
              <h2 id="hero6-origin-heading">
                {t("Know what you’re choosing.")}
              </h2>
              <div className={styles.proofPoint}>
                <span className={styles.recordCode}>
                  ◇ {ceremonial.productCode}
                </span>
                <p className={styles.body}>
                  {t(
                    "Our Ceremonial matcha is grown in Wazuka, part of the Uji tea-growing region in Kyoto Prefecture.",
                  )}
                </p>
                <a
                  href="/origins"
                  className={styles.textLink}
                  data-new-hero6-origin
                  aria-haspopup="dialog"
                  aria-disabled={navigationBusy || undefined}
                  onClick={(event) => {
                    if (navigationBusy) {
                      event.preventDefault();
                      return;
                    }
                    if (
                      event.metaKey ||
                      event.ctrlKey ||
                      event.shiftKey ||
                      event.altKey ||
                      event.button !== 0
                    )
                      return;
                    event.preventDefault();
                    openOrigins({
                      tone,
                      placeId: "wazuka",
                      returnLabel: "Return to matcha",
                    });
                  }}
                >
                  {t("Explore Origins")}
                  <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </section>

          <section
            id="hero6-supply"
            className={styles.supply}
            data-new-hero6-section="supply"
            aria-labelledby="hero6-supply-heading"
            tabIndex={-1}
          >
            <div className={styles.supplyIntroduction}>
              <p className={styles.eyebrow}>
                04 / {t("Wholesale & repeat orders")}
              </p>
              <h2 id="hero6-supply-heading">
                {t("Your next order, made simple.")}
              </h2>
              <p className={styles.body}>
                {t(
                  "Find your matcha in a 1 kg format for service or production. Check current availability and quantity options on its product page.",
                )}
              </p>
            </div>
            <nav
              id="hero6-reorder"
              tabIndex={-1}
              className={styles.reorder}
              aria-label={t("Order your matcha again")}
            >
              {SAMPLE_SET_CONTENTS.map((item) => (
                <Link
                  key={item.key}
                  href={oneKilogramProductUrl(item.productHandle)!}
                  data-new-hero6-reorder={item.key}
                  aria-label={t("View 1 kg of {name}", { name: t(item.name) })}
                  {...linkGuard}
                >
                  <span className={styles.reorderIdentity}>
                    <span className={styles.recordCode}>
                      ◇ {item.productCode}
                    </span>
                    <span>{t(item.name)}</span>
                  </span>
                  <span className={styles.formatTag}>1 kg</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              ))}
            </nav>
          </section>
        </div>
      </main>
    </div>
  );
}
