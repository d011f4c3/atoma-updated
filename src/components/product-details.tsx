"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

import { useId } from "react";
import type { CatalogProduct } from "@/lib/catalog-types";
import { getProductContent } from "@/lib/product-content";
import { getProductFacts, getProductFormats } from "@/lib/product-details";
import { money } from "@/lib/product-selection";
import styles from "./product-details.module.css";

export function ProductDetails({
  product,
  tone,
  presentation = "disclosure",
}: {
  product: CatalogProduct;
  tone: "dark" | "light";
  presentation?: "disclosure" | "inline";
}) {
  const { locale, t } = useStorefrontLocale();
  const id = useId();
  const content = getProductContent(product, locale);
  const formats = getProductFormats(product);
  const facts = getProductFacts(product.handle, undefined, locale);

  const body = (
    <div className={styles.body}>
      <section className={styles.section} aria-labelledby={`${id}-formats`}>
        <h3 id={`${id}-formats`}>{t("Formats & availability")}</h3>
        {formats.length > 0 ? (
          <ul className={styles.formats}>
            {formats.map((format) => (
              <li key={format.id}>
                <div className={styles.formatIdentity}>
                  <span>{t(format.label)}</span>
                  <span className={styles.options}>
                    {money(format.priceMinor, format.currency)}
                  </span>
                  {format.options.length > 0 && (
                    <span className={styles.options}>
                      {format.options
                        .map(
                          (option) => `${t(option.name)}: ${t(option.value)}`,
                        )
                        .join(" · ")}
                    </span>
                  )}
                </div>
                <span className={styles.availability}>
                  {t(format.available ? "Available" : "Currently unavailable")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>{t("No formats are currently published.")}</p>
        )}
      </section>

      <section className={styles.section} aria-labelledby={`${id}-preparation`}>
        <h3 id={`${id}-preparation`}>{t("Application & preparation")}</h3>
        <p className={styles.application}>{content.application}</p>
        <p>{content.preparation}</p>
      </section>

      <section
        className={styles.section}
        aria-labelledby={`${id}-record`}
        data-product-record
      >
        <h3 id={`${id}-record`}>{t("Product record")}</h3>
        {(facts.published.length > 0 || facts.placeholders.length > 0) && (
          <dl className={styles.facts}>
            {facts.published.map((fact) => (
              <div key={fact.key} data-published-fact>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
            {facts.placeholders.map((placeholder) => (
              <div key={placeholder.key} data-provisional-detail>
                <dt>{placeholder.label}</dt>
                <dd>
                  {t("{value} (provisional)", { value: placeholder.value })}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {facts.unpublishedNote && <p>{facts.unpublishedNote}</p>}
      </section>
    </div>
  );

  if (presentation === "inline") {
    return (
      <section
        className={styles.root}
        data-tone={tone}
        data-product-details
        data-presentation="inline"
        aria-label={t("Product details")}
      >
        {body}
      </section>
    );
  }

  return (
    <details className={styles.root} data-tone={tone} data-product-details>
      <summary className={styles.trigger}>
        <span>{t("Product details")}</span>
        <span className={styles.plus} aria-hidden="true">
          +
        </span>
      </summary>
      {body}
    </details>
  );
}
