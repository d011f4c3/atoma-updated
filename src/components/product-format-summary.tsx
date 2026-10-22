"use client";

import { useId } from "react";
import type { CatalogProduct } from "@/lib/catalog-types";
import { getProductFormats } from "@/lib/product-details";
import { money } from "@/lib/product-selection";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./product-format-summary.module.css";

export function ProductFormatSummary({
  product,
  refreshing = false,
}: {
  product: CatalogProduct;
  refreshing?: boolean;
}) {
  const { t } = useStorefrontLocale();
  const id = useId();
  const formats = getProductFormats(product);
  return (
    <section
      className={styles.root}
      aria-labelledby={id}
      data-visible-product-formats
    >
      <h3 id={id}>{t("Formats & availability")}</h3>
      {refreshing ? (
        <p role="status">{t("Updating prices…")}</p>
      ) : formats.length ? (
        <ul>
          {formats.map((format) => (
            <li key={format.id}>
              <span>
                {t(format.label)}
                {format.options.length > 0 && (
                  <small>
                    {format.options
                      .map((option) => `${t(option.name)}: ${t(option.value)}`)
                      .join(" · ")}
                  </small>
                )}
              </span>
              <span>
                {money(format.priceMinor, format.currency)}
                <small>
                  {t(format.available ? "Available" : "Currently unavailable")}
                </small>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p>{t("No formats are currently published.")}</p>
      )}
    </section>
  );
}
