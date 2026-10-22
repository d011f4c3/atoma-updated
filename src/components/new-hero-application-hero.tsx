"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { ProductKey } from "@/lib/product-codes";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { useCart } from "./cart-drawer";
import { HomeHeader } from "./home-header";
import { ScrambleText } from "./scramble-text";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useStorefrontTheme } from "./storefront-theme-provider";
import styles from "./new-hero-five.module.css";

export function NewHeroApplicationHero({
  idPrefix,
  header,
  destinations,
  onNavigate,
  motion = false,
  motionPaused = false,
  onReady,
  applicationImageSrc = "/images/hero/matcha-applications-cutout-v1.webp",
}: {
  idPrefix: "new-hero5" | "new-hero6" | "new-hero7";
  header?: ReactNode;
  onNavigate?: (href: string) => void;
  motion?: boolean;
  motionPaused?: boolean;
  onReady?: () => void;
  applicationImageSrc?: string;
  destinations?: {
    samples: string;
    applications: string;
    products: Record<ProductKey, string>;
  };
}) {
  const sectionPrefix = idPrefix.replace("new-", "");
  const { t } = useStorefrontLocale();
  const { tone } = useStorefrontTheme();
  const { navigationBusy } = useCart();
  const [materialState, setMaterialState] = useState<
    "loading" | "ready" | "failed"
  >("loading");
  function guardNavigation(event: { preventDefault(): void }) {
    if (navigationBusy) event.preventDefault();
  }
  const HeroLink = destinations || onNavigate ? Link : "a";
  function linkGuard(href: string) {
    return {
      "aria-disabled": navigationBusy || undefined,
      onClick: guardNavigation,
      ...(destinations || onNavigate
        ? {
            prefetch: onNavigate ? false : undefined,
            onNavigate: (event: { preventDefault(): void }) => {
              if (navigationBusy || onNavigate) event.preventDefault();
              if (!navigationBusy) onNavigate?.(href);
            },
          }
        : {}),
    } as const;
  }
  const samplesHref = destinations?.samples ?? `#${sectionPrefix}-samples`;
  const applicationsHref =
    destinations?.applications ?? `#${sectionPrefix}-applications`;

  return (
    <div
      className={styles.firstView}
      {...{ [`data-${idPrefix}-first-view`]: true }}
    >
      {header ?? (
        <HomeHeader tone={tone} persistentTheme initialMenuOpen={false} />
      )}
      <section
        className={styles.hero}
        {...{ [`data-${idPrefix}-hero`]: true }}
        aria-labelledby={`${sectionPrefix}-heading`}
      >
        <div className={styles.introduction}>
          <div
            className={styles.headingGroup}
            data-page-enter={motion ? "hero" : undefined}
          >
            <p className={styles.eyebrow}>
              <span aria-hidden="true">◇</span>
              {t("For cafés, kitchens & food businesses")}
            </p>
            <h1 id={`${sectionPrefix}-heading`}>
              {t("Matcha for the way you make it.")}
            </h1>
          </div>
          <div className={styles.heroDetails}>
            <p
              className={styles.description}
              {...{ [`data-${idPrefix}-description`]: true }}
              data-page-enter={motion ? "text" : undefined}
            >
              {t(
                "Authentic Japanese matcha selected for tea service, lattes and recipes.",
              )}
            </p>
            <div className={styles.actions}>
              <HeroLink
                href={samplesHref}
                className={styles.primary}
                {...{ [`data-${idPrefix}-samples`]: true }}
                {...linkGuard(samplesHref)}
              >
                {motion ? (
                  <ScrambleText
                    text={t("Start with the Sample Set")}
                    interactive
                    wrap
                    paused={motionPaused}
                  />
                ) : (
                  t("Start with the Sample Set")
                )}
                <span aria-hidden="true">{destinations ? "↗" : "↓"}</span>
              </HeroLink>
              <HeroLink
                href={applicationsHref}
                className={styles.secondary}
                {...{ [`data-${idPrefix}-explore`]: true }}
                {...linkGuard(applicationsHref)}
              >
                {motion ? (
                  <ScrambleText
                    text={t("Explore by Application")}
                    interactive
                    wrap
                    paused={motionPaused}
                  />
                ) : (
                  t("Explore by Application")
                )}
                <span aria-hidden="true">{destinations ? "↗" : "↓"}</span>
              </HeroLink>
            </div>
          </div>
        </div>
        <figure
          className={styles.material}
          {...{ [`data-${idPrefix}-material`]: true }}
          data-image-state={materialState}
        >
          <div
            className={styles.materialImage}
            data-page-enter={motion ? "visual" : undefined}
          >
            {materialState === "failed" ? (
              <p
                className={styles.materialFallback}
                {...{ [`data-${idPrefix}-image-fallback`]: true }}
                role="status"
              >
                {t("Application image unavailable.")}
              </p>
            ) : (
              <Image
                src={applicationImageSrc}
                alt={["Tea service", "Lattes", "Recipes & baking"]
                  .map((application) => t(application))
                  .join(", ")}
                fill
                sizes="100vw"
                loading="eager"
                fetchPriority="high"
                unoptimized
                onLoad={() => {
                  setMaterialState("ready");
                  onReady?.();
                }}
                onError={() => {
                  setMaterialState("failed");
                  onReady?.();
                }}
              />
            )}
          </div>
        </figure>
        <nav
          className={styles.applicationRail}
          aria-label={t("Explore the three matcha")}
        >
          {SAMPLE_SET_CONTENTS.map((item, index) => (
            <HeroLink
              key={item.key}
              href={
                destinations?.products[item.key] ?? `#${idPrefix}-${item.key}`
              }
              {...{ [`data-${idPrefix}-jump`]: item.key }}
              {...linkGuard(
                destinations?.products[item.key] ?? `#${idPrefix}-${item.key}`,
              )}
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
                <span className={styles.applicationProduct}>
                  {t(item.name)}
                </span>
                <span className={styles.applicationCode}>
                  ◇ {item.productCode}
                </span>
              </span>
              <span className={styles.applicationArrow} aria-hidden="true">
                ↗
              </span>
            </HeroLink>
          ))}
        </nav>
      </section>
    </div>
  );
}
