"use client";

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
              <ScrambleText text="SHOP / MATCHA" periodic wrap />
            </p>
            <h1 ref={headingRef} tabIndex={-1}>
              Find your matcha.
            </h1>
          </div>
          <p className={styles.introCopy}>
            <ScrambleText text="For the way you make it." periodic wrap />
            <br />
            <ScrambleText
              text="Explore the collection, choose your format."
              periodic
              wrap
            />
          </p>
        </header>
        <div className={styles.collectionHeader}>
          <span>
            <ScrambleText text="THE COLLECTION" periodic wrap />
          </span>
          <span aria-live="polite">
            {loading
              ? "LOADING…"
              : String(products.length).padStart(2, "0") +
                (products.length === 1 ? " MATCHA" : " SELECTIONS")}
          </span>
        </div>
        {loading ? (
          <div className={styles.state} role="status">
            <span className={styles.loader} aria-hidden="true" />
            Opening the collection…
          </div>
        ) : catalog?.status === "unavailable" || !catalog ? (
          <div className={styles.state} role="status">
            <h2>The collection couldn’t be loaded.</h2>
            <p>Please try again.</p>
            <button
              className={styles.retry}
              type="button"
              onClick={retryCollection}
            >
              <ScrambleText text="Try again" interactive />
              <span aria-hidden="true">↻</span>
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className={styles.state} role="status">
            <h2>The next selection is taking shape.</h2>
            <p>There are no matcha available to browse just yet.</p>
          </div>
        ) : (
          <section className={styles.collection} aria-label="Matcha collection">
            {products.map((product) => (
              <ShopProduct key={product.id} product={product} />
            ))}
          </section>
        )}
        <div className={styles.explore}>
          <span>
            <ScrambleText text="A closer look at the material." periodic wrap />
          </span>
          <Link href="/">
            <ScrambleText text="Explore matcha" interactive />
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
      <footer className={styles.footer}>
        <span>
          <ScrambleText text="ATOMA / MATCHA" periodic wrap />
        </span>
        <ThemeSwitcher />
      </footer>
    </main>
  );
}

function ShopProduct({ product }: { product: CatalogProduct }) {
  const codeId = useId();
  const content = getProductContent(product);
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
        aria-label={"View " + content.name}
        aria-describedby={displayIndex ? codeId : undefined}
      >
        <div className={styles.productTopline}>
          <span>{content.application}</span>
          <span className={styles.availability}>
            <span aria-hidden="true" />
            {available ? "Available" : "Unavailable"}
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
                <span className={styles.srOnly}>Product code </span>
                {displayIndex}
              </span>
            )}
          </div>
          <p className={styles.purpose}>{content.purpose}</p>
          <div className={styles.productFacts}>
            <span className={styles.price} data-shop-from-price>
              {fromVariant
                ? "From " + money(fromVariant.priceMinor, fromVariant.currency)
                : available
                  ? "View pricing"
                  : "Currently unavailable"}
            </span>
            <span className={styles.formatCount}>
              {formatCount === 0
                ? "No published format"
                : formatCount + (formatCount === 1 ? " format" : " formats")}
            </span>
          </div>
          <span className={styles.viewProduct}>
            View matcha <span aria-hidden="true">↗</span>
          </span>
        </div>
      </Link>
    </article>
  );
}
