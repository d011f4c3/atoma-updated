"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type MouseEvent } from "react";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { oneKilogramProductUrl } from "@/lib/sample-journey";
import { FIELD_ENTRIES } from "@/lib/origins-content";
import { useCart } from "./cart-drawer";
import { HomeHeader } from "./home-header";
import { NewHeroProducts } from "./new-hero-products";
import { SampleFoilTrio } from "./sample-foil-trio";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useStorefrontTheme } from "./storefront-theme-provider";
import styles from "./new-hero-three.module.css";

export function NewHeroThree() {
  const { t } = useStorefrontLocale();
  const { tone } = useStorefrontTheme();
  const { navigationBusy } = useCart();
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
      data-new-hero3
      data-tone={tone}
      data-storefront-theme={tone}
      data-client-reading
    >
      <HomeHeader tone={tone} persistentTheme initialMenuOpen={false} />
      <main className={styles.main}>
        <section
          className={styles.introduction}
          aria-labelledby="hero3-heading"
        >
          <p className={styles.eyebrow}>
            <span aria-hidden="true">◇</span>
            {t("For cafés, kitchens & food businesses")}
          </p>
          <h1 id="hero3-heading">{t("Matcha for the way you make it.")}</h1>
          <p className={styles.description}>
            {t("Japanese matcha selected for tea service, lattes and recipes.")}
          </p>
          <div className={styles.actions}>
            <Link
              href="/samples"
              className={styles.primary}
              data-new-hero3-samples
              {...linkGuard}
            >
              {t("Start with the Sample Set")}
              <span aria-hidden="true">↗</span>
            </Link>
            <a
              href="#hero3-applications"
              className={styles.secondary}
              data-new-hero3-explore
              {...linkGuard}
            >
              {t("Explore by Application")}
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        <section
          id="hero3-applications"
          className={styles.applications}
          data-new-hero3-section="applications"
          aria-labelledby="hero3-applications-heading"
          tabIndex={-1}
        >
          <header className={styles.sectionHeader}>
            <h2 id="hero3-applications-heading">01 / {t("The matcha")}</h2>
            <p>{t("Three matcha. Choose by what you make.")}</p>
          </header>
          <NewHeroProducts presentation="counter" idPrefix="new-hero3" />
        </section>

        <section
          className={styles.samples}
          data-new-hero3-section="samples"
          aria-labelledby="hero3-samples-heading"
        >
          <div className={styles.sampleContent}>
            <p className={styles.eyebrow}>02 / {t("The Sample Set")}</p>
            <h2 id="hero3-samples-heading">
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
            <Link href="/samples" className={styles.primary} {...linkGuard}>
              {t("Start with the Sample Set")}
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className={styles.sampleVisual}>
            <SampleFoilTrio contained disabled={navigationBusy} />
          </div>
        </section>

        <section
          className={styles.origin}
          data-new-hero3-section="origin"
          aria-labelledby="hero3-origin-heading"
        >
          <header className={styles.chapterHeader}>
            <p className={styles.eyebrow}>03 / {t("Product & origin")}</p>
            <h2 id="hero3-origin-heading">{t("Know what you’re choosing.")}</h2>
          </header>
          <div className={styles.originGrid}>
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
                    sizes="(max-width: 760px) 100vw, 33vw"
                    onError={() => setOriginFailed(true)}
                  />
                )}
              </div>
              <figcaption>{t(field.imageCaption)}</figcaption>
            </figure>
            <div className={styles.proofPoint}>
              <h3>{t("Growing origin")}</h3>
              <p>
                {t(
                  "Our Ceremonial matcha is grown in Wazuka, part of the Uji tea-growing region in Kyoto Prefecture.",
                )}
              </p>
              <Link href="/origins" className={styles.secondary} {...linkGuard}>
                {t("Explore Origins")}
                <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className={styles.proofPoint}>
              <h3>{t("Preparation & profile")}</h3>
              <p>
                {t(
                  "Read the preparation guidance and product record for each matcha, then compare it in your own recipes.",
                )}
              </p>
              <a
                href="#hero3-applications"
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
          data-new-hero3-section="supply"
          aria-labelledby="hero3-supply-heading"
        >
          <div className={styles.supplyIntroduction}>
            <p className={styles.eyebrow}>
              04 / {t("Wholesale & repeat orders")}
            </p>
            <h2 id="hero3-supply-heading">
              {t("From your first taste to your next order.")}
            </h2>
            <p className={styles.body}>
              {t(
                "Find your matcha in a 1 kg format for service or production. Check current availability and quantity options on its product page.",
              )}
            </p>
          </div>
          <nav
            className={styles.reorder}
            aria-label={t("Order your matcha again")}
          >
            {SAMPLE_SET_CONTENTS.map((item) => (
              <Link
                key={item.key}
                href={oneKilogramProductUrl(item.productHandle)!}
                data-new-hero3-reorder={item.key}
                {...linkGuard}
              >
                <span className={styles.reorderCode}>◇ {item.productCode}</span>
                <span>{t("View 1 kg of {name}", { name: t(item.name) })}</span>
                <span aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>
        </section>
      </main>
    </div>
  );
}
