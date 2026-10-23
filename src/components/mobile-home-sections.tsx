"use client";

import { aboutFarmPhotographs } from "@/lib/about-photo-stories";
import { useCart } from "./cart-drawer";
import { HeroSevenLink as Link } from "./new-hero-seven-navigation";
import { EditorialImage } from "./new-hero-sections";
import { ScrambleText } from "./scramble-text";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./mobile-home-sections.module.css";

/** Product choice and samples live in the hero; the phone journey continues once. */
export function MobileHomeSections() {
  const { t } = useStorefrontLocale();
  const { navigationBusy } = useCart();
  const field = aboutFarmPhotographs.hillside;

  return (
    <div className={styles.flow} data-mobile-home-sections>
      <section
        className={styles.origin}
        aria-labelledby="mobile-home-origin-heading"
        data-mobile-home-section="origin"
      >
        <figure className={styles.originFigure} data-page-reveal="fade">
          <div className={styles.originImage}>
            <EditorialImage src={field.src} alt={field.alt} sizes="100vw" />
          </div>
          <figcaption>{t("Tea fields · Kyoto")}</figcaption>
        </figure>
        <h2 id="mobile-home-origin-heading" data-page-reveal="rise">
          <ScrambleText text={t("In the fields.")} wrap visibleOnly periodic />
        </h2>
        <p className={styles.body} data-page-reveal="rise">
          {t(
            "Our Ceremonial matcha is grown in Wazuka Town, Kyoto Prefecture, Japan.",
          )}
        </p>
        <Link
          href="/origins"
          className={styles.textAction}
          data-page-reveal="rise"
          data-page-motion="composed"
          aria-disabled={navigationBusy || undefined}
          onClick={(event) => {
            if (navigationBusy) event.preventDefault();
          }}
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
    </div>
  );
}
