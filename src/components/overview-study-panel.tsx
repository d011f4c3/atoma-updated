"use client";

import { useId, type ReactNode } from "react";
import type { CatalogProduct } from "@/lib/catalog-types";
import { getProductContent } from "@/lib/product-content";
import { getProductFacts, getProductFormats } from "@/lib/product-details";
import type { ProductCodePlacement } from "@/lib/product-display-index";
import { money } from "@/lib/product-selection";
import { ProductCodeIdentity } from "./product-code-identity";
import { useStorefrontLocale } from "./storefront-locale-provider";
import { ScrambleText } from "./scramble-text";
import styles from "./overview-study-panel.module.css";

export type OverviewStudyVariant = "current" | "digest" | "index" | "folded";

/** Shared presentation for the adopted Overview and its study alternatives. */
export function OverviewStudyPanel({
  product,
  variant,
  productCodePlacement,
  busy,
  onShop,
  onSpecifications,
}: {
  product: CatalogProduct;
  variant: Exclude<OverviewStudyVariant, "current">;
  productCodePlacement?: ProductCodePlacement;
  busy: boolean;
  onShop: () => void;
  onSpecifications?: () => void;
}) {
  const { locale, t } = useStorefrontLocale();
  const id = useId();
  const content = getProductContent(product, locale);
  const formats = getProductFormats(product);
  const facts = getProductFacts(product.handle, undefined, locale);
  const qualities = ["Flavour", "Texture", "Finish"].flatMap((label) => {
    const field = content.materialProfile.find(
      (item) => item.label === t(label),
    );
    return field ? [field] : [];
  });

  const formatList = (
    <ul className={styles.formats} data-overview-formats>
      {formats.map((format) => (
        <li key={format.id}>
          <div>
            <span className={styles.formatName}>{t(format.label)}</span>
            {format.options.length > 0 && (
              <span className={styles.options}>
                {format.options
                  .map((option) => `${t(option.name)}: ${t(option.value)}`)
                  .join(" · ")}
              </span>
            )}
          </div>
          <div className={styles.formatStatus}>
            <span>{money(format.priceMinor, format.currency)}</span>
            <span className={styles.availability}>
              {t(format.available ? "Available" : "Currently unavailable")}
            </span>
          </div>
        </li>
      ))}
      {formats.length === 0 && (
        <li className={styles.emptyFormats}>
          {t("No formats are currently published.")}
        </li>
      )}
    </ul>
  );

  const record = (
    <div data-product-record>
      <dl className={styles.facts}>
        {facts.published.map((fact) => (
          <div key={fact.key} data-published-fact>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
        {facts.placeholders.map((fact) => (
          <div key={fact.key} data-provisional-detail>
            <dt>{fact.label}</dt>
            <dd>{t("{value} (provisional)", { value: fact.value })}</dd>
          </div>
        ))}
      </dl>
      {facts.unpublishedNote && (
        <p className={styles.recordNote}>{facts.unpublishedNote}</p>
      )}
    </div>
  );

  function disclosure(label: string, children: ReactNode) {
    return (
      <details className={styles.disclosure}>
        <summary>
          <span>{t(label)}</span>
          <span className={styles.plus} aria-hidden="true">
            +
          </span>
        </summary>
        <div className={styles.disclosedBody}>{children}</div>
      </details>
    );
  }

  const fullDetails = disclosure(
    "Product details",
    <div className={styles.detailSections}>
      <p>{content.summary}</p>
      <section aria-labelledby={`${id}-preparation`}>
        <h3 id={`${id}-preparation`}>{t("Application & preparation")}</h3>
        <p>{content.preparation}</p>
      </section>
      <section aria-labelledby={`${id}-record`}>
        <h3 id={`${id}-record`}>{t("Product record")}</h3>
        {record}
      </section>
    </div>,
  );

  return (
    <div className={styles.root} data-overview-study={variant}>
      <ProductCodeIdentity
        className={styles.identity}
        placement={productCodePlacement}
        handle={product.handle}
      >
        <h2 className={styles.heading} tabIndex={-1} data-homepage-product-name>
          {content.name}
        </h2>
        {variant !== "index" && (
          <p className={styles.application}>{content.application}</p>
        )}
      </ProductCodeIdentity>

      {variant === "digest" && (
        <>
          <p className={styles.purpose}>{content.purpose}</p>
          <dl className={styles.digest}>
            {qualities.map((field) => (
              <div key={field.label}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
          <section
            className={styles.formatSection}
            aria-labelledby={`${id}-formats`}
          >
            <h3 id={`${id}-formats`}>{t("Formats & availability")}</h3>
            {formatList}
          </section>
          {fullDetails}
        </>
      )}

      {variant === "index" && (
        <>
          <dl className={styles.index}>
            <div>
              <dt>{t("Application")}</dt>
              <dd>{content.application}</dd>
            </div>
            {qualities.map((field) => (
              <div key={field.label}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
          {disclosure("Formats & availability", formatList)}
          {fullDetails}
        </>
      )}

      {variant === "folded" && (
        <>
          <p className={styles.purpose}>{content.purpose}</p>
          <p className={styles.introduction}>{content.summary}</p>
          <div className={styles.folds}>
            {disclosure("Formats & availability", formatList)}
            {disclosure(
              "Application & preparation",
              <p>{content.preparation}</p>,
            )}
            {disclosure("Product record", record)}
          </div>
        </>
      )}

      <div className={styles.actions}>
        {onSpecifications && (
          <button type="button" disabled={busy} onClick={onSpecifications}>
            <ScrambleText
              text={t("View specifications")}
              interactive
              animateOnMount={false}
              wrap
            />
            <span aria-hidden="true">+</span>
          </button>
        )}
        <button
          className={styles.shop}
          type="button"
          disabled={busy}
          onClick={onShop}
        >
          <ScrambleText
            text={t("Shop this matcha")}
            interactive
            animateOnMount={false}
            wrap
          />
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
