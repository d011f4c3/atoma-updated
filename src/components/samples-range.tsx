"use client";

import { getProductContent } from "@/lib/product-content";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { ShopMaterialImage } from "./shop-material-image";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./samples-range.module.css";

export function SamplesRange({ disabled }: { disabled: boolean }) {
  const { t, locale } = useStorefrontLocale();

  return (
    <section
      className={styles.range}
      aria-labelledby="samples-contents"
      data-samples-range
    >
      <div className={styles.sticky} data-samples-range-sticky>
        <header className={styles.heading} data-page-reveal="rise">
          <div>
            <h2 id="samples-contents" tabIndex={-1}>
              {t("Inside the set")}
            </h2>
            <p>{t("One set contains all three matcha.")}</p>
          </div>
          <nav className={styles.index} aria-label={t("Inside the set")}>
            {SAMPLE_SET_CONTENTS.map((item, index) => (
              <a
                key={item.key}
                href={`#sample-${item.key}`}
                data-sample-range-link={item.key}
                aria-disabled={disabled || undefined}
                onClick={(event) => {
                  if (disabled) event.preventDefault();
                }}
              >
                <span aria-hidden="true">0{index + 1}</span>
                {t(item.name.replace(/ Matcha$/, ""))}
              </a>
            ))}
          </nav>
        </header>
        <div className={styles.viewport} data-samples-range-viewport>
          <div className={styles.track} data-samples-range-track>
            {SAMPLE_SET_CONTENTS.map((item, index) => {
              const guidance = getProductContent(
                {
                  title: item.name,
                  handle: item.productHandle,
                  description: "",
                },
                locale,
              );
              return (
                <article
                  className={styles.sample}
                  id={`sample-${item.key}`}
                  key={item.key}
                  data-sample-content={item.key}
                  data-page-reveal="fade"
                  aria-labelledby={`sample-${item.key}-title`}
                  tabIndex={-1}
                >
                  <div className={styles.material} data-sample-range-material>
                    <ShopMaterialImage
                      src={item.image}
                      alt={t(item.imageAlt)}
                    />
                  </div>
                  <div className={styles.identity}>
                    <div className={styles.register}>
                      <span aria-hidden="true">0{index + 1} / 03</span>
                      <span>◇ {item.productCode}</span>
                    </div>
                    <h3 id={`sample-${item.key}-title`} tabIndex={-1}>
                      {t(item.name)}
                    </h3>
                    <p className={styles.application}>
                      <span>{t(item.application)}</span>
                      <span>{item.grams} g</span>
                    </p>
                  </div>
                  <div className={styles.guidance}>
                    <p>{guidance.selectionNote}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
      <noscript>
        <style>{`
          [data-samples-range] { min-height: 0 !important; }
          [data-samples-range-sticky] { position: static !important; height: auto !important; display: block !important; }
          [data-samples-range-track] { display: grid !important; width: auto !important; gap: 2.5rem !important; transform: none !important; }
          [data-samples-range] [data-sample-content] { width: 100% !important; height: auto !important; }
          [data-sample-range-material] { height: 15rem !important; }
          [data-samples-range] [data-pending="true"] img { opacity: 1 !important; }
        `}</style>
      </noscript>
    </section>
  );
}
