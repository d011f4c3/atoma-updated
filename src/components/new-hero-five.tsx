"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { oneKilogramProductUrl } from "@/lib/sample-journey";
import { FIELD_ENTRIES } from "@/lib/origins-content";
import { useCart } from "./cart-drawer";
import { NewHeroApplicationHero } from "./new-hero-application-hero";
import { NewHeroProducts } from "./new-hero-products";
import { useOrigins } from "./origins-provider";
import { SampleSetPurchase, useSampleSetPurchase } from "./samples";
import { SampleFoilTrio } from "./sample-foil-trio";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useStorefrontTheme } from "./storefront-theme-provider";
import styles from "./new-hero-five.module.css";

export function NewHeroFive() {
  const { t } = useStorefrontLocale();
  const { tone } = useStorefrontTheme();
  const {
    navigationBusy,
    destinationReviewRequired,
    reviewRequired,
    openCart,
  } = useCart();
  const samplePurchase = useSampleSetPurchase("new-hero5");
  const { openOrigins } = useOrigins();
  const [originFailed, setOriginFailed] = useState(false);
  const field = FIELD_ENTRIES[0]!;
  function guardNavigation(event: MouseEvent<HTMLAnchorElement>) {
    if (navigationBusy) event.preventDefault();
  }
  const linkGuard = {
    "aria-disabled": navigationBusy || undefined,
    onClick: guardNavigation,
  } as const;

  return (
    <div
      className={styles.page}
      data-new-hero5
      data-tone={tone}
      data-storefront-theme={tone}
      data-client-reading
    >
      <main className={styles.main}>
        <NewHeroApplicationHero idPrefix="new-hero5" />
        <div className={styles.content} data-new-hero5-content>
          <section
            id="hero5-applications"
            className={styles.applications}
            data-new-hero5-section="applications"
            aria-labelledby="hero5-applications-heading"
            tabIndex={-1}
          >
            <header className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrow}>01 / {t("The matcha")}</p>
                <h2 id="hero5-applications-heading">
                  {t("Explore by Application")}
                </h2>
                <p className={styles.body}>
                  {t("Three matcha. Choose by what you make.")}
                </p>
              </div>
              <a
                href="#hero5-samples"
                className={styles.secondary}
                {...linkGuard}
              >
                {t("Not sure yet? Try all three.")}
                <span aria-hidden="true">↓</span>
              </a>
            </header>
            <NewHeroProducts
              presentation="gallery"
              idPrefix="new-hero5"
              selectionMemoryKey="new-hero5"
            />
          </section>

          <section
            id="hero5-samples"
            className={styles.samples}
            data-new-hero5-section="samples"
            aria-labelledby="hero5-samples-heading"
            tabIndex={-1}
          >
            <div className={styles.sampleContent}>
              <p className={styles.eyebrow}>02 / {t("The Sample Set")}</p>
              <h2 id="hero5-samples-heading">
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
                    <span>{t(item.name)}</span>
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
                  className={styles.secondary}
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
                headingId="hero5-sample-order"
                className={styles.samplePurchase}
              />
              <Link
                href="/samples"
                className={styles.secondary}
                data-new-hero5-sample-details
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
            className={styles.origin}
            data-new-hero5-section="origin"
            aria-labelledby="hero5-origin-heading"
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
                    sizes="(max-width: 760px) 100vw, 55vw"
                    onError={() => setOriginFailed(true)}
                  />
                )}
              </div>
              <figcaption>{t(field.imageCaption)}</figcaption>
            </figure>
            <div className={styles.originContent}>
              <p className={styles.eyebrow}>03 / {t("Product & origin")}</p>
              <h2 id="hero5-origin-heading">
                {t("Know what you’re choosing.")}
              </h2>
              <div className={styles.proofPoint}>
                <h3>{t("Growing origin")}</h3>
                <p>
                  {t(
                    "Our Ceremonial matcha is grown in Wazuka, part of the Uji tea-growing region in Kyoto Prefecture.",
                  )}
                </p>
                <a
                  href="/origins"
                  className={styles.secondary}
                  data-new-hero5-origin
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
              <div className={styles.proofPoint}>
                <h3>{t("Preparation & profile")}</h3>
                <p>
                  {t(
                    "Read the preparation guidance and product record for each matcha, then compare it in your own recipes.",
                  )}
                </p>
                <a
                  href="#hero5-applications"
                  className={styles.secondary}
                  {...linkGuard}
                >
                  {t("Explore the three matcha")}
                  <span aria-hidden="true">↑</span>
                </a>
              </div>
            </div>
          </section>

          <section
            className={styles.supply}
            data-new-hero5-section="supply"
            aria-labelledby="hero5-supply-heading"
          >
            <div className={styles.supplyIntroduction}>
              <p className={styles.eyebrow}>
                04 / {t("Wholesale & repeat orders")}
              </p>
              <h2 id="hero5-supply-heading">
                {t("From your first taste to your next order.")}
              </h2>
              <p className={styles.body}>
                {t(
                  "Find your matcha in a 1 kg format for service or production. Check current availability and quantity options on its product page.",
                )}
              </p>
            </div>
            <ol className={styles.orderSteps}>
              {[
                {
                  title: "Taste in your recipes",
                  copy: "Start with all three matcha in the Sample Set.",
                  href: "#hero5-samples",
                },
                {
                  title: "Choose your format",
                  copy: "See current prices, available formats and quantities with each product.",
                  href: "#hero5-applications",
                },
                {
                  title: "Return to your matcha",
                  copy: "Use the product name and code to find the same matcha for your next order.",
                  href: "#hero5-reorder",
                },
              ].map((step, index) => (
                <li key={step.href}>
                  <span className={styles.stepNumber} aria-hidden="true">
                    0{index + 1}
                  </span>
                  <h3>
                    <a href={step.href} {...linkGuard}>
                      {t(step.title)}{" "}
                      <span aria-hidden="true">{index === 2 ? "↓" : "↑"}</span>
                    </a>
                  </h3>
                  <p>{t(step.copy)}</p>
                </li>
              ))}
            </ol>
            <nav
              id="hero5-reorder"
              tabIndex={-1}
              className={styles.reorder}
              aria-label={t("Order your matcha again")}
            >
              {SAMPLE_SET_CONTENTS.map((item) => (
                <Link
                  key={item.key}
                  href={oneKilogramProductUrl(item.productHandle)!}
                  data-new-hero5-reorder={item.key}
                  {...linkGuard}
                >
                  <span className={styles.reorderCode}>
                    ◇ {item.productCode}
                  </span>
                  <span>
                    {t("View 1 kg of {name}", { name: t(item.name) })}
                  </span>
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
