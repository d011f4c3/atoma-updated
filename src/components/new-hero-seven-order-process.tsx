"use client";

import Image from "next/image";
import type { MouseEvent } from "react";
import { oneKilogramProductUrl } from "@/lib/sample-journey";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { useCart } from "./cart-drawer";
import { HeroSevenLink as Link } from "./new-hero-seven-navigation";
import { FoilPouch } from "./sample-foil-trio";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { ScrambleText } from "./scramble-text";
import styles from "./new-hero-seven-order-process.module.css";

export function NewHeroSevenOrderProcess({
  idPrefix = "new-hero7-home",
  destinations,
  applicationImageSrc = "/images/hero/matcha-applications-cutout-v1.webp",
}: {
  idPrefix?: string;
  destinations: { samples: string; shop: string };
  applicationImageSrc?: string;
}) {
  const { t } = useStorefrontLocale();
  const { navigationBusy } = useCart();
  function guardNavigation(event: MouseEvent<HTMLAnchorElement>) {
    if (navigationBusy) event.preventDefault();
  }
  const linkGuard = {
    "aria-disabled": navigationBusy || undefined,
    onClick: guardNavigation,
  } as const;

  return (
    <section
      className={styles.section}
      data-new-hero-section="supply"
      aria-labelledby={`${idPrefix}-supply-heading`}
    >
      <header className={styles.heading} data-page-reveal="rise">
        <p className={styles.eyebrow}>04 / {t("Wholesale & repeat orders")}</p>
        <h2 id={`${idPrefix}-supply-heading`}>
          <ScrambleText
            text={t("Find your matcha.")}
            wrap
            periodic
            visibleOnly
          />
        </h2>
      </header>

      <ol className={styles.steps}>
        <li className={styles.step}>
          <div
            className={`${styles.visual} ${styles.samples}`}
            aria-hidden="true"
          >
            {SAMPLE_SET_CONTENTS.map((item) => (
              <span className={styles.pouch} key={item.key}>
                <FoilPouch item={item} />
              </span>
            ))}
          </div>
          <h3>
            <span className={styles.number} aria-hidden="true">
              01
            </span>
            {t("Sample")}
          </h3>
          <Link
            href={destinations.samples}
            className={styles.action}
            {...linkGuard}
          >
            {t("Sample Set")} <span aria-hidden="true">↗</span>
          </Link>
        </li>
        <li className={styles.step}>
          <figure className={`${styles.visual} ${styles.applications}`}>
            <Image
              src={applicationImageSrc}
              alt={["Tea service", "Lattes", "Recipes & baking"]
                .map((application) => t(application))
                .join(", ")}
              width={2172}
              height={724}
              sizes="(max-width: 760px) 280px, 360px"
              className={styles.applicationImage}
            />
          </figure>
          <h3>
            <span className={styles.number} aria-hidden="true">
              02
            </span>
            {t("Choose")}
          </h3>
          <Link
            href={destinations.shop}
            className={styles.action}
            {...linkGuard}
          >
            {t("Explore matcha")} <span aria-hidden="true">↗</span>
          </Link>
        </li>
        <li className={styles.step}>
          <div
            className={`${styles.visual} ${styles.repeat}`}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 180 180"
              className={styles.repeatArrows}
              fill="none"
            >
              <path d="M145 65C133 24 75 14 43 51M43 31V51H63M35 115C47 156 105 166 137 129M137 149V129H117" />
            </svg>
            <span className={styles.weight}>1 kg</span>
          </div>
          <h3>
            <span className={styles.number} aria-hidden="true">
              03
            </span>
            {t("Reorder")}
          </h3>
          <nav
            className={styles.reorder}
            aria-label={t("Order your matcha again")}
          >
            {SAMPLE_SET_CONTENTS.map((item) => (
              <Link
                key={item.key}
                href={oneKilogramProductUrl(item.productHandle)!}
                className={styles.product}
                data-new-hero-reorder={item.key}
                aria-label={t("View 1 kg of {name}", { name: t(item.name) })}
                {...linkGuard}
              >
                <span className={styles.productName}>{t(item.name)}</span>
                <span className={styles.code}>◇ {item.productCode}</span>
                <span className={styles.format}>
                  1 kg <span aria-hidden="true">↗</span>
                </span>
              </Link>
            ))}
          </nav>
        </li>
      </ol>
    </section>
  );
}
