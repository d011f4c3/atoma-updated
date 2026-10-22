"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { useCart } from "./cart-drawer";
import { HomeHeader } from "./home-header";
import { EditorialImage, NewHeroSections } from "./new-hero-sections";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useStorefrontTheme } from "./storefront-theme-provider";
import styles from "./new-hero.module.css";

const applications = {
  ceremonial: "Tea service",
  barista: "Lattes",
  culinary: "Recipes & baking",
} as const;

export function NewHero() {
  const { t } = useStorefrontLocale();
  const { tone } = useStorefrontTheme();
  const { navigationBusy } = useCart();
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
      data-new-hero
      data-tone={tone}
      data-storefront-theme={tone}
      data-client-reading
    >
      <HomeHeader tone={tone} persistentTheme initialMenuOpen={false} />
      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="new-hero-heading">
          <p className={styles.eyebrow}>
            <span className={styles.marker} aria-hidden="true">
              ◇
            </span>
            {t("For cafés, kitchens & food businesses")}
          </p>
          <div className={styles.introduction}>
            <h1 id="new-hero-heading">
              {t("Matcha for the way you make it.")}
            </h1>
            <div className={styles.introductionDetail}>
              <p className={styles.description}>
                {t(
                  "Japanese matcha selected for tea service, lattes and recipes.",
                )}
              </p>
              <div className={styles.actions}>
                <Link
                  href="/samples"
                  className={styles.primary}
                  data-new-hero-samples
                  {...linkGuard}
                >
                  {t("Start with the Sample Set")}
                  <span aria-hidden="true">↗</span>
                </Link>
                <a
                  href="#applications"
                  className={styles.secondary}
                  data-new-hero-explore
                  {...linkGuard}
                >
                  {t("Explore by Application")}
                  <span aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
          </div>
          <figure className={styles.material}>
            <div className={styles.materialImage}>
              <EditorialImage
                src="/images/hero/matcha-silver-composition-v1.webp"
                alt="Fine matcha powder arranged in a crescent beside a brushed silver scoop. AI material reference."
                eager
              />
            </div>
            <figcaption className={styles.materialCaption}>
              <span>ATOMA / {t("Japanese matcha")}</span>
              <span>{t("AI material reference")}</span>
            </figcaption>
          </figure>
          <nav
            className={styles.applicationIndex}
            aria-label={t("Explore the three matcha")}
          >
            {SAMPLE_SET_CONTENTS.map((item, index) => (
              <a
                key={item.key}
                href={`#new-hero-${item.key}`}
                data-new-hero-jump={item.key}
                {...linkGuard}
              >
                <span className={styles.indexNumber} aria-hidden="true">
                  0{index + 1}
                </span>
                <span>{t(applications[item.key])}</span>
                <span className={styles.indexArrow} aria-hidden="true">
                  ↓
                </span>
              </a>
            ))}
          </nav>
        </section>

        <NewHeroSections />
      </main>
    </div>
  );
}
