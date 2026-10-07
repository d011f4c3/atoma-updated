"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getProductContent } from "@/lib/product-content";
import { canPurchaseQuantity, money } from "@/lib/product-selection";
import { ThemeSwitcher } from "./theme-switcher";
import { HomeHeader } from "./home-header";
import { ShopMaterialImage } from "./shop-material-image";
import { useProductSelection } from "./use-product-selection";
import { useCart } from "./cart-drawer";
import { useOrigins } from "./origins-provider";
import { AddToCartButton } from "./add-to-cart-button";
import { PurchaseOptions } from "./purchase-options";
import { RetailProductInformation } from "./retail-product-information";
import styles from "./retail-product.module.css";
import { useStorefrontTheme } from "./storefront-theme-provider";

export function RetailProduct({ handle }: { handle: string }) {
  const { locale, t } = useStorefrontLocale();
  const { tone } = useStorefrontTheme();
  const model = useProductSelection(handle);
  const cart = useCart();
  const { setSelectedMatcha } = useOrigins();
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const { catalog, loading, variant, quantity } = model;
  // The shared homepage hook can fall back to its first matcha; a retail URL
  // must match exactly so an unknown handle can never purchase that fallback.
  const product = model.product?.handle === handle ? model.product : undefined;
  const content = product ? getProductContent(product, locale) : undefined;
  const unavailable = !catalog || catalog.status === "unavailable";
  const locked = pending || cart.busy;
  const available = Boolean(product && variant?.available);
  const purchasable = Boolean(
    product && canPurchaseQuantity(variant, quantity),
  );
  const total =
    product && variant && Number.isSafeInteger(variant.priceMinor * quantity)
      ? money(variant.priceMinor * quantity, variant.currency)
      : "—";
  const collectionHref = "/shop";
  const productHref = (nextHandle: string) =>
    `/shop/${encodeURIComponent(nextHandle)}`;
  const related =
    catalog?.products.filter((item) => item.handle !== handle) ?? [];

  useEffect(() => {
    setSelectedMatcha(product?.title ?? null, product?.handle);
    return () => setSelectedMatcha(null);
  }, [product?.title, product?.handle, setSelectedMatcha]);

  async function addToCart() {
    if (submitting.current || locked || !product || !variant || !purchasable)
      return;
    submitting.current = true;
    setPending(true);
    try {
      await cart.addItem(product.handle, variant.id, quantity);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <main
      className={styles.page}
      data-retail-product={handle}
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <HomeHeader persistentTheme tone={tone} activePage="shop" />
      <div className={styles.content}>
        <nav className={styles.breadcrumb} aria-label={t("Breadcrumb")}>
          <Link href={collectionHref}>{t("Shop")}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{content?.name ?? t("Matcha")}</span>
        </nav>

        {loading ? (
          <div className={styles.state} role="status">
            {t("Opening your matcha…")}
          </div>
        ) : unavailable ? (
          <div className={styles.state} role="status">
            <h1>{t("This matcha couldn’t be loaded.")}</h1>
            <p>{t("Please try again.")}</p>
            <button type="button" onClick={model.retry}>
              {t("Try again")} <span aria-hidden="true">↻</span>
            </button>
          </div>
        ) : !product || !content ? (
          <div className={styles.state} data-product-not-found>
            <h1>{t("Matcha not found.")}</h1>
            <p>{t("This selection is not in the current collection.")}</p>
            <Link href={collectionHref}>
              {t("Back to the collection")} <span aria-hidden="true">↗</span>
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.productLayout}>
              <figure className={styles.gallery}>
                <div className={styles.imageStage}>
                  <ShopMaterialImage
                    src={content.materialImage}
                    alt={content.materialImageAlt}
                  />
                </div>
                <figcaption>
                  <span>{content.name}</span>
                  <span>{content.application}</span>
                </figcaption>
              </figure>
              <div className={styles.productBody}>
                <section
                  className={styles.purchase}
                  aria-label={t("Purchase {name}", { name: content.name })}
                >
                  <p className={styles.eyebrow}>{content.application}</p>
                  <div className={styles.identity}>
                    <h1>{content.name}</h1>
                    <p
                      className={styles.availability}
                      data-available={available}
                    >
                      <span aria-hidden="true" />
                      {available ? t("Available") : t("Currently unavailable")}
                    </p>
                  </div>
                  <p className={styles.purpose}>{content.purpose}</p>
                  <p className={styles.unitPrice}>
                    {variant
                      ? money(variant.priceMinor, variant.currency)
                      : t("No published format")}
                    {variant && (
                      <span>
                        {" "}
                        /{" "}
                        {variant.title === "Default Title"
                          ? t("Standard")
                          : variant.title}
                      </span>
                    )}
                  </p>
                  <p className={styles.materialSummary}>
                    {content.materialSummary}
                  </p>

                  <fieldset className={styles.formats} disabled={locked}>
                    <legend>{t("Format")}</legend>
                    <div>
                      {product.variants.map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          aria-pressed={variant?.id === item.id}
                          onClick={() => {
                            if (!locked) model.selectVariant(item.id);
                          }}
                        >
                          <span>
                            {item.title === "Default Title"
                              ? t("Standard")
                              : item.title}
                          </span>
                          {!item.available && <small>{t("Unavailable")}</small>}
                        </button>
                      ))}
                    </div>
                    {!product.variants.length && (
                      <p>{t("No formats are currently published.")}</p>
                    )}
                  </fieldset>

                  <div className={styles.orderLine}>
                    <div className={styles.quantityGroup}>
                      <span>{t("Quantity")}</span>
                      <div className={styles.stepper}>
                        <button
                          type="button"
                          aria-label={t("Decrease quantity")}
                          disabled={
                            locked ||
                            !available ||
                            !variant ||
                            quantity <= variant.minimum
                          }
                          onClick={model.decrementQuantity}
                        >
                          −
                        </button>
                        <output aria-label={t("Quantity")} aria-live="polite">
                          {quantity}
                        </output>
                        <button
                          type="button"
                          aria-label={t("Increase quantity")}
                          disabled={locked || !available || !model.canIncrement}
                          onClick={model.incrementQuantity}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className={styles.total}>
                      <span>{t("Total")}</span>
                      <strong aria-live="polite">{total}</strong>
                    </div>
                  </div>
                  {variant &&
                    (variant.minimum > 1 || variant.increment > 1) && (
                      <p className={styles.quantityNote}>
                        {t("Minimum {minimum} · Increments of {increment}", {
                          minimum: variant.minimum,
                          increment: variant.increment,
                        })}
                      </p>
                    )}
                  <details className={styles.purchaseOptions}>
                    <summary>
                      <span>{t("One-time purchase")}</span>
                      <span>
                        {t("Purchase options")}{" "}
                        <span aria-hidden="true">+</span>
                      </span>
                    </summary>
                    <PurchaseOptions />
                  </details>
                  <AddToCartButton
                    available={available}
                    pending={pending}
                    disabled={locked || !purchasable}
                    onAdd={() => void addToCart()}
                  />
                  {cart.error && (
                    <p className={styles.error} role="alert">
                      {cart.error}
                    </p>
                  )}
                  {available && !purchasable && (
                    <p className={styles.quantityNote}>
                      {t("This format’s quantity is currently unavailable.")}
                    </p>
                  )}
                </section>

                <section
                  className={styles.overview}
                  aria-labelledby="retail-overview"
                >
                  <p className={styles.sectionLabel}>{t("Overview")}</p>
                  <h2 id="retail-overview">{content.purpose}</h2>
                  <p>{content.summary}</p>
                </section>
                <RetailProductInformation product={product} tone={tone} />
              </div>
            </div>

            {related.length > 0 && (
              <section
                className={styles.related}
                aria-labelledby="retail-related"
              >
                <header>
                  <h2 id="retail-related">{t("Explore the collection.")}</h2>
                  <Link href={collectionHref}>
                    {t("All matcha")} <span aria-hidden="true">↗</span>
                  </Link>
                </header>
                <div className={styles.relatedGrid}>
                  {related.map((item) => {
                    const details = getProductContent(item, locale);
                    return (
                      <Link
                        key={item.id}
                        className={styles.relatedProduct}
                        href={productHref(item.handle)}
                        aria-label={t("View {name}", { name: details.name })}
                        aria-disabled={locked || undefined}
                        onNavigate={(event) => {
                          if (locked) event.preventDefault();
                        }}
                      >
                        <div className={styles.relatedImage}>
                          <ShopMaterialImage
                            src={details.materialImage}
                            alt={details.materialImageAlt}
                          />
                        </div>
                        <span className={styles.relatedText}>
                          <span>
                            {details.name}
                            <small>{details.application}</small>
                          </span>
                          <span aria-hidden="true">↗</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
      <footer className={styles.footer}>
        <Link href={collectionHref}>{t("ATOMA / MATCHA")}</Link>
        <ThemeSwitcher />
      </footer>
    </main>
  );
}
