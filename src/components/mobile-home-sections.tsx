"use client";

import Image from "next/image";
import type { MouseEvent } from "react";
import { aboutFarmPhotographs } from "@/lib/about-photo-stories";
import { getProductApplicationImage } from "@/lib/product-application-imagery";
import { oneKilogramProductUrl } from "@/lib/sample-journey";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { useCart } from "./cart-drawer";
import { HeroSevenLink as Link } from "./new-hero-seven-navigation";
import { EditorialImage } from "./new-hero-sections";
import { FoilPouch } from "./sample-foil-trio";
import { ShopMaterialImage } from "./shop-material-image";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./mobile-home-sections.module.css";

/** The desktop journey, composed as a readable vertical flow for phones. */
export function MobileHomeSections() {
  const { t } = useStorefrontLocale();
  const { navigationBusy } = useCart();
  const field = aboutFarmPhotographs.hillside;
  const guard = {
    "aria-disabled": navigationBusy || undefined,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      if (navigationBusy) event.preventDefault();
    },
  } as const;

  return (
    <div className={styles.flow} data-mobile-home-sections>
      <section
        className={styles.section}
        aria-labelledby="mobile-home-samples-heading"
        data-mobile-home-section="samples"
      >
        <header className={styles.heading} data-page-reveal="rise">
          <p className={styles.eyebrow}>01 / {t("The Sample Set")}</p>
          <h2 id="mobile-home-samples-heading">
            {t("Try all three. Find your matcha.")}
          </h2>
        </header>
        <div
          className={styles.sampleVisual}
          data-page-reveal="fade"
          aria-hidden="true"
        >
          {SAMPLE_SET_CONTENTS.map((item) => (
            <span className={styles.pouch} key={item.key}>
              <FoilPouch item={item} />
            </span>
          ))}
        </div>
        <div className={styles.sampleContents} data-page-reveal="rise">
          <ul aria-label={t("All three included.")}>
            {SAMPLE_SET_CONTENTS.map((item) => (
              <li key={item.key}>
                <span>{t(item.name)}</span>
                <span>{item.grams} g</span>
              </li>
            ))}
          </ul>
        </div>
        <div
          className={styles.sampleAction}
          data-page-reveal="fade"
          data-page-motion="composed"
        >
          <p className={styles.credit} data-mobile-home-sample-credit>
            {t(
              "¥4,500 credit toward your first eligible wholesale order of 1 kg or more.",
            )}
          </p>
          <Link
            href="/?view=samples"
            className={styles.primary}
            data-mobile-home-samples
            {...guard}
          >
            <span>{t("Start with the Sample Set")}</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section
        className={styles.section}
        aria-labelledby="mobile-home-matcha-heading"
        data-mobile-home-section="applications"
      >
        <header className={styles.heading} data-page-reveal="rise">
          <p className={styles.eyebrow}>02 / {t("The matcha")}</p>
          <h2 id="mobile-home-matcha-heading">{t("Explore by Application")}</h2>
          <p className={styles.body}>
            {t("Three matcha. Choose by what you make.")}
          </p>
        </header>
        <nav
          className={styles.matchaDirectory}
          aria-label={t("Explore the three matcha")}
        >
          {SAMPLE_SET_CONTENTS.map((item) => (
            <Link
              key={item.key}
              href={`/?application=${item.key}`}
              className={styles.matcha}
              data-mobile-home-learn={item.key}
              data-page-reveal="fade"
              data-page-motion="composed"
              aria-haspopup="dialog"
              {...guard}
            >
              <span className={styles.powder} aria-hidden="true">
                <ShopMaterialImage src={item.image} alt="" showWhilePreparing />
              </span>
              <span className={styles.matchaIdentity}>
                <span className={styles.productName}>{t(item.name)}</span>
                <span className={styles.code}>◇ {item.productCode}</span>
                <span className={styles.usage}>
                  {t(getProductApplicationImage(item.productHandle)!.usage)}
                </span>
              </span>
              <span className={styles.arrow} aria-hidden="true">
                +
              </span>
            </Link>
          ))}
        </nav>
      </section>

      <section
        className={styles.section}
        aria-labelledby="mobile-home-origin-heading"
        data-mobile-home-section="origin"
      >
        <header className={styles.heading} data-page-reveal="rise">
          <p className={styles.eyebrow}>03 / {t("Product & origin")}</p>
          <h2 id="mobile-home-origin-heading">
            {t("Know what you’re choosing.")}
          </h2>
        </header>
        <div
          className={styles.guidance}
          data-page-reveal="fade"
          data-page-motion="composed"
        >
          <h3 className={styles.subheading}>{t("Preparation & profile")}</h3>
          <p className={styles.body}>
            {t(
              "Read the preparation guidance and product record for each matcha, then compare it in your own recipes.",
            )}
          </p>
          <Link href="/?view=matcha" className={styles.textAction} {...guard}>
            <span>{t("Explore the three matcha")}</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <figure className={styles.originFigure} data-page-reveal="fade">
          <div className={styles.originImage}>
            <EditorialImage src={field.src} alt={field.alt} sizes="100vw" />
          </div>
          <figcaption>{t("Tea fields · Kyoto")}</figcaption>
        </figure>
        <div data-page-reveal="fade" data-page-motion="composed">
          <h3 className={styles.subheading}>{t("Growing origin")}</h3>
          <p className={styles.body}>
            {t(
              "Our Ceremonial matcha is grown in Wazuka, part of the Uji tea-growing region in Kyoto Prefecture.",
            )}
          </p>
          <Link href="/origins" className={styles.textAction} {...guard}>
            <span>{t("Explore Origins")}</span>
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section
        className={styles.section}
        aria-labelledby="mobile-home-ordering-heading"
        data-mobile-home-section="supply"
      >
        <header className={styles.heading} data-page-reveal="rise">
          <p className={styles.eyebrow}>
            04 / {t("Wholesale & repeat orders")}
          </p>
          <h2 id="mobile-home-ordering-heading">{t("Find your matcha.")}</h2>
        </header>
        <ol className={styles.steps}>
          <li data-page-reveal="fade" data-page-motion="composed">
            <Link
              href="/?view=samples"
              className={styles.stepAction}
              aria-label={t("Sample Set")}
              {...guard}
            >
              <span className={styles.stepNumber} aria-hidden="true">
                01
              </span>
              <span
                className={`${styles.stepVisual} ${styles.stepPouches}`}
                aria-hidden="true"
              >
                {SAMPLE_SET_CONTENTS.map((item) => (
                  <span className={styles.pouch} key={item.key}>
                    <FoilPouch item={item} />
                  </span>
                ))}
              </span>
              <h3 className={styles.stepLabel}>
                <span>{t("Sample")}</span>
                <span aria-hidden="true">↗</span>
              </h3>
            </Link>
          </li>
          <li data-page-reveal="fade" data-page-motion="composed">
            <Link
              href="/?view=matcha"
              className={styles.stepAction}
              aria-label={t("Explore matcha")}
              {...guard}
            >
              <span className={styles.stepNumber} aria-hidden="true">
                02
              </span>
              <span className={styles.stepVisual} aria-hidden="true">
                <span className={styles.applicationCrop}>
                  <Image
                    src="/images/hero/matcha-applications-cutout-v3.webp"
                    alt=""
                    width={2172}
                    height={724}
                    sizes="280px"
                    draggable={false}
                  />
                </span>
              </span>
              <h3 className={styles.stepLabel}>
                <span>{t("Choose")}</span>
                <span aria-hidden="true">↗</span>
              </h3>
            </Link>
          </li>
          <li data-page-reveal="fade" data-page-motion="composed">
            <div className={styles.stepStatic}>
              <span className={styles.stepNumber} aria-hidden="true">
                03
              </span>
              <span className={styles.stepVisual} aria-hidden="true">
                <svg
                  viewBox="0 0 180 180"
                  className={styles.repeatArrows}
                  fill="none"
                >
                  <path d="M145 65C133 24 75 14 43 51M43 31V51H63M35 115C47 156 105 166 137 129M137 149V129H117" />
                </svg>
                <span className={styles.repeatWeight}>1 kg</span>
              </span>
              <h3 className={styles.stepLabel}>{t("Reorder")}</h3>
            </div>
          </li>
        </ol>
        <nav
          className={styles.reorder}
          aria-label={t("Order your matcha again")}
          data-page-reveal="fade"
          data-page-motion="composed"
        >
          {SAMPLE_SET_CONTENTS.map((item) => (
            <Link
              key={item.key}
              href={oneKilogramProductUrl(item.productHandle)!}
              className={styles.reorderProduct}
              data-mobile-home-reorder={item.key}
              aria-label={t("View 1 kg of {name}", { name: t(item.name) })}
              {...guard}
            >
              <span className={styles.reorderIdentity}>
                <span>{t(item.name)}</span>
                <span className={styles.code}>◇ {item.productCode}</span>
              </span>
              <span className={styles.format}>
                1 kg <span aria-hidden="true">↗</span>
              </span>
            </Link>
          ))}
        </nav>
      </section>
    </div>
  );
}
