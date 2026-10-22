"use client";

import Link from "next/link";
import { useId } from "react";
import type { CatalogProduct } from "@/lib/catalog-types";
import {
  getProductComparison,
  hasDisplayPrice,
  productFormatLabel,
} from "@/lib/product-comparison";
import { money } from "@/lib/product-selection";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { ScrambleText } from "./scramble-text";
import styles from "./product-comparison.module.css";

export function ProductComparison({
  products,
  refreshing,
  disabled,
}: {
  products: readonly CatalogProduct[];
  refreshing: boolean;
  disabled: boolean;
}) {
  const { locale, t } = useStorefrontLocale();
  const headingId = useId();
  const entries = getProductComparison(products, locale);

  return (
    <section
      id="product-comparison"
      className={styles.comparison}
      aria-labelledby={headingId}
      data-product-comparison
    >
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>{t("The three matcha")}</p>
          <h2 id={headingId}>{t("Compare the range.")}</h2>
        </div>
      </header>
      <div className={styles.grid}>
        {entries.map((entry) => (
          <article
            key={entry.key}
            className={styles.product}
            data-comparison-product={entry.key}
            data-comparison-offer={refreshing ? "refreshing" : entry.status}
          >
            <header className={styles.identity}>
              <span className={styles.code}>{entry.code}</span>
              <h3>{entry.name}</h3>
            </header>
            <dl className={styles.properties}>
              <div className={styles.property}>
                <dt>{t("Application")}</dt>
                <dd>{entry.application}</dd>
              </div>
              {entry.flavour && (
                <div className={styles.property}>
                  <dt>{t("Flavour")}</dt>
                  <dd>{entry.flavour}</dd>
                </div>
              )}
              {entry.colour && (
                <div className={styles.property}>
                  <dt>{t("Colour")}</dt>
                  <dd>{entry.colour}</dd>
                </div>
              )}
              <div className={styles.property}>
                <dt>{t("Formats and prices")}</dt>
                <dd data-comparison-formats aria-live="polite">
                  {refreshing ? (
                    t("Updating prices…")
                  ) : !entry.offer ? (
                    t("Offer unavailable")
                  ) : entry.offer.formats.length === 0 ? (
                    t("No published format")
                  ) : (
                    <ul className={styles.formats}>
                      {entry.offer.formats.map((format) => (
                        <li key={format.id} data-comparison-format>
                          <span>{productFormatLabel(format, locale)}</span>
                          <span className={styles.formatPrice}>
                            {!format.available
                              ? t("Unavailable")
                              : hasDisplayPrice(format)
                                ? money(format.priceMinor, format.currency)
                                : t("View pricing")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
            </dl>
            <div className={styles.action}>
              {entry.href ? (
                <Link
                  href={entry.href}
                  aria-disabled={disabled || refreshing || undefined}
                  onClick={(event) => {
                    if (disabled || refreshing) event.preventDefault();
                  }}
                  onNavigate={(event) => {
                    if (disabled || refreshing) event.preventDefault();
                  }}
                  data-comparison-details
                >
                  <span className={styles.actionLabel}>
                    <ScrambleText
                      text={t("View {name}", { name: entry.name })}
                      interactive
                      animateOnMount={false}
                      wrap
                    />
                  </span>
                  <span aria-hidden="true">↗</span>
                </Link>
              ) : (
                <span className={styles.unavailable}>
                  {t("Offer unavailable")}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
