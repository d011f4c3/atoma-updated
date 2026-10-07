"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

import { useEffect, useId, useRef, type ReactNode } from "react";
import {
  useProductSelection,
  type ProductSelectionModel,
} from "./use-product-selection";
import { productName } from "@/lib/product-name";
import { getProductContent } from "@/lib/product-content";
import { useCart } from "./cart-drawer";
import { ProductInformation } from "./product-information";
import { ScrambleText } from "./scramble-text";
import { PurchaseOptions } from "./purchase-options";
import { AddToCartButton } from "./add-to-cart-button";
import styles from "./catalog-panel.module.css";

export type ProductSelection = {
  title: string;
  variantTitle: string;
  quantity: number;
  priceLabel: string;
  index: number;
  handle: string;
  imageUrl: string | null;
};

function money(amount: number, currency: string) {
  const formatter = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
  });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amount / 10 ** digits);
}

type CatalogPanelProps = {
  compact?: boolean;
  onSelectionChange?: (selection: ProductSelection | null) => void;
  model?: ProductSelectionModel;
  referenceControl?: ReactNode;
};

export function CatalogPanel({ model, ...props }: CatalogPanelProps) {
  return model ? (
    <CatalogControls {...props} model={model} />
  ) : (
    <StandaloneCatalogPanel {...props} />
  );
}

function StandaloneCatalogPanel(props: Omit<CatalogPanelProps, "model">) {
  const model = useProductSelection();
  return <CatalogControls {...props} model={model} />;
}

function CatalogControls({
  onSelectionChange,
  compact = false,
  model,
  referenceControl,
}: Omit<CatalogPanelProps, "model"> & { model: ProductSelectionModel }) {
  const { locale, t } = useStorefrontLocale();
  const cart = useCart();
  const productGroupId = useId();
  const {
    catalog,
    loading,
    product,
    variant,
    quantity,
    priceLabel,
    canIncrement,
    selectProduct,
    selectVariant,
    incrementQuantity,
    decrementQuantity,
    retry,
  } = model;
  const productId = product?.id;
  const variantId = variant?.id;
  const content = getProductContent(product, locale);
  const callbackRef = useRef(onSelectionChange);
  useEffect(() => {
    callbackRef.current = onSelectionChange;
  }, [onSelectionChange]);

  useEffect(() => {
    callbackRef.current?.(
      product && variant
        ? {
            title: productName(product.title, product.handle, locale),
            variantTitle:
              variant.title === "Default Title" ? t("Standard") : variant.title,
            quantity,
            priceLabel,
            index:
              catalog?.products.findIndex((item) => item.id === product.id) ??
              0,
            handle: product.handle,
            imageUrl: product.imageUrl,
          }
        : null,
    );
  }, [catalog, product, variant, quantity, priceLabel, locale, t]);

  const materialDescription = content.materialSummary.split(
    /(?<=[.!?])\s+|(?<=[。！？])\s*/u,
  )[0];

  return (
    <div className={styles.panel} aria-busy={loading} data-compact={compact}>
      {!compact && (
        <h2 className={styles.heading} tabIndex={-1}>
          {t("Find your matcha.")}
        </h2>
      )}
      {loading ? (
        <div className={styles.message} role="status">
          <span className={styles.loader} aria-hidden="true" />
          <p>{t("Opening the collection…")}</p>
        </div>
      ) : catalog?.status !== "ready" ? (
        <div className={styles.message} role="status">
          <p>
            {catalog?.status === "empty"
              ? t("The next selection is taking shape.")
              : t("The collection couldn’t be loaded.")}
          </p>
          <p className={styles.muted}>
            {catalog?.status === "empty"
              ? t("Published matcha will appear here.")
              : t("Please try again in a moment.")}
          </p>
          <button className={styles.retry} type="button" onClick={retry}>
            <ScrambleText text={t("Try again")} interactive />{" "}
            <span aria-hidden="true">↻</span>
          </button>
        </div>
      ) : (
        <>
          <fieldset className={styles.products}>
            <legend className={styles.srOnly}>{t("Select matcha")}</legend>
            {catalog.products.map((item) => {
              const itemContent = getProductContent(item, locale);
              const namedUse =
                getProductContent(item).application !== "Matcha selection";
              const priceVariant =
                item.variants.find((option) => option.available) ??
                item.variants[0];
              const available = item.variants.some(
                (option) => option.available,
              );
              return (
                <label
                  className={styles.product}
                  key={item.id}
                  data-selected={item.id === productId}
                >
                  <input
                    type="radio"
                    name={productGroupId}
                    value={item.id}
                    checked={item.id === productId}
                    onChange={() => selectProduct(item.id)}
                  />
                  <span className={styles.indicator} aria-hidden="true" />
                  <span className={styles.productText}>
                    <span>
                      <ScrambleText
                        text={
                          namedUse ? itemContent.application : itemContent.name
                        }
                        interactive
                        wrap
                      />
                    </span>
                    {namedUse && (
                      <small>
                        <ScrambleText
                          text={itemContent.name}
                          interactive
                          periodic
                          wrap
                        />
                      </small>
                    )}
                  </span>
                  <span className={styles.productPrice}>
                    {priceVariant &&
                      money(priceVariant.priceMinor, priceVariant.currency)}
                    <small>
                      {!available ? (
                        t("Unavailable")
                      ) : priceVariant ? (
                        <ScrambleText
                          text={
                            priceVariant.title === "Default Title"
                              ? t("Per unit")
                              : priceVariant.title
                          }
                          interactive
                          periodic
                          wrap
                        />
                      ) : null}
                    </small>
                  </span>
                </label>
              );
            })}
          </fieldset>
          {product && (
            <>
              <div className={styles.summaryRow}>
                <p className={styles.materialSummary}>
                  <ScrambleText
                    text={materialDescription ?? ""}
                    periodic
                    wrap
                  />
                </p>
                <ProductInformation content={content} />
              </div>
              <div className={styles.configuration}>
                {product.variants.length > 1 ? (
                  <fieldset className={styles.variants}>
                    <legend>
                      <ScrambleText text={t("Format")} periodic wrap />
                    </legend>
                    <div className={styles.variantOptions}>
                      {product.variants.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          aria-pressed={item.id === variantId}
                          onClick={() => selectVariant(item.id)}
                        >
                          <ScrambleText
                            text={
                              item.title === "Default Title"
                                ? t("Standard")
                                : item.title
                            }
                            interactive
                            wrap
                          />
                          {!item.available && <small>{t("Unavailable")}</small>}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ) : (
                  <div className={styles.formatFact}>
                    <span className={styles.label}>
                      <ScrambleText text={t("Format")} periodic wrap />
                    </span>
                    <p>
                      <ScrambleText
                        text={
                          variant
                            ? variant.title === "Default Title"
                              ? t("Standard")
                              : variant.title
                            : t("No published format")
                        }
                        periodic
                        wrap
                      />
                    </p>
                  </div>
                )}
                {variant && (
                  <div className={styles.quantity}>
                    <span className={styles.label}>
                      <ScrambleText text={t("Quantity")} periodic wrap />
                    </span>
                    <div className={styles.stepper}>
                      <button
                        type="button"
                        aria-label={t("Decrease quantity")}
                        disabled={quantity <= variant.minimum}
                        onClick={decrementQuantity}
                      >
                        −
                      </button>
                      <output aria-label={t("Quantity")} aria-live="polite">
                        {quantity}
                      </output>
                      <button
                        type="button"
                        aria-label={t("Increase quantity")}
                        disabled={!canIncrement}
                        onClick={incrementQuantity}
                      >
                        +
                      </button>
                    </div>
                    {variant.increment > 1 && (
                      <small className={styles.quantityNote}>
                        <ScrambleText
                          text={t("Increments of {count}", {
                            count: variant.increment,
                          })}
                          periodic
                          wrap
                        />
                      </small>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
      {!loading && product && <PurchaseOptions />}
      {!loading && product && referenceControl}
      {!loading && variant && product && (
        <div className={styles.purchaseBar}>
          <div className={styles.total} aria-live="polite">
            <span>
              <ScrambleText text={t("Total")} periodic wrap />
            </span>
            <strong>{priceLabel}</strong>
          </div>
          <AddToCartButton
            available={variant.available}
            pending={cart.adding}
            onAdd={() => {
              void cart.addItem(product.handle, variant.id, quantity);
            }}
          />
        </div>
      )}
      {cart.error && (
        <p role="alert" className={styles.error}>
          {cart.error}
        </p>
      )}
    </div>
  );
}
