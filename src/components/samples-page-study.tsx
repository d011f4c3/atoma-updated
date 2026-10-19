"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { CartButton } from "./cart-drawer";
import { ShopMaterialImage } from "./shop-material-image";
import { SampleSetPurchase, useSampleSetPurchase } from "./samples";
import {
  sampleTitleTreatments,
  type SampleTitleTreatment,
} from "@/lib/sample-title-treatments";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { useStorefrontTheme } from "./storefront-theme-provider";
import styles from "./samples-page-study.module.css";

export type SamplesPageLayout = "glance" | "rows" | "folio";

const layouts: readonly {
  value: SamplesPageLayout;
  label: string;
  note: string;
}[] = [
  {
    value: "glance",
    label: "01 — At a glance",
    note: "Three clear contents cards and a single set order, together in one view.",
  },
  {
    value: "rows",
    label: "02 — Application rows",
    note: "Read by preparation, with each matcha, its use and its weight on one line.",
  },
  {
    value: "folio",
    label: "03 — Set folio",
    note: "A larger view of the material, followed by one compact set order.",
  },
];

export function SamplesPageStudy({
  initialLayout = "glance",
  initialTitle = "current",
}: {
  initialLayout?: SamplesPageLayout;
  initialTitle?: SampleTitleTreatment;
}) {
  const { t, locale } = useStorefrontLocale();
  const theme = useStorefrontTheme();
  const [tone, setTone] = useState(theme.tone);
  const [layout, setLayout] = useState(initialLayout);
  const [title, setTitle] = useState(initialTitle);
  const purchase = useSampleSetPurchase();
  const id = useId();
  const selected = layouts.find((item) => item.value === layout)!;

  function changeLayout(next: SamplesPageLayout) {
    if (purchase.locked || next === layout) return;
    setLayout(next);
    const url = new URL(window.location.href);
    url.searchParams.set("layout", next);
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  function changeTitle(next: SampleTitleTreatment) {
    if (purchase.locked || next === title) return;
    setTitle(next);
    const url = new URL(window.location.href);
    url.searchParams.set("title", next);
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  return (
    <div
      className={styles.study}
      data-samples-page-study
      data-layout={layout}
      data-title-treatment={title}
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <header className={styles.toolbar} lang="en">
        <p className={styles.studyTitle}>
          Samples study <span>Purchase page</span>
        </p>
        <label className={styles.field} htmlFor={`${id}-layout`}>
          <span>Page layout</span>
          <select
            id={`${id}-layout`}
            aria-label="Page layout"
            value={layout}
            disabled={purchase.locked}
            onChange={(event) =>
              changeLayout(event.target.value as SamplesPageLayout)
            }
          >
            {layouts.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field} htmlFor={`${id}-title`}>
          <span>Panel title</span>
          <select
            id={`${id}-title`}
            aria-label="Panel title"
            value={title}
            disabled={purchase.locked}
            onChange={(event) =>
              changeTitle(event.target.value as SampleTitleTreatment)
            }
          >
            {sampleTitleTreatments.map((item) => (
              <option key={item.value} value={item.value}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field} htmlFor={`${id}-appearance`}>
          <span>Appearance</span>
          <select
            id={`${id}-appearance`}
            aria-label="Study appearance"
            value={tone}
            disabled={purchase.locked}
            onChange={(event) =>
              setTone(event.target.value as "light" | "dark")
            }
          >
            <option value="light">Mist</option>
            <option value="dark">Blue hour</option>
          </select>
        </label>
        <nav className={styles.studyLinks} aria-label="Samples comparisons">
          <Link
            href="/samples-title-study"
            aria-disabled={purchase.locked || undefined}
            onClick={(event) => {
              if (purchase.locked) event.preventDefault();
            }}
          >
            Compare titles ↗
          </Link>
          <Link
            href="/samples-study"
            aria-disabled={purchase.locked || undefined}
            onClick={(event) => {
              if (purchase.locked) event.preventDefault();
            }}
          >
            After Explore study ↗
          </Link>
          <Link
            href="/samples"
            aria-disabled={purchase.locked || undefined}
            onClick={(event) => {
              if (purchase.locked) event.preventDefault();
            }}
          >
            Current page ↗
          </Link>
        </nav>
        <p className={styles.studyNote}>{selected.note}</p>
      </header>

      <main className={styles.page} lang={locale}>
        <header className={styles.siteHeader}>
          <Link
            className={styles.wordmark}
            href="/"
            aria-label="ATOMA"
            aria-disabled={purchase.locked || undefined}
            onClick={(event) => {
              if (purchase.locked) event.preventDefault();
            }}
          >
            ATOMA
          </Link>
          <span className={styles.currentPage}>{t("Samples")}</span>
          <CartButton tone={tone} />
        </header>

        <div className={styles.content}>
          <header className={styles.introduction}>
            <div>
              <p className={styles.eyebrow}>{t("Sample Set")} / 3 × 20 g</p>
              <h1>
                {t("Three matcha.")} <span>{t("One starting point.")}</span>
              </h1>
            </div>
            <p className={styles.description}>
              {t(
                "Try the range in your own preparations, with 20 g of each matcha.",
              )}
            </p>
          </header>

          <div className={styles.layout}>
            <section
              className={styles.set}
              aria-labelledby="study-set-contents"
            >
              <div className={styles.setHeading}>
                <h2 id="study-set-contents">{t("Inside the set")}</h2>
                <span>{t("60 g total")}</span>
              </div>
              <div className={styles.contents}>
                {SAMPLE_SET_CONTENTS.map((item, index) => (
                  <figure
                    className={styles.sample}
                    data-sample-content={item.key}
                    key={item.key}
                  >
                    <div className={styles.photo}>
                      <span className={styles.ordinal} aria-hidden="true">
                        0{index + 1}
                      </span>
                      <ShopMaterialImage
                        src={item.image}
                        alt={t(item.imageAlt)}
                        showWhilePreparing
                      />
                    </div>
                    <figcaption className={styles.caption}>
                      <span className={styles.code}>{item.productCode}</span>
                      <h3>{t(item.name.replace(/ Matcha$/, ""))}</h3>
                      <p>{t(item.application)}</p>
                    </figcaption>
                    <span className={styles.weight}>{item.grams} g</span>
                  </figure>
                ))}
              </div>
              <p className={styles.setNote}>
                {t("One set contains all three matcha.")}
              </p>
            </section>

            <SampleSetPurchase
              purchase={purchase}
              className={styles.purchase}
              titleTreatment={title === "current" ? undefined : title}
            />
          </div>

          <footer className={styles.continue}>
            <span>{t("Found your matcha?")}</span>
            <Link
              href="/shop"
              aria-disabled={purchase.locked || undefined}
              onClick={(event) => {
                if (purchase.locked) event.preventDefault();
              }}
            >
              {t("Explore the 1 kg collection")}{" "}
              <span aria-hidden="true">↗</span>
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
}
