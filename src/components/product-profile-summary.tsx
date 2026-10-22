"use client";

import { useId } from "react";
import type { CatalogProduct } from "@/lib/catalog-types";
import { getProductContent } from "@/lib/product-content";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./product-profile-summary.module.css";

/** Present the selected matcha's sensory profile. */
export function ProductProfileSummary({
  product,
}: {
  product: CatalogProduct;
}) {
  const { locale, t } = useStorefrontLocale();
  const id = useId();
  const content = getProductContent(product, locale);
  return (
    <section
      className={styles.root}
      aria-labelledby={id}
      data-visible-product-profile
    >
      <h3 id={id}>{t("Specifications")}</h3>
      <dl className={styles.values}>
        {content.materialProfile.map((property, index) => (
          <div key={index}>
            <dt>{property.label}</dt>
            <dd>{property.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
