"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { getProductContent } from "@/lib/product-content";
import { getProductApplicationImage } from "@/lib/product-application-imagery";
import { canPurchaseQuantity, money } from "@/lib/product-selection";
import { ThemeSwitcher } from "./theme-switcher";
import { HomeHeader } from "./home-header";
import { ShopMaterialImage } from "./shop-material-image";
import { ProductApplicationCutout } from "./product-application-cutout";
import { getProductCode, getProductKey } from "@/lib/product-codes";
import { useProductSelection } from "./use-product-selection";
import { useCart } from "./cart-drawer";
import { useOrigins } from "./origins-provider";
import { AddToCartButton } from "./add-to-cart-button";
import { PurchaseOptions } from "./purchase-options";
import { RetailProductInformation } from "./retail-product-information";
import styles from "./retail-product.module.css";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { ScrambleText } from "./scramble-text";
import { usePageReveals } from "./use-page-reveals";
import revealStyles from "./page-reveals.module.css";

export function RetailProduct({
  handle,
  initialFormat,
}: {
  handle: string;
  initialFormat?: "1kg";
}) {
  const { locale, t } = useStorefrontLocale();
  const { tone } = useStorefrontTheme();
  const model = useProductSelection(handle, "restore", "matcha", initialFormat);
  const cart = useCart();
  const { setSelectedMatcha } = useOrigins();
  const [pending, setPending] = useState(false);
  const [learningOpen, setLearningOpen] = useState(false);
  const learningId = useId();
  const [imagery, setImagery] = useState<"application" | "material">(
    "application",
  );
  const submitting = useRef(false);
  const { catalog, loading, variant, purchaseVariant, quantity } = model;
  // The shared homepage hook can fall back to its first matcha; a retail URL
  // must match exactly so an unknown handle can never purchase that fallback.
  const product = model.product?.handle === handle ? model.product : undefined;
  const pageRef = useRef<HTMLElement>(null);
  usePageReveals(pageRef, Boolean(product));
  const content = product ? getProductContent(product, locale) : undefined;
  const applicationImage = getProductApplicationImage(product?.handle);
  const unavailable = !catalog || catalog.status === "unavailable";
  const locked = pending || cart.busy || model.refreshing;
  const available = Boolean(product && purchaseVariant?.available);
  const purchasable = Boolean(
    product && canPurchaseQuantity(purchaseVariant, quantity),
  );
  const requestedFormatUnavailable =
    initialFormat === "1kg" && Boolean(product) && !variant;
  const total =
    product &&
    purchaseVariant &&
    Number.isSafeInteger(purchaseVariant.priceMinor * quantity)
      ? money(purchaseVariant.priceMinor * quantity, purchaseVariant.currency)
      : "—";
  const collectionHref = "/wholesale";
  const productHref = (nextHandle: string) =>
    `/shop/${encodeURIComponent(nextHandle)}`;
  const related = model.products.filter((item) => item.handle !== handle);

  useEffect(() => {
    setSelectedMatcha(product?.title ?? null, product?.handle);
    return () => setSelectedMatcha(null);
  }, [product?.title, product?.handle, setSelectedMatcha]);

  async function addToCart() {
    if (
      submitting.current ||
      locked ||
      !product ||
      !purchaseVariant ||
      !purchasable
    )
      return;
    submitting.current = true;
    setPending(true);
    try {
      await cart.addItem(product.handle, purchaseVariant.id, quantity);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <main
      ref={pageRef}
      className={`${styles.page} ${revealStyles.scope}`}
      data-retail-product={handle}
      data-client-reading
      data-tone={tone}
      data-storefront-theme={tone}
    >
      <HomeHeader persistentTheme tone={tone} activePage="shop" />
      <div className={styles.content}>
        <nav className={styles.breadcrumb} aria-label={t("Breadcrumb")}>
          <Link href={collectionHref}>
            <ScrambleText
              text={t("Wholesale")}
              interactive
              animateOnMount={false}
              wrap
            />
          </Link>
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
              <ScrambleText
                text={t("Try again")}
                interactive
                animateOnMount={false}
                wrap
              />{" "}
              <span aria-hidden="true">↻</span>
            </button>
          </div>
        ) : !product || !content ? (
          <div className={styles.state} data-product-not-found>
            <h1>{t("Matcha not found.")}</h1>
            <p>{t("This selection is not in the current collection.")}</p>
            <Link href={collectionHref}>
              <ScrambleText
                text={t("Back to the collection")}
                interactive
                animateOnMount={false}
                wrap
              />{" "}
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.productLayout}>
              <div className={styles.gallery} data-page-enter="visual">
                <div
                  className={styles.galleryImage}
                  data-retail-imagery={imagery}
                >
                  {imagery === "application" &&
                  getProductKey(product.handle) ? (
                    <ProductApplicationCutout
                      productKey={getProductKey(product.handle)!}
                    />
                  ) : (
                    <ShopMaterialImage
                      src={content.materialImage}
                      alt={content.materialImageAlt}
                    />
                  )}
                </div>
                <div
                  className={styles.imageControls}
                  aria-label={t("Product imagery")}
                >
                  {(["application", "material"] as const).map((view) => (
                    <button
                      type="button"
                      key={view}
                      aria-pressed={imagery === view}
                      disabled={cart.navigationBusy}
                      onClick={() => setImagery(view)}
                    >
                      {t(view === "application" ? "In use" : "Matcha")}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className={styles.mobileImageToggle}
                  disabled={cart.navigationBusy}
                  onClick={() =>
                    setImagery((current) =>
                      current === "application" ? "material" : "application",
                    )
                  }
                >
                  {t(imagery === "application" ? "Powder" : "In use")}
                  <span aria-hidden="true">↔</span>
                </button>
              </div>
              <div className={styles.productBody}>
                <section
                  className={styles.purchase}
                  data-retail-purchase
                  aria-label={t("Purchase {name}", { name: content.name })}
                >
                  <div className={styles.identity} data-page-enter="text">
                    {(product.productCode ||
                      getProductCode(product.handle)) && (
                      <p className={styles.code}>
                        ◇{" "}
                        {product.productCode || getProductCode(product.handle)}
                      </p>
                    )}
                    <h1>
                      <ScrambleText text={content.name} wrap />
                    </h1>
                    <p
                      className={styles.application}
                      data-product-application-copy
                    >
                      {applicationImage
                        ? t(applicationImage.usage)
                        : content.purpose}
                    </p>
                    <p
                      className={styles.availability}
                      data-available={available}
                    >
                      <span aria-hidden="true" />
                      {model.refreshing
                        ? t("Updating prices…")
                        : available
                          ? t("Available")
                          : t("Currently unavailable")}
                    </p>
                  </div>
                  <div
                    className={styles.purchaseControls}
                    data-retail-purchase-controls
                  >
                    <p className={styles.unitPrice}>
                      <span className={styles.desktopUnitPrice}>
                        {model.refreshing
                          ? t("Updating prices…")
                          : purchaseVariant
                            ? money(
                                purchaseVariant.priceMinor,
                                purchaseVariant.currency,
                              )
                            : t(
                                requestedFormatUnavailable
                                  ? "1 kg selection unavailable"
                                  : model.selectedSellingPlanKey
                                    ? "Selected subscription unavailable"
                                    : "No published format",
                              )}
                      </span>
                      <span
                        className={styles.mobileOrderPrice}
                        data-retail-mobile-price
                        aria-live="polite"
                      >
                        {model.refreshing
                          ? t("Updating prices…")
                          : purchaseVariant
                            ? total
                            : t(
                                requestedFormatUnavailable
                                  ? "1 kg selection unavailable"
                                  : model.selectedSellingPlanKey
                                    ? "Selected subscription unavailable"
                                    : "No published format",
                              )}
                      </span>
                      {variant && (
                        <span className={styles.priceContext}>
                          <span className={styles.desktopFormat}>
                            {" "}
                            /{" "}
                            {variant.title === "Default Title"
                              ? t("Standard")
                              : variant.title}
                          </span>
                          <span className={styles.mobileFormat}>
                            {quantity > 1
                              ? ` ${t("Total")} · ${quantity} × `
                              : " / "}
                            {variant.title === "Default Title"
                              ? t("Standard")
                              : variant.title}
                          </span>
                        </span>
                      )}
                    </p>
                    <fieldset
                      className={styles.formats}
                      disabled={locked}
                      data-single-format={
                        (product.variants.length === 1 &&
                          variant?.id === product.variants[0]?.id) ||
                        undefined
                      }
                      data-requested-format-unavailable={
                        requestedFormatUnavailable || undefined
                      }
                    >
                      <legend>{t("Format")}</legend>
                      {requestedFormatUnavailable &&
                        product.variants.length > 0 && (
                          <p role="status">
                            {t("Choose a published format below to continue.")}
                          </p>
                        )}
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
                            {!item.available && (
                              <small>{t("Unavailable")}</small>
                            )}
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
                            disabled={
                              locked || !available || !model.canIncrement
                            }
                            onClick={model.incrementQuantity}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className={styles.total} data-retail-secondary-total>
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
                    <AddToCartButton
                      updating={model.refreshing}
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

                    {variant?.sellingPlans?.length ||
                    model.selectedSellingPlanKey ? (
                      <details className={styles.purchaseOptions}>
                        <summary>
                          <span>
                            {model.selectedSellingPlanKey
                              ? model.selectedSellingPlan
                                ? `${t("Subscribe")} · ${t("Every 4 weeks")}`
                                : t("Selected subscription unavailable")
                              : t("One-time purchase")}
                          </span>
                          <span>
                            {t("Purchase options")}{" "}
                            <span
                              className={styles.optionsIndicator}
                              aria-hidden="true"
                            />
                          </span>
                        </summary>
                        <PurchaseOptions
                          model={model}
                          disabled={locked}
                          settled
                        />
                      </details>
                    ) : (
                      <p className={styles.oneTimeNote}>
                        {t("One-time purchase")}
                      </p>
                    )}
                  </div>
                </section>
              </div>
              <div
                className={styles.learning}
                data-learning-open={learningOpen || undefined}
              >
                <button
                  type="button"
                  className={styles.learningToggle}
                  aria-expanded={learningOpen}
                  aria-controls={learningId}
                  onClick={() => setLearningOpen((open) => !open)}
                  data-retail-learning-toggle
                >
                  <span>{t("Product details")}</span>
                  <span aria-hidden="true">{learningOpen ? "−" : "+"}</span>
                </button>
                <div className={styles.learningBody} id={learningId}>
                  <RetailProductInformation
                    key={product.id}
                    product={product}
                    tone={tone}
                    refreshing={model.refreshing}
                  />
                  <Link
                    className={styles.compare}
                    href="/shop#product-comparison"
                    aria-disabled={locked || undefined}
                    onClick={(event) => {
                      if (locked) event.preventDefault();
                    }}
                    onNavigate={(event) => {
                      if (locked) event.preventDefault();
                    }}
                  >
                    <ScrambleText
                      text={t("Compare the three matcha")}
                      interactive
                    />
                    <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </div>
            </div>

            {related.length > 0 && (
              <section
                className={styles.related}
                aria-labelledby="retail-related"
                data-page-reveal="rise"
              >
                <header>
                  <h2 id="retail-related">
                    <ScrambleText
                      text={t("Explore the collection.")}
                      wrap
                      visibleOnly
                    />
                  </h2>
                  <Link href={collectionHref}>
                    <ScrambleText
                      text={t("All matcha")}
                      interactive
                      animateOnMount={false}
                      wrap
                    />{" "}
                    <span aria-hidden="true">↗</span>
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
                            <ScrambleText
                              text={details.name}
                              interactive
                              animateOnMount={false}
                              wrap
                            />
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
