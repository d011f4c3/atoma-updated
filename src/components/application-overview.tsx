"use client";

import Link from "next/link";
import type { CatalogProduct } from "@/lib/catalog-types";
import { getProductApplicationImage } from "@/lib/product-application-imagery";
import { getProductContent } from "@/lib/product-content";
import type { ProductCodePlacement } from "@/lib/product-display-index";
import { ProductApplicationImage } from "./product-application-image";
import { ProductCodeIdentity } from "./product-code-identity";
import { ProductDetails } from "./product-details";
import { ProductProfileSummary } from "./product-profile-summary";
import { ProductFormatSummary } from "./product-format-summary";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./application-overview.module.css";

/** Canonical application entry; saved Overview study treatments stay independent. */
export function ApplicationOverview({
  product,
  tone,
  productCodePlacement,
  busy,
  refreshing = false,
  onShop,
  onSpecifications,
}: {
  product: CatalogProduct;
  tone: "dark" | "light";
  productCodePlacement?: ProductCodePlacement;
  busy: boolean;
  refreshing?: boolean;
  onShop: () => void;
  onSpecifications?: () => void;
}) {
  const { locale, t } = useStorefrontLocale();
  const content = getProductContent(product, locale);
  const reference = getProductApplicationImage(product.handle);

  return (
    <div className={styles.root} data-application-overview>
      <ProductCodeIdentity
        className={styles.identity}
        placement={productCodePlacement}
        handle={product.handle}
      >
        <h2 className={styles.heading} tabIndex={-1} data-homepage-product-name>
          {content.name}
        </h2>
        <p className={styles.application}>{content.application}</p>
      </ProductCodeIdentity>

      <ProductApplicationImage handle={product.handle} />
      <div className={styles.copy}>
        <p>{content.purpose}</p>
        {reference && (
          <p className={styles.usage} data-product-application-copy>
            {t(reference.usage)}
          </p>
        )}
      </div>

      <ProductProfileSummary product={product} />
      <Link
        className={styles.comparison}
        href="/shop#product-comparison"
        aria-disabled={busy || undefined}
        onClick={(event) => {
          if (busy) event.preventDefault();
        }}
        onNavigate={(event) => {
          if (busy) event.preventDefault();
        }}
      >
        {t("Compare the three matcha")} <span aria-hidden="true">↗</span>
      </Link>
      <ProductFormatSummary product={product} refreshing={refreshing} />
      <div className={styles.actions}>
        <Link
          className={styles.samples}
          href="/samples"
          data-application-samples-entry
          aria-disabled={busy || undefined}
          tabIndex={busy ? -1 : undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
          onNavigate={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <span>{t("Start with the Sample Set")}</span>
          <span aria-hidden="true">↗</span>
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={onShop}
          data-application-shop-entry
        >
          <span>{t("Order")}</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
      {onSpecifications && (
        <button
          className={styles.specifications}
          type="button"
          disabled={busy}
          onClick={onSpecifications}
        >
          <span>{t("View specifications")}</span>
          <span aria-hidden="true">+</span>
        </button>
      )}
      <ProductDetails product={product} tone={tone} includeFormats={false} />
    </div>
  );
}
