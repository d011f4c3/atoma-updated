"use client";

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
  const id = useId();
  const content = getProductContent(product);
  const formats = getProductFormats(product);
  const facts = getProductFacts(product.handle);

  const body = (
    <div className={styles.body}>
      <section className={styles.section} aria-labelledby={`${id}-formats`}>
        <h3 id={`${id}-formats`}>Formats & availability</h3>
        {formats.length > 0 ? (
          <ul className={styles.formats}>
            {formats.map((format) => (
              <li key={format.id}>
                <div className={styles.formatIdentity}>
                  <span>{format.label}</span>
                  <span className={styles.options}>
                    {money(format.priceMinor, format.currency)}
                  </span>
                  {format.options.length > 0 && (
                    <span className={styles.options}>
                      {format.options
                        .map((option) => `${option.name}: ${option.value}`)
                        .join(" · ")}
                    </span>
                  )}
                </div>
                <span className={styles.availability}>
                  {format.available ? "Available" : "Currently unavailable"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No formats are currently published.</p>
        )}
      </section>

      <section className={styles.section} aria-labelledby={`${id}-preparation`}>
        <h3 id={`${id}-preparation`}>Application & preparation</h3>
        <p className={styles.application}>{content.application}</p>
        <p>{content.preparation}</p>
      </section>

      <section className={styles.section} aria-labelledby={`${id}-record`}>
        <h3 id={`${id}-record`}>Product record</h3>
        {facts.published.length > 0 && (
          <dl className={styles.facts}>
            {facts.published.map((fact) => (
              <div key={fact.key}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
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
        aria-label="Product details"
      >
        {body}
      </section>
    );
  }

  return (
    <details className={styles.root} data-tone={tone} data-product-details>
      <summary className={styles.trigger}>
        <span>Product details</span>
        <span className={styles.plus} aria-hidden="true">
          +
        </span>
      </summary>
      {body}
    </details>
  );
}
