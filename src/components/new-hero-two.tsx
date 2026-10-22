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
import styles from "./new-hero-two.module.css";

const applications = {
  ceremonial: "Tea service",
  barista: "Lattes",
  culinary: "Recipes & baking",
} as const;

export function NewHeroTwo() {
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
      data-new-hero2
      data-tone={tone}
      data-storefront-theme={tone}
      data-client-reading
    >
      <HomeHeader tone={tone} persistentTheme initialMenuOpen={false} />
      <main className={styles.main}>
        <div className={styles.desk}>
          <section
            className={styles.introduction}
            aria-labelledby="hero2-heading"
          >
            <p className={styles.eyebrow}>
              <span aria-hidden="true">◇</span>
              {t("For cafés, kitchens & food businesses")}
            </p>
            <h1 id="hero2-heading">{t("Matcha for the way you make it.")}</h1>
            <p className={styles.description}>
              {t(
                "Japanese matcha selected for tea service, lattes and recipes.",
              )}
            </p>
            <div className={styles.actions}>
              <Link
                href="/samples"
                className={styles.primary}
                data-new-hero2-samples
                {...linkGuard}
              >
                {t("Start with the Sample Set")}
                <span aria-hidden="true">↗</span>
              </Link>
              <a
                href="#hero2-applications"
                className={styles.secondary}
                data-new-hero2-explore
                {...linkGuard}
              >
                {t("Explore by Application")}
                <span aria-hidden="true">↓</span>
              </a>
            </div>
            <nav
              className={styles.index}
              aria-label={t("Explore the three matcha")}
            >
              {SAMPLE_SET_CONTENTS.map((item, index) => (
                <a
                  key={item.key}
                  href={`#new-hero2-${item.key}`}
                  data-new-hero2-jump={item.key}
                  {...linkGuard}
                >
                  <span className={styles.indexNumber} aria-hidden="true">
                    0{index + 1}
                  </span>
                  <span>{t(applications[item.key])}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </nav>
            <div className={styles.materialMarks} aria-hidden="true">
              <Image
                src="/images/samples/study/powder-landscape.png"
                alt=""
                width={1254}
                height={1254}
                sizes="320px"
              />
              <div>
                {SAMPLE_SET_CONTENTS.map((item) => (
                  <span key={item.key}>◇ {item.productCode}</span>
                ))}
              </div>
            </div>
          </section>

          <section
            id="hero2-applications"
            className={styles.applications}
            data-new-hero2-section="applications"
            aria-labelledby="hero2-applications-heading"
            tabIndex={-1}
          >
            <header className={styles.catalogHeading}>
              <h2 id="hero2-applications-heading">
                {t("Explore by Application")}
              </h2>
              <p>{t("Three matcha. Choose by what you make.")}</p>
            </header>
            <NewHeroProducts presentation="rows" idPrefix="new-hero2" />
          </section>
        </div>

        <section
          className={styles.sampleBand}
          data-new-hero2-section="samples"
          aria-labelledby="hero2-samples-heading"
        >
          <div className={styles.sampleIntroduction}>
            <p className={styles.eyebrow}>02 / {t("The Sample Set")}</p>
            <h2 id="hero2-samples-heading">
              {t("Try all three. Find your matcha.")}
            </h2>
            <p className={styles.body}>
              {t(
                "Compare the three matcha in your own drinks and recipes before choosing a larger format.",
              )}
            </p>
          </div>
          <div className={styles.sampleVisual}>
            <SampleFoilTrio contained disabled={navigationBusy} />
          </div>
          <div className={styles.sampleOrder}>
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
        </section>

        <section
          className={styles.origin}
          data-new-hero2-section="origin"
          aria-labelledby="hero2-origin-heading"
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
                  sizes="(max-width: 760px) 100vw, 50vw"
                  onError={() => setOriginFailed(true)}
                />
              )}
            </div>
            <figcaption>{t(field.imageCaption)}</figcaption>
          </figure>
          <div className={styles.originContent}>
            <p className={styles.eyebrow}>03 / {t("Product & origin")}</p>
            <h2 id="hero2-origin-heading">{t("Know what you’re choosing.")}</h2>
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
                href="#hero2-applications"
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
          data-new-hero2-section="supply"
          aria-labelledby="hero2-supply-heading"
        >
          <div className={styles.supplyIntroduction}>
            <p className={styles.eyebrow}>
              04 / {t("Wholesale & repeat orders")}
            </p>
            <h2 id="hero2-supply-heading">
              {t("From your first taste to your next order.")}
            </h2>
            <p className={styles.body}>
              {t(
                "Find your matcha in a 1 kg format for service or production. Check current availability and quantity options on its product page.",
              )}
            </p>
            <Link href="/shop" className={styles.secondary} {...linkGuard}>
              {t("Shop matcha")}
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <nav
            className={styles.reorder}
            aria-label={t("Order your matcha again")}
          >
            {SAMPLE_SET_CONTENTS.map((item) => (
              <Link
                key={item.key}
                href={oneKilogramProductUrl(item.productHandle)!}
                data-new-hero2-reorder={item.key}
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
