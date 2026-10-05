"use client";

import { useId, useRef, type ReactNode } from "react";
import { getProductContent } from "@/lib/product-content";
import { canPurchaseQuantity, money } from "@/lib/product-selection";
import { AddToCartButton } from "./add-to-cart-button";
import { useCart } from "./cart-drawer";
import { ProductInformation } from "./product-information";
import { PurchaseOptions } from "./purchase-options";
import type { ProductSelectionModel } from "./use-product-selection";
import styles from "./shop-preview.module.css";

export type ShopPreviewVariant =
  | "sheet"
  | "counter"
  | "card"
  | "line"
  | "split"
  | "ledger"
  | "open"
  | "list"
  | "price";

type ShopPreviewProps = {
  model: ProductSelectionModel;
  variant: ShopPreviewVariant;
  tone: "dark" | "light";
  onIncrement: () => void;
  onDecrement: () => void;
  referenceControl?: ReactNode;
};

export function ShopPreview({
  model,
  variant: presentation,
  tone,
  onIncrement,
  onDecrement,
  referenceControl,
}: ShopPreviewProps) {
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const cart = useCart();
  const { catalog, loading, product, variant, quantity } = model;
  const content = getProductContent(product);
  const ready = !loading && catalog?.status === "ready" && product;
  const empty =
    catalog?.status === "empty" ||
    (catalog?.status === "ready" && catalog.products.length === 0);
  const validPrice = Boolean(
    variant &&
    Number.isSafeInteger(variant.priceMinor) &&
    variant.priceMinor >= 0,
  );
  const validTotal = Boolean(
    variant &&
    validPrice &&
    Number.isSafeInteger(variant.priceMinor * quantity),
  );
  const eligible = validPrice && canPurchaseQuantity(variant, quantity);
  const showOrderSummary = presentation === "split";
  const priceFirst = presentation === "price";
  const showFormatOptions =
    (presentation === "open" || presentation === "list") &&
    Boolean(product && product.variants.length > 1);
  const format = variant
    ? variant.title === "Default Title"
      ? "Standard"
      : variant.title
    : "No published format";
  const orderTotal = (
    <div className={styles.total} aria-live="polite">
      <span className={styles.label}>Total</span>
      <strong data-shop-total>{validTotal ? model.priceLabel : "—"}</strong>
    </div>
  );

  function retry() {
    if (cart.busy) return;
    heading.current?.focus({ preventScroll: true });
    model.retry();
  }

  function addToCart() {
    if (cart.busy || !product || !variant || !eligible) return;
    void cart.addItem(product.handle, variant.id, quantity);
  }

  return (
    <section
      className={styles.root}
      data-shop-preview={presentation}
      data-tone={tone}
      data-shop-product={product?.id}
      aria-labelledby={`${id}-title`}
      aria-busy={loading || cart.busy}
    >
      <header className={styles.identity}>
        <h2
          ref={heading}
          id={`${id}-title`}
          tabIndex={-1}
          data-homepage-product-name
        >
          {ready ? content.name : "Shop matcha."}
        </h2>
        {ready && <p>{content.application}</p>}
      </header>

      {!ready ? (
        <div className={styles.state}>
          <p role="status">
            {loading
              ? "Opening the collection…"
              : empty
                ? "There are no matcha available just yet."
                : "The collection couldn’t be loaded. Please try again."}
          </p>
          {!loading && (
            <button
              className={styles.retry}
              type="button"
              disabled={cart.busy}
              onClick={retry}
            >
              Try again <span aria-hidden="true">↻</span>
            </button>
          )}
        </div>
      ) : (
        <>
          <fieldset className={styles.controls} disabled={cart.busy}>
            <legend className={styles.srOnly}>Order configuration</legend>

            {priceFirst && (
              <div className={styles.priceOverview}>
                {orderTotal}
                <div className={styles.orderSummary} data-shop-order-summary>
                  <span className={styles.label}>Your order</span>
                  <p>
                    {format} × {quantity}
                  </p>
                </div>
              </div>
            )}

            <div className={styles.configuration}>
              <div className={styles.format}>
                <span className={styles.label} id={`${id}-format-label`}>
                  {presentation === "ledger" && (
                    <span className={styles.rowIndex} aria-hidden="true">
                      01
                    </span>
                  )}
                  Format
                </span>
                <div className={styles.formatValue}>
                  {showFormatOptions ? (
                    <div
                      className={styles.formatOptions}
                      role="radiogroup"
                      aria-labelledby={`${id}-format-label`}
                      data-shop-format
                    >
                      {product.variants.map((item) => (
                        <label
                          key={item.id}
                          className={styles.formatOption}
                          data-selected={variant?.id === item.id}
                          data-available={item.available}
                        >
                          <input
                            type="radio"
                            name={`${id}-format`}
                            value={item.id}
                            checked={variant?.id === item.id}
                            onChange={() => {
                              if (!cart.busy && item.id !== variant?.id)
                                model.selectVariant(item.id);
                            }}
                          />
                          <span className={styles.optionTitle}>
                            {item.title === "Default Title"
                              ? "Standard"
                              : item.title}
                          </span>
                          <span
                            className={styles.optionPrice}
                            data-shop-unit-price={
                              variant?.id === item.id ? true : undefined
                            }
                          >
                            {Number.isSafeInteger(item.priceMinor) &&
                            item.priceMinor >= 0
                              ? money(item.priceMinor, item.currency)
                              : "—"}
                            <span> / unit</span>
                            {!item.available && (
                              <span className={styles.optionAvailability}>
                                Unavailable
                              </span>
                            )}
                          </span>
                          <span
                            className={styles.optionMarker}
                            aria-hidden="true"
                          />
                        </label>
                      ))}
                    </div>
                  ) : product.variants.length > 1 ? (
                    <select
                      id={`${id}-format`}
                      data-shop-format
                      aria-label="Format"
                      value={variant?.id ?? ""}
                      onChange={(event) => {
                        if (!cart.busy && event.target.value !== variant?.id)
                          model.selectVariant(event.target.value);
                      }}
                    >
                      {product.variants.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title === "Default Title"
                            ? "Standard"
                            : item.title}
                          {!item.available ? " — Unavailable" : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p id={`${id}-format`} data-shop-format>
                      {format}
                    </p>
                  )}
                  {variant && validPrice && !showFormatOptions && (
                    <p className={styles.unitPrice} data-shop-unit-price>
                      {money(variant.priceMinor, variant.currency)}
                      <span> / unit</span>
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.quantity}>
                <span className={styles.label}>
                  {presentation === "ledger" && (
                    <span className={styles.rowIndex} aria-hidden="true">
                      02
                    </span>
                  )}
                  Quantity
                </span>
                <div className={styles.stepper}>
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={
                      !variant?.available || quantity <= variant.minimum
                    }
                    onClick={() => {
                      if (
                        !cart.busy &&
                        variant?.available &&
                        quantity > variant.minimum
                      )
                        onDecrement();
                    }}
                  >
                    −
                  </button>
                  <output aria-label="Quantity" aria-live="polite">
                    {quantity}
                  </output>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={!variant?.available || !model.canIncrement}
                    onClick={() => {
                      if (
                        !cart.busy &&
                        variant?.available &&
                        model.canIncrement
                      )
                        onIncrement();
                    }}
                  >
                    +
                  </button>
                </div>
                {variant && (variant.minimum > 1 || variant.increment > 1) && (
                  <p className={styles.quantityNote}>
                    Minimum {variant.minimum}
                    {variant.increment > 1 &&
                      ` · Increments of ${variant.increment}`}
                  </p>
                )}
              </div>
            </div>

            <details className={styles.purchaseOptions}>
              <summary
                aria-disabled={cart.busy || undefined}
                tabIndex={cart.busy ? -1 : undefined}
                onClick={(event) => {
                  if (cart.busy) event.preventDefault();
                }}
              >
                <span>
                  {presentation === "ledger" && (
                    <span className={styles.rowIndex} aria-hidden="true">
                      03
                    </span>
                  )}
                  One-time purchase
                </span>
                <span aria-hidden="true">+</span>
              </summary>
              <PurchaseOptions />
            </details>

            <div
              className={styles.purchase}
              role={showOrderSummary ? "group" : undefined}
              aria-label={showOrderSummary ? "Order summary" : undefined}
            >
              {showOrderSummary && (
                <div className={styles.orderSummary} data-shop-order-summary>
                  <span className={styles.label}>Your order</span>
                  <p>
                    {format} × {quantity}
                  </p>
                </div>
              )}
              {!priceFirst && orderTotal}
              <div className={styles.add}>
                <AddToCartButton
                  available={Boolean(variant?.available)}
                  pending={cart.adding}
                  disabled={cart.busy || !eligible}
                  onAdd={addToCart}
                />
              </div>
            </div>

            <div className={styles.optional}>
              <div className={styles.material}>
                <ProductInformation content={content} />
              </div>
              {referenceControl && (
                <div className={styles.reference}>{referenceControl}</div>
              )}
            </div>
          </fieldset>
          {cart.error && (
            <p className={styles.error} role="alert">
              {cart.error}
            </p>
          )}
        </>
      )}
    </section>
  );
}
