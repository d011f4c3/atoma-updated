"use client";

import Image from "next/image";
import { useId, useState, type CSSProperties } from "react";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { useCart } from "./cart-drawer";
import { HeroSevenLink } from "./new-hero-seven-navigation";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useStorefrontTheme } from "./storefront-theme-provider";
import styles from "./mobile-home-hero.module.css";

// Whole objects from the approved transparent 2172 × 724 composition. Each
// crop has its own proportions; the mobile arrangement is independent of desktop.
const applications = {
  ceremonial: { label: "Tea service", x: 60, y: 140, width: 740, height: 584 },
  barista: { label: "Lattes", x: 800, y: 0, width: 550, height: 724 },
  culinary: { label: "Recipes", x: 1370, y: 240, width: 802, height: 484 },
} as const;

export function MobileHomeHero({ onReady }: { onReady?: () => void }) {
  const { t, locale } = useStorefrontLocale();
  const { tone } = useStorefrontTheme();
  const { navigationBusy } = useCart();
  const [failed, setFailed] = useState(false);
  const id = useId();
  const title = t("Matcha for the way you make it.");
  const titleBreak = locale === "ja" ? title.indexOf("、") + 1 : 0;
  const guard = {
    "aria-disabled": navigationBusy || undefined,
    onClick: (event: { preventDefault(): void }) => {
      if (navigationBusy) event.preventDefault();
    },
  } as const;

  return (
    <section
      className={styles.hero}
      data-mobile-home-hero
      data-tone={tone}
      aria-labelledby={`${id}-heading`}
    >
      <div className={styles.introduction}>
        <h1
          id={`${id}-heading`}
          data-page-enter="hero"
          data-hero-stage="heading"
        >
          {titleBreak ? (
            <>
              {title.slice(0, titleBreak)}
              <br />
              {title.slice(titleBreak)}
            </>
          ) : (
            title
          )}
        </h1>
        <p
          className={styles.description}
          data-page-enter="text"
          data-hero-stage="description"
        >
          {t(
            "Authentic Japanese matcha selected for tea service, lattes and recipes.",
          )}
        </p>
      </div>

      <div className={styles.applications} data-mobile-hero-preview="all">
        {SAMPLE_SET_CONTENTS.map((item, index) => {
          const application = applications[item.key];
          const crop = {
            "--crop-ratio": `${application.width} / ${application.height}`,
            "--image-width": `${(2172 / application.width) * 100}%`,
            "--image-left": `${(-application.x / application.width) * 100}%`,
            "--image-top": `${(-application.y / application.height) * 100}%`,
          } as CSSProperties;
          return (
            <div
              key={item.key}
              className={styles.application}
              data-mobile-hero-application={item.key}
              style={{ "--hero-order": index } as CSSProperties}
            >
              <div
                className={styles.visual}
                data-page-enter="visual"
                data-hero-stage="object"
              >
                <div className={styles.crop} style={crop}>
                  {failed ? (
                    <span className={styles.fallback} aria-hidden="true">
                      ◇ {item.productCode}
                    </span>
                  ) : (
                    <Image
                      src="/images/hero/matcha-applications-cutout-v3.webp"
                      alt=""
                      width={2172}
                      height={724}
                      sizes="760px"
                      loading="eager"
                      fetchPriority="high"
                      unoptimized
                      draggable={false}
                      onLoad={onReady}
                      onError={() => {
                        setFailed(true);
                        onReady?.();
                      }}
                    />
                  )}
                </div>
              </div>
              <HeroSevenLink
                className={styles.caption}
                href={`/?application=${item.key}`}
                data-mobile-hero-learn={item.key}
                data-page-enter="text"
                data-page-motion="composed"
                data-hero-stage="caption"
                aria-label={`${t(application.label)} — ${t(item.name)} · ${item.productCode}`}
                aria-haspopup="dialog"
                {...guard}
              >
                <span className={styles.captionIdentity}>
                  <span>{t(application.label)}</span>
                  <span className={styles.code}>◇ {item.productCode}</span>
                </span>
                <span aria-hidden="true">+</span>
              </HeroSevenLink>
            </div>
          );
        })}
      </div>

      <div
        className={styles.actions}
        data-page-enter="text"
        data-page-motion="composed"
        data-hero-stage="actions"
      >
        {failed && (
          <p className={styles.imageNotice} role="status">
            {t("Application image unavailable.")}
          </p>
        )}
        <HeroSevenLink
          href="/?view=samples"
          className={styles.primary}
          data-mobile-hero-samples
          {...guard}
        >
          <span>{t("Start with the Sample Set")}</span>
          <span aria-hidden="true">↗</span>
        </HeroSevenLink>
        <HeroSevenLink
          href="/?view=matcha"
          className={styles.secondary}
          data-mobile-hero-explore
          {...guard}
        >
          <span>{t("Explore by Application")}</span>
          <span aria-hidden="true">↗</span>
        </HeroSevenLink>
      </div>
    </section>
  );
}
