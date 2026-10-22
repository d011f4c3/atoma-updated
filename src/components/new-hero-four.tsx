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
import styles from "./new-hero-four.module.css";

export function NewHeroFour() {
  const { t } = useStorefrontLocale();
  const { tone } = useStorefrontTheme();
  const { navigationBusy } = useCart();
  const [originFailed, setOriginFailed] = useState(false);
  const [materialState, setMaterialState] = useState<
    "loading" | "ready" | "failed"
  >("loading");
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
      data-new-hero4
      data-tone={tone}
      data-storefront-theme={tone}
      data-client-reading
    >
      <HomeHeader tone={tone} persistentTheme initialMenuOpen={false} />
      <main className={styles.main}>
        <section
          className={styles.hero}
          data-new-hero4-hero
          aria-labelledby="hero4-heading"
        >
          <div className={styles.heroTopline}>
            <p className={styles.eyebrow}>
              <span aria-hidden="true">◇</span>
              {t("For cafés, kitchens & food businesses")}
            </p>
            <span className={styles.heroOrigin}>{t("Japanese matcha")}</span>
          </div>
          <div className={styles.poster}>
            <span className={styles.displayWord} aria-hidden="true">
              {t("Matcha")}
            </span>
            <figure
              className={styles.material}
              data-new-hero4-material
              data-image-state={materialState}
            >
              <div className={styles.materialImage}>
                {materialState === "failed" ? (
                  <p
                    className={styles.materialFallback}
                    data-new-hero4-image-fallback
                    role="status"
                  >
                    {t("Material image unavailable.")}
                  </p>
                ) : (
                  <Image
                    src="/images/hero/matcha-sculptural-sweep-v1.webp"
                    alt={t(
                      "A sculptural sweep of matcha powder with a brushed silver blade. AI material reference.",
                    )}
                    fill
                    sizes="(max-width: 760px) 100vw, 85vw"
                    loading="eager"
                    fetchPriority="high"
                    unoptimized
                    onLoad={() => setMaterialState("ready")}
                    onError={() => setMaterialState("failed")}
                  />
                )}
              </div>
              <figcaption>{t("AI material reference")}</figcaption>
            </figure>
          </div>
          <div className={styles.introduction}>
            <h1 id="hero4-heading">{t("Matcha for the way you make it.")}</h1>
            <div className={styles.heroDetails}>
              <p className={styles.description}>
                {t(
                  "Japanese matcha selected for tea service, lattes and recipes.",
                )}
              </p>
              <div className={styles.actions}>
                <Link
                  href="/samples"
                  className={styles.primary}
                  data-new-hero4-samples
                  {...linkGuard}
                >
                  {t("Start with the Sample Set")}
                  <span aria-hidden="true">↗</span>
                </Link>
                <a
                  href="#hero4-applications"
                  className={styles.secondary}
                  data-new-hero4-explore
                  {...linkGuard}
                >
                  {t("Explore by Application")}
                  <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
          </div>
          <nav
            className={styles.applicationRail}
            aria-label={t("Explore the three matcha")}
          >
            {SAMPLE_SET_CONTENTS.map((item, index) => (
              <a
                key={item.key}
                href={`#new-hero4-${item.key}`}
                data-new-hero4-jump={item.key}
                {...linkGuard}
              >
                <span className={styles.applicationIndex} aria-hidden="true">
                  0{index + 1}
                </span>
                <span className={styles.applicationLabel}>
                  <span>
                    {t(
                      {
                        ceremonial: "Tea service",
                        barista: "Lattes",
                        culinary: "Recipes & baking",
                      }[item.key],
                    )}
                  </span>
                  <span className={styles.applicationCode}>
                    ◇ {item.productCode}
                  </span>
                </span>
                <span className={styles.applicationArrow} aria-hidden="true">
                  ↗
                </span>
              </a>
            ))}
          </nav>
        </section>

        <section
          id="hero4-applications"
          className={styles.applications}
          data-new-hero4-section="applications"
          aria-labelledby="hero4-applications-heading"
          tabIndex={-1}
        >
          <header className={styles.sectionHeader}>
            <h2 id="hero4-applications-heading">01 / {t("The matcha")}</h2>
            <p>{t("Three matcha. Choose by what you make.")}</p>
          </header>
          <NewHeroProducts presentation="counter" idPrefix="new-hero4" />
        </section>

        <section
          className={styles.samples}
          data-new-hero4-section="samples"
          aria-labelledby="hero4-samples-heading"
        >
          <div className={styles.sampleContent}>
            <p className={styles.eyebrow}>02 / {t("The Sample Set")}</p>
            <h2 id="hero4-samples-heading">
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
          data-new-hero4-section="origin"
          aria-labelledby="hero4-origin-heading"
        >
          <header className={styles.chapterHeader}>
            <p className={styles.eyebrow}>03 / {t("Product & origin")}</p>
            <h2 id="hero4-origin-heading">{t("Know what you’re choosing.")}</h2>
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
                href="#hero4-applications"
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
          data-new-hero4-section="supply"
          aria-labelledby="hero4-supply-heading"
        >
          <div className={styles.supplyIntroduction}>
            <p className={styles.eyebrow}>
              04 / {t("Wholesale & repeat orders")}
            </p>
            <h2 id="hero4-supply-heading">
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
                data-new-hero4-reorder={item.key}
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
