"use client";

import Image from "next/image";
import { useState, type MouseEvent, type ReactNode } from "react";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { oneKilogramProductUrl } from "@/lib/sample-journey";
import { FIELD_ENTRIES } from "@/lib/origins-content";
import { aboutFarmPhotographs } from "@/lib/about-photo-stories";
import { useCart } from "./cart-drawer";
import { NewHeroProducts } from "./new-hero-products";
import { HeroSevenLink as Link } from "./new-hero-seven-navigation";
import { SampleFoilTrio } from "./sample-foil-trio";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { ScrambleText } from "./scramble-text";
import styles from "./new-hero.module.css";

export function EditorialImage({
  src,
  alt,
  eager = false,
  sizes,
}: {
  src: string;
  alt: string;
  eager?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const { t } = useStorefrontLocale();
  return failed ? (
    <p className={styles.imageFallback}>{t("Image unavailable.")}</p>
  ) : (
    <Image
      src={src}
      alt={t(alt)}
      fill
      sizes={sizes ?? (eager ? "100vw" : "(max-width: 760px) 100vw, 50vw")}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      unoptimized={eager}
      onError={() => setFailed(true)}
    />
  );
}

/** Shared lower sections retain the original page's identities by default. */
export function NewHeroSections({
  idPrefix,
  destinations,
  selectionMemoryKey,
  samplesFirst = false,
  applicationsSection,
  supplySection,
  originImageSizes,
  originPhotoPair = false,
}: {
  idPrefix?: string;
  destinations?: {
    applications?: string;
    samples?: string;
    origins?: string;
    shop?: string;
  };
  selectionMemoryKey?: string;
  samplesFirst?: boolean;
  applicationsSection?: ReactNode;
  supplySection?: ReactNode;
  originImageSizes?: string;
  originPhotoPair?: boolean;
}) {
  const { t } = useStorefrontLocale();
  const { navigationBusy } = useCart();
  const field = FIELD_ENTRIES[0]!;
  const ids = {
    applications: idPrefix ? `${idPrefix}-applications` : "applications",
    applicationsHeading: idPrefix
      ? `${idPrefix}-applications-heading`
      : "applications-heading",
    samplesHeading: idPrefix
      ? `${idPrefix}-samples-heading`
      : "new-samples-heading",
    originHeading: idPrefix
      ? `${idPrefix}-origin-heading`
      : "new-origin-heading",
    supplyHeading: idPrefix
      ? `${idPrefix}-supply-heading`
      : "new-supply-heading",
    reorderHeading: idPrefix
      ? `${idPrefix}-reorder-heading`
      : "new-reorder-heading",
  };
  function guardNavigation(event: MouseEvent<HTMLAnchorElement>) {
    if (navigationBusy) event.preventDefault();
  }
  const linkGuard = {
    "aria-disabled": navigationBusy || undefined,
    onClick: guardNavigation,
  } as const;
  const ApplicationLink = destinations?.applications ? Link : "a";

  const applications = applicationsSection ?? (
    <section
      id={ids.applications}
      className={styles.section}
      data-new-hero-section="applications"
      aria-labelledby={ids.applicationsHeading}
      tabIndex={-1}
    >
      <header className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>01 / {t("The matcha")}</p>
          <h2 id={ids.applicationsHeading}>{t("Explore by Application")}</h2>
        </div>
        <p>{t("Three matcha. Choose by what you make.")}</p>
      </header>
      <NewHeroProducts
        idPrefix={idPrefix ?? "new-hero"}
        selectionMemoryKey={selectionMemoryKey}
      />
    </section>
  );
  const samples = (
    <section
      className={`${styles.section} ${styles.samples}`}
      data-new-hero-section="samples"
      aria-labelledby={ids.samplesHeading}
    >
      <div className={styles.sampleContent}>
        <p className={styles.eyebrow}>
          {samplesFirst ? "01" : "02"} / {t("The Sample Set")}
        </p>
        <h2 id={ids.samplesHeading} data-page-reveal="rise">
          <ScrambleText
            text={t("Try all three. Find your matcha.")}
            wrap
            periodic
            visibleOnly
          />
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
        <Link
          href={destinations?.samples ?? "/samples"}
          className={styles.primary}
          {...linkGuard}
        >
          {t("Start with the Sample Set")}
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <div className={styles.sampleVisual} data-new-hero-sample-visual>
        <SampleFoilTrio contained disabled={navigationBusy} />
      </div>
    </section>
  );

  return (
    <>
      {samplesFirst ? (
        <>
          {samples}
          {applications}
        </>
      ) : (
        <>
          {applications}
          {samples}
        </>
      )}

      <section
        className={`${styles.section} ${styles.proof}`}
        data-new-hero-section="origin"
        aria-labelledby={ids.originHeading}
      >
        <div className={styles.proofContent} data-new-hero-origin-content>
          <p className={styles.eyebrow}>03 / {t("Product & origin")}</p>
          <h2 id={ids.originHeading} data-page-reveal="rise">
            <ScrambleText
              text={t("Know what you’re choosing.")}
              wrap
              periodic
              visibleOnly
            />
          </h2>
          <div className={styles.proofPoint}>
            <h3>{t("Preparation & profile")}</h3>
            <p>
              {t(
                "Read the preparation guidance and product record for each matcha, then compare it in your own recipes.",
              )}
            </p>
            <ApplicationLink
              href={destinations?.applications ?? `#${ids.applications}`}
              className={styles.textLink}
              {...linkGuard}
            >
              {t("Explore the three matcha")}{" "}
              <span aria-hidden="true">
                {destinations?.applications ? "↗" : "↑"}
              </span>
            </ApplicationLink>
          </div>
          <div className={styles.proofPoint}>
            <h3>{t("Growing origin")}</h3>
            <p>
              {t(
                "Our Ceremonial matcha is grown in Wazuka, part of the Uji tea-growing region in Kyoto Prefecture.",
              )}
            </p>
            <Link
              href={destinations?.origins ?? "/origins"}
              className={styles.textLink}
              {...linkGuard}
            >
              {t("Explore Origins")} <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <figure className={styles.originFigure}>
          <div
            className={styles.originImage}
            data-origin-photo-pair={originPhotoPair || undefined}
            data-page-reveal="fade"
          >
            {originPhotoPair ? (
              <>
                <div className={styles.originPhotograph}>
                  <EditorialImage
                    src={field.image}
                    alt={field.imageAlt}
                    sizes={originImageSizes}
                  />
                </div>
                <div className={styles.originPhotograph}>
                  <EditorialImage
                    src={aboutFarmPhotographs.hillside.src}
                    alt={aboutFarmPhotographs.hillside.alt}
                    sizes={originImageSizes}
                  />
                </div>
              </>
            ) : (
              <EditorialImage
                src={field.image}
                alt={field.imageAlt}
                sizes={originImageSizes}
              />
            )}
          </div>
          <figcaption>{t(field.imageCaption)}</figcaption>
        </figure>
      </section>

      {supplySection ?? (
        <section
          className={`${styles.section} ${styles.supply}`}
          data-new-hero-section="supply"
          aria-labelledby={ids.supplyHeading}
        >
          <p className={styles.eyebrow}>
            04 / {t("Wholesale & repeat orders")}
          </p>
          <div className={styles.supplyIntroduction}>
            <h2 id={ids.supplyHeading}>
              {t("From your first taste to your next order.")}
            </h2>
            <div>
              <p className={styles.body}>
                {t(
                  "Find your matcha in a 1 kg format for service or production. Check current availability and quantity options on its product page.",
                )}
              </p>
              <Link
                href={destinations?.shop ?? "/shop"}
                className={styles.primary}
                {...linkGuard}
              >
                {t("Shop matcha")} <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
          <ol className={styles.orderSteps}>
            <li>
              <span aria-hidden="true">01</span>
              <h3>{t("Taste in your recipes")}</h3>
              <p>{t("Start with all three matcha in the Sample Set.")}</p>
            </li>
            <li>
              <span aria-hidden="true">02</span>
              <h3>{t("Choose your format")}</h3>
              <p>
                {t(
                  "See current prices, available formats and quantities with each product.",
                )}
              </p>
            </li>
            <li>
              <span aria-hidden="true">03</span>
              <h3>{t("Return to your matcha")}</h3>
              <p>
                {t(
                  "Use the product name and code to find the same matcha for your next order.",
                )}
              </p>
            </li>
          </ol>
          <nav className={styles.reorder} aria-labelledby={ids.reorderHeading}>
            <h3 id={ids.reorderHeading}>{t("Order your matcha again")}</h3>
            <div className={styles.reorderLinks}>
              {SAMPLE_SET_CONTENTS.map((item) => (
                <Link
                  key={item.key}
                  href={oneKilogramProductUrl(item.productHandle)!}
                  data-new-hero-reorder={item.key}
                  {...linkGuard}
                >
                  <span className={styles.reorderCode}>
                    ◇ {item.productCode}
                  </span>
                  <span>
                    {t("View 1 kg of {name}", { name: t(item.name) })}
                  </span>
                  <span aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          </nav>
        </section>
      )}
    </>
  );
}
