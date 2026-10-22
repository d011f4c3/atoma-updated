"use client";

import Image from "next/image";
import {
  HeroSevenLink as Link,
  useHeroSevenNavigation,
} from "./new-hero-seven-navigation";
import { useRef, useState, type MouseEvent } from "react";
import { FIELD_ENTRIES } from "@/lib/origins-content";
import type { ProductKey } from "@/lib/product-codes";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { useCart } from "./cart-drawer";
import { useOrigins } from "./origins-provider";
import { SampleFoilTrio } from "./sample-foil-trio";
import { NewHeroSevenSampleExplorer } from "./new-hero-seven-sample-explorer";
import { SampleSetPurchase, useSampleSetPurchase } from "./samples";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { ScrambleText } from "./scramble-text";
import { usePageReveals } from "./use-page-reveals";
import revealStyles from "./page-reveals.module.css";
import styles from "./new-hero-seven-details.module.css";

export function NewHeroSevenSamples() {
  const { t } = useStorefrontLocale();
  const navigation = useHeroSevenNavigation();
  const page = useRef<HTMLDivElement>(null);
  usePageReveals(page, !navigation || navigation.state.view === "samples");
  const {
    navigationBusy,
    destinationReviewRequired,
    reviewRequired,
    openCart,
  } = useCart();
  const samplePurchase = useSampleSetPurchase(
    navigation?.basePath === "/" ? "homepage" : "new-hero7",
  );
  const [reading, setReading] = useState<ProductKey | null>(null);
  const order = useRef<HTMLDivElement>(null);

  function reachOrder() {
    const target = order.current;
    if (navigationBusy || !target) return;
    target.focus({ preventScroll: true });
    const heading = target.querySelector("#hero7-sample-order") ?? target;
    const purchaseAction =
      target.querySelector("[data-sample-purchase] button[data-available]") ??
      target;
    if (
      heading.getBoundingClientRect().top < 0 ||
      purchaseAction.getBoundingClientRect().bottom > window.innerHeight
    ) {
      target.scrollIntoView({ block: "start" });
    }
  }

  function guardNavigation(event: MouseEvent<HTMLAnchorElement>) {
    if (navigationBusy) event.preventDefault();
  }
  const linkGuard = {
    "aria-disabled": navigationBusy || undefined,
    onClick: guardNavigation,
  } as const;

  return (
    <div
      ref={page}
      className={`${styles.page} ${styles.samples} ${revealStyles.scope}`}
      data-new-hero7-view="samples"
    >
      <header className={styles.introduction} data-page-enter="text">
        <div>
          <p className={styles.eyebrow}>{t("The Sample Set")}</p>
          <h1>
            <ScrambleText
              text={t("Try all three. Find your matcha.")}
              wrap
              periodic
              visibleOnly
            />
          </h1>
        </div>
        <p className={styles.body}>
          {t(
            "Compare the three matcha in your own drinks and recipes before choosing a larger format.",
          )}
        </p>
      </header>

      <div className={styles.sampleLayout}>
        <div className={styles.sampleVisual}>
          <SampleFoilTrio contained disabled={navigationBusy} />
        </div>
        <div className={styles.sampleContents}>
          <NewHeroSevenSampleExplorer
            selected={reading}
            onSelect={setReading}
            onOrder={reachOrder}
            disabled={navigationBusy}
          />
        </div>

        <div
          ref={order}
          id="new-hero7-sample-order"
          className={styles.sampleOrder}
          tabIndex={-1}
          aria-labelledby="hero7-sample-order"
          data-new-hero7-sample-purchase
        >
          {(destinationReviewRequired || reviewRequired) && (
            <button
              className={styles.button}
              type="button"
              disabled={navigationBusy}
              onClick={openCart}
            >
              <ScrambleText
                text={t(
                  destinationReviewRequired
                    ? "Confirm country"
                    : "Refresh selection",
                )}
                interactive
                animateOnMount={false}
                wrap
              />
            </button>
          )}
          <SampleSetPurchase
            purchase={samplePurchase}
            presentation="entry"
            showValueNote={false}
            headingId="hero7-sample-order"
            className={styles.samplePurchase}
          />
          <Link
            href="/samples"
            className={styles.textLink}
            data-new-hero7-sample-details
            {...linkGuard}
          >
            <ScrambleText
              text={t("Sample Set details")}
              interactive
              animateOnMount={false}
              wrap
            />
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function NewHeroSevenOrigins() {
  const { t } = useStorefrontLocale();
  const { tone } = useStorefrontTheme();
  const { navigationBusy } = useCart();
  const { openOrigins } = useOrigins();
  const [imageFailed, setImageFailed] = useState(false);
  const field = FIELD_ENTRIES[0]!;
  const ceremonial = SAMPLE_SET_CONTENTS.find(
    (item) => item.key === "ceremonial",
  )!;
  const linkGuard = {
    "aria-disabled": navigationBusy || undefined,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (navigationBusy) event.preventDefault();
    },
  } as const;

  return (
    <div className={styles.page} data-new-hero7-view="origins">
      <header className={styles.introduction}>
        <div>
          <p className={styles.eyebrow}>{t("Product & origin")}</p>
          <h1>{t("Know what you’re choosing.")}</h1>
        </div>
      </header>

      <div className={styles.originLayout}>
        <figure className={styles.originFigure}>
          <div className={styles.originImage}>
            {imageFailed ? (
              <p className={styles.imageFallback}>{t("Image unavailable.")}</p>
            ) : (
              <Image
                src={field.image}
                alt={t(field.imageAlt)}
                fill
                sizes="(max-width: 900px) 100vw, 65vw"
                onError={() => setImageFailed(true)}
              />
            )}
          </div>
          <figcaption>{t(field.imageCaption)}</figcaption>
        </figure>

        <div className={styles.originRecord}>
          <p className={styles.eyebrow}>{t("Growing origin")}</p>
          <h2>{t("Wazuka")}</h2>
          <p className={styles.body}>
            {t(
              "Our Ceremonial matcha is grown in Wazuka, part of the Uji tea-growing region in Kyoto Prefecture.",
            )}
          </p>
          <a
            href="/origins"
            className={styles.button}
            data-new-hero7-origin
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
                returnLabel: "Return to Origins",
              });
            }}
          >
            {t("Explore Origins")}
            <span aria-hidden="true">↗</span>
          </a>
          <Link
            href="/new-hero7/matcha#new-hero7-ceremonial"
            className={styles.productLink}
            data-new-hero7-origin-matcha
            data-new-hero7-next="matcha"
            data-new-hero7-application="ceremonial"
            {...linkGuard}
          >
            <span>
              <span className={styles.recordCode}>
                ◇ {ceremonial.productCode}
              </span>
              <span>{t(ceremonial.name)}</span>
            </span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      <div className={styles.continuation}>
        <p>{t("Start with all three matcha in the Sample Set.")}</p>
        <Link
          href="/new-hero7/samples"
          className={styles.button}
          data-new-hero7-next="samples"
          {...linkGuard}
        >
          {t("Start with the Sample Set")}
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </div>
  );
}
