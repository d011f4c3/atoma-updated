"use client";

import type { CatalogProduct, CatalogVariant } from "@/lib/catalog-types";
import { AddToCartButton } from "./add-to-cart-button";
import { useCart } from "./cart-drawer";
import { HeroSevenLink } from "./new-hero-seven-navigation";
import { ScrambleText } from "./scramble-text";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./product-popup-purchase.module.css";

export type ProductPopupPurchaseProps = {
  product?: CatalogProduct;
  variant?: CatalogVariant;
  quantity?: number;
  pricesReady: boolean;
  available: boolean;
  validQuantity: boolean;
  locked: boolean;
  pending: boolean;
  loading: boolean;
  refreshing: boolean;
  purchasable: boolean;
  unitPrice: string;
  total: string;
  status: string;
  canIncrease: boolean;
  canDecrease: boolean;
  purchaseError: string | null;
  onQuantityChange: (direction: -1 | 1) => void;
  onVariantChange: (variant: CatalogVariant) => void;
  onAdd: () => void;
};

/** Presentation only: the product owner retains catalog and purchase eligibility. */
export function ProductPopupPurchase({
  product,
  variant,
  quantity,
  pricesReady,
  available,
  validQuantity,
  locked,
  pending,
  loading,
  refreshing,
  purchasable,
  unitPrice,
  total,
  status,
  canIncrease,
  canDecrease,
  purchaseError,
  onQuantityChange,
  onVariantChange,
  onAdd,
}: ProductPopupPurchaseProps) {
  const { t } = useStorefrontLocale();
  const cart = useCart();
  const unavailable = Boolean(pricesReady && variant && !available);
  const multipleFormats = (product?.variants.length ?? 0) > 1;
  const showOrder = Boolean(
    variant && !unavailable && (available || loading || refreshing),
  );
  const formatTitle = (format: CatalogVariant) =>
    format.title === "Default Title" ? t("Standard") : format.title;

  return (
    <div
      className={styles.purchase}
      data-new-hero-product-order
      data-popup-purchase
      data-order-visible={showOrder}
      data-unavailable={unavailable || undefined}
      tabIndex={-1}
      role="region"
      aria-label={t("Purchase")}
    >
      {multipleFormats && (
        <fieldset className={styles.formats} disabled={locked}>
          <legend>{t("Format")}</legend>
          <div>
            {product?.variants.map((format) => (
              <button
                key={format.id}
                type="button"
                data-new-hero-format={format.id}
                aria-pressed={variant?.id === format.id}
                onClick={() => {
                  if (!locked) onVariantChange(format);
                }}
              >
                <span>{formatTitle(format)}</span>
                {!format.available && <small>{t("Unavailable")}</small>}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className={styles.summary}>
        <p className={styles.price} data-new-hero-price>
          {unitPrice}
          {pricesReady && variant && (
            <span className={styles.perUnit}>{t("/ UNIT")}</span>
          )}
        </p>
        <div className={styles.meta}>
          {variant && !multipleFormats && (
            <span
              className={styles.format}
              aria-label={t("Format")}
              data-new-hero-format={variant.id}
            >
              {formatTitle(variant)}
            </span>
          )}
          <p
            className={styles.status}
            data-new-hero-product-status
            role="status"
          >
            {status}
          </p>
        </div>
      </div>

      {showOrder ? (
        <>
          <div className={styles.quantity}>
            <span className={styles.label}>{t("Quantity")}</span>
            <div className={styles.stepper}>
              <button
                type="button"
                aria-label={t("Decrease quantity")}
                disabled={locked || !available || !canDecrease}
                onClick={() => onQuantityChange(-1)}
              >
                −
              </button>
              <output
                aria-label={t("Quantity")}
                aria-live="polite"
                data-new-hero-quantity
              >
                {quantity ?? "—"}
              </output>
              <button
                type="button"
                aria-label={t("Increase quantity")}
                disabled={locked || !available || !canIncrease}
                onClick={() => onQuantityChange(1)}
              >
                +
              </button>
            </div>
          </div>
          <div className={styles.checkout}>
            <div className={styles.total}>
              <span className={styles.label}>{t("Total")}</span>
              <output aria-live="polite" data-new-hero-total>
                {total}
              </output>
            </div>
            <div className={styles.add} data-new-hero-add>
              <AddToCartButton
                treatment="split"
                available={available}
                pending={pending}
                updating={loading || refreshing}
                disabled={locked || !purchasable}
                onAdd={onAdd}
              />
            </div>
          </div>
          {variant && (variant.minimum > 1 || variant.increment > 1) && (
            <p className={styles.note}>
              {t("Minimum {minimum} · Increments of {increment}", {
                minimum: variant.minimum,
                increment: variant.increment,
              })}
            </p>
          )}
          {variant && pricesReady && available && !validQuantity && (
            <p className={styles.note} role="status">
              {t("This format’s quantity is currently unavailable.")}
            </p>
          )}
        </>
      ) : (
        <div className={`${styles.add} ${styles.blockedAdd}`} data-new-hero-add>
          <button
            className={styles.blockedButton}
            type="button"
            disabled
            aria-busy={loading || refreshing}
            data-available="false"
          >
            <span>{t("Add to cart")}</span>
            <span className={styles.blockedPlus} aria-hidden="true">
              +
            </span>
          </button>
        </div>
      )}

      {purchaseError && (
        <p className={styles.error} role="alert" data-new-hero-purchase-error>
          {purchaseError}
        </p>
      )}
      <HeroSevenLink
        href="/?view=samples"
        className={styles.sampleAction}
        data-popup-sample-action
        aria-disabled={cart.navigationBusy || undefined}
        onClick={(event) => {
          if (cart.navigationBusy) event.preventDefault();
        }}
      >
        <ScrambleText
          text={t("Start with the Sample Set")}
          interactive
          animateOnMount={false}
          paused={cart.navigationBusy}
          wrap
        />
        <span aria-hidden="true">↗</span>
      </HeroSevenLink>
    </div>
  );
}
