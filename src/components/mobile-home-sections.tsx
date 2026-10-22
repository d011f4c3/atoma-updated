"use client";

import type { MouseEvent } from "react";
import { aboutFarmPhotographs } from "@/lib/about-photo-stories";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { useCart } from "./cart-drawer";
import { HeroSevenLink as Link } from "./new-hero-seven-navigation";
import { EditorialImage } from "./new-hero-sections";
import { FoilPouch } from "./sample-foil-trio";
import { ScrambleText } from "./scramble-text";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./mobile-home-sections.module.css";

/** A shorter phone journey complements the interactive mobile hero. */
export function MobileHomeSections({
  destinations,
}: {
  destinations: {
    samples: string;
    applications: string;
    origins?: string;
    wholesale?: string;
  };
}) {
  const { t } = useStorefrontLocale();
  const { navigationBusy } = useCart();
  const field = aboutFarmPhotographs.hillside;
  const guard = {
    "aria-disabled": navigationBusy || undefined,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (navigationBusy) event.preventDefault();
    },
  } as const;
  const steps = [
    {
      label: "Sample",
      accessibleLabel: "Start with the Sample Set",
      href: destinations.samples,
      path: "M12 8H36L39 41H9L12 8ZM13 13H35M17 23H31M17 28H31",
    },
    {
      label: "Choose",
      accessibleLabel: "Explore by Application",
      href: destinations.applications,
      path: "M8 14H15M8 24H15M8 34H15M22 14H40M22 24H40M22 34H40M7 14L10 17L16 9",
    },
    {
      label: "Reorder",
      accessibleLabel: "Wholesale",
      href: destinations.wholesale ?? "/shop",
      path: "M38 19A15 15 0 0 0 12 13M12 6V13H19M10 29A15 15 0 0 0 36 35M36 42V35H29",
    },
  ];

  return (
    <div className={styles.flow} data-mobile-home-sections>
      <section
        className={styles.samples}
        aria-labelledby="mobile-home-samples-heading"
        data-mobile-home-section="samples"
      >
        <header data-page-reveal="rise">
          <p className={styles.eyebrow}>01 / {t("The Sample Set")}</p>
          <h2 id="mobile-home-samples-heading">
            <ScrambleText
              text={t("Try three matcha in your own recipes.")}
              wrap
              visibleOnly
              periodic
            />
          </h2>
        </header>
        <figure className={styles.sampleFigure}>
          <div
            className={styles.pouches}
            aria-hidden="true"
            data-page-reveal="fade"
          >
            {SAMPLE_SET_CONTENTS.map((item) => (
              <span className={styles.pouch} key={item.key}>
                <FoilPouch item={item} />
              </span>
            ))}
          </div>
          <figcaption>{t("Three matcha · 20 g each")}</figcaption>
        </figure>
        <Link
          href={destinations.samples}
          className={styles.sampleAction}
          data-mobile-home-samples
          {...guard}
        >
          <ScrambleText
            text={t("Start with the Sample Set")}
            interactive
            animateOnMount={false}
            wrap
          />
          <span aria-hidden="true">↗</span>
        </Link>
      </section>

      <section
        className={styles.origin}
        aria-labelledby="mobile-home-origin-heading"
        data-mobile-home-section="origin"
      >
        <p className={styles.eyebrow}>02 / {t("Growing origin")}</p>
        <figure className={styles.originFigure} data-page-reveal="fade">
          <div className={styles.originImage}>
            <EditorialImage src={field.src} alt={field.alt} sizes="100vw" />
          </div>
          <figcaption>{t("Tea fields · Kyoto")}</figcaption>
        </figure>
        <h2 id="mobile-home-origin-heading" data-page-reveal="rise">
          <ScrambleText text={t("In the fields.")} wrap visibleOnly periodic />
        </h2>
        <p className={styles.body}>
          {t(
            "Our Ceremonial matcha is grown in Wazuka Town, Kyoto Prefecture, Japan.",
          )}
        </p>
        <Link
          href={destinations.origins ?? "/origins"}
          className={styles.textAction}
          {...guard}
        >
          <ScrambleText
            text={t("Explore Origins")}
            interactive
            animateOnMount={false}
            wrap
          />
          <span aria-hidden="true">↗</span>
        </Link>
      </section>

      <section
        className={styles.order}
        aria-labelledby="mobile-home-order-heading"
        data-mobile-home-section="order"
      >
        <header data-page-reveal="rise">
          <p className={styles.eyebrow}>
            03 / {t("Wholesale & repeat orders")}
          </p>
          <h2 id="mobile-home-order-heading">
            <ScrambleText
              text={t("Your next order, made simple.")}
              wrap
              visibleOnly
              periodic
            />
          </h2>
        </header>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li key={step.label}>
              <Link
                href={step.href}
                aria-label={t(step.accessibleLabel)}
                className={styles.step}
                {...guard}
              >
                <span className={styles.stepNumber} aria-hidden="true">
                  0{index + 1}
                </span>
                <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                  <path d={step.path} />
                </svg>
                <span className={styles.stepLabel}>
                  <ScrambleText
                    text={t(step.label)}
                    interactive
                    animateOnMount={false}
                    wrap
                  />
                  <span aria-hidden="true">↗</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
