"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

import Link from "next/link";
import { useId, useRef } from "react";
import type { CatalogProduct, CatalogVariant } from "@/lib/catalog-types";
import { getProductContent } from "@/lib/product-content";
import { getProductDisplayIndex } from "@/lib/product-display-index";
import { money } from "@/lib/product-selection";
import { ThemeSwitcher } from "./theme-switcher";
import { HomeHeader } from "./home-header";
import { useProductSelection } from "./use-product-selection";
import { ShopMaterialImage } from "./shop-material-image";
import { ScrambleText } from "./scramble-text";
import styles from "./shop.module.css";
import { useStorefrontTheme } from "./storefront-theme-provider";

export function Shop() {
  const { t } = useStorefrontLocale();
  const { tone } = useStorefrontTheme();
  const { catalog, loading, retry } = useProductSelection();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const products = catalog?.status === "ready" ? catalog.products : [];

  function retryCollection() {
    headingRef.current?.focus({ preventScroll: true });
    retry();
  }

  return (
    <main className={styles.shop} data-tone={tone} data-storefront-theme={tone}>
      <HomeHeader persistentTheme tone={tone} activePage="shop" />
      <div className={styles.content}>
        <header className={styles.intro}>
          <div>
            <p className={styles.eyebrow}>
              <ScrambleText text={t("SHOP / MATCHA")} periodic wrap />
            </p>
            <h1 ref={headingRef} tabIndex={-1}>
              {t("Find your matcha.")}
            </h1>
          </div>
          <p className={styles.introCopy}>
            <ScrambleText text={t("For the way you make it.")} periodic wrap />
            <br />
            <ScrambleText
              text={t("Explore the collection, choose your format.")}
              periodic
              wrap
            />
          </p>
        </header>
        <div className={styles.collectionHeader}>
          <span>
            <ScrambleText text={t("THE COLLECTION")} periodic wrap />
          </span>
          <span aria-live="polite">
            {loading
              ? t("LOADING…")
              : t(
                  products.length === 1
                    ? "{count} MATCHA"
                    : "{count} SELECTIONS",
                  { count: String(products.length).padStart(2, "0") },
                )}
          </span>
        </div>
        {loading ? (
          <div className={styles.state} role="status">
            <span className={styles.loader} aria-hidden="true" />
            {t("Opening the collection…")}
          </div>
        ) : catalog?.status === "unavailable" || !catalog ? (
          <div className={styles.state} role="status">
            <h2>{t("The collection couldn’t be loaded.")}</h2>
            <p>{t("Please try again.")}</p>
            <button
              className={styles.retry}
              type="button"
              onClick={retryCollection}
            >
              <ScrambleText text={t("Try again")} interactive />
              <span aria-hidden="true">↻</span>
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className={styles.state} role="status">
            <h2>{t("The next selection is taking shape.")}</h2>
            <p>{t("There are no matcha available to browse just yet.")}</p>
          </div>
        ) : (
          <section
            className={styles.collection}
            aria-label={t("Matcha collection")}
          >
            {products.map((product) => (
              <ShopProduct key={product.id} product={product} />
            ))}
          </section>
        )}
        <div className={styles.explore}>
          <span>
            <ScrambleText
              text={t("A closer look at the material.")}
              periodic
              wrap
            />
          </span>
          <Link href="/">
            <ScrambleText text={t("Explore matcha")} interactive />
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
      <footer className={styles.footer}>
        <span>
          <ScrambleText text={t("ATOMA / MATCHA")} periodic wrap />
        </span>
        <ThemeSwitcher />
      </footer>
    </main>
  );
}

function ShopProduct({ product }: { product: CatalogProduct }) {
  const { locale, t } = useStorefrontLocale();
  const codeId = useId();
  const content = getProductContent(product, locale);
  const displayIndex = getProductDisplayIndex(product.handle);
  const availableVariants = product.variants.filter(
    (variant) => variant.available,
  );
  const available = availableVariants.length > 0;
  const priceCurrency = availableVariants[0]?.currency;
  const comparablePrices = availableVariants.every(
    (variant) =>
      Number.isSafeInteger(variant.priceMinor) &&
      variant.priceMinor >= 0 &&
      variant.currency === priceCurrency,
  );
  const fromVariant = comparablePrices
    ? availableVariants.reduce<CatalogVariant | undefined>(
        (lowest, variant) =>
          !lowest || variant.priceMinor < lowest.priceMinor ? variant : lowest,
        undefined,
      )
    : undefined;
  const formatCount = product.variants.length;
  const href = `/shop/${encodeURIComponent(product.handle)}`;

  return (
    <article
      className={styles.product}
      data-available={available}
      data-shop-product={product.id}
    >
      <Link
        className={styles.productLink}
        href={href}
        aria-label={t("View {name}", { name: content.name })}
        aria-describedby={displayIndex ? codeId : undefined}
      >
        <div className={styles.productTopline}>
          <span>{content.application}</span>
          <span className={styles.availability}>
            <span aria-hidden="true" />
            {available ? t("Available") : t("Unavailable")}
          </span>
        </div>
        <div className={styles.material}>
          <ShopMaterialImage
            src={content.materialImage}
            alt={content.materialImageAlt}
          />
        </div>
        <div className={styles.productBody}>
          <div className={styles.productIdentity}>
            <h2 data-shop-product-name>{content.name}</h2>
            {displayIndex && (
              <span
                className={styles.productCode}
                id={codeId}
                data-shop-product-code={displayIndex}
              >
                <span className={styles.srOnly}>{t("Product code")} </span>
                {displayIndex}
              </span>
            )}
          </div>
          <p className={styles.purpose}>{content.purpose}</p>
          <div className={styles.productFacts}>
            <span className={styles.price} data-shop-from-price>
              {fromVariant
                ? t("From {price}", {
                    price: money(fromVariant.priceMinor, fromVariant.currency),
                  })
                : available
                  ? t("View pricing")
                  : t("Currently unavailable")}
            </span>
            <span className={styles.formatCount}>
              {formatCount === 0
                ? t("No published format")
                : t(formatCount === 1 ? "{count} format" : "{count} formats", {
                    count: formatCount,
                  })}
            </span>
          </div>
          <span className={styles.viewProduct}>
            {t("View matcha")} <span aria-hidden="true">↗</span>
          </span>
        </div>
      </Link>
    </article>
  );
}
