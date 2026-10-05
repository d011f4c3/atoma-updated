"use client";

import { useId, useRef } from "react";
import { getProductContent } from "@/lib/product-content";
import type { ProductCodePlacement } from "@/lib/product-display-index";
import { ProductCodeIdentity } from "./product-code-identity";
import { canPurchaseQuantity, money } from "@/lib/product-selection";
import { AddToCartButton } from "./add-to-cart-button";
import { useCart } from "./cart-drawer";
import { ProductInformation } from "./product-information";
import { PurchaseOptions } from "./purchase-options";
import type { ProductSelectionModel } from "./use-product-selection";
import styles from "./shop-exploration-panel.module.css";

export type ShopExplorationLayout = "guided" | "compact" | "receipt";

type ShopExplorationPanelProps = {
  model: ProductSelectionModel;
  tone: "dark" | "light";
  layout: ShopExplorationLayout;
  productCodePlacement?: ProductCodePlacement;
  onIncrement: () => void;
  onDecrement: () => void;
};

function formatName(title: string) {
  return title === "Default Title" ? "Standard" : title;
}

export function ShopExplorationPanel({
  model,
  tone,
  layout,
  productCodePlacement,
  onIncrement,
  onDecrement,
}: ShopExplorationPanelProps) {
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
  const format = variant ? formatName(variant.title) : "No published format";
  const unitPrice =
    variant && validPrice ? money(variant.priceMinor, variant.currency) : "—";
  const quantityRules = variant
    ? [
        variant.minimum > 1 ? `Minimum ${variant.minimum}` : null,
        variant.increment > 1 ? `Increments of ${variant.increment}` : null,
        variant.maximum !== null ? `Maximum ${variant.maximum}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  function selectFormat(nextId: string) {
    if (!cart.busy && nextId !== variant?.id) model.selectVariant(nextId);
  }

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
      data-shop-exploration={layout}
      data-tone={tone}
      data-shop-product={product?.id}
      aria-labelledby={`${id}-title`}
      aria-busy={loading || cart.busy}
    >
      <ProductCodeIdentity
        className={styles.identity}
        handle={ready ? product.handle : undefined}
        placement={productCodePlacement}
      >
        <h2
          ref={heading}
          id={`${id}-title`}
          tabIndex={-1}
          data-homepage-product-name
        >
          {ready ? content.name : "Shop matcha."}
        </h2>
        {ready && <p>{content.application}</p>}
      </ProductCodeIdentity>

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
            <div className={styles.order}>
              <div className={styles.configuration}>
                <fieldset className={styles.format}>
                  <legend className={styles.label} id={`${id}-format-label`}>
                    <span className={styles.stepIndex} aria-hidden="true">
                      01
                    </span>
                    Format
                  </legend>
                  {product.variants.length > 1 ? (
                    layout === "guided" ? (
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
                            data-selected={item.id === variant?.id}
                            data-available={item.available}
                          >
                            <input
                              type="radio"
                              name={`${id}-format`}
                              value={item.id}
                              checked={item.id === variant?.id}
                              onChange={() => selectFormat(item.id)}
                            />
                            <span className={styles.optionName}>
                              {formatName(item.title)}
                            </span>
                            <span
                              className={styles.optionPrice}
                              data-shop-unit-price={
                                item.id === variant?.id ? true : undefined
                              }
                            >
                              {Number.isSafeInteger(item.priceMinor) &&
                              item.priceMinor >= 0
                                ? money(item.priceMinor, item.currency)
                                : "—"}
                              <span> / unit</span>
                            </span>
                            {!item.available && (
                              <span className={styles.availability}>
                                Unavailable
                              </span>
                            )}
                            <span
                              className={styles.radioMark}
                              aria-hidden="true"
                            />
                          </label>
                        ))}
                      </div>
                    ) : (
                      <>
                        <select
                          className={styles.formatSelect}
                          aria-label="Format"
                          data-shop-format
                          value={variant?.id ?? ""}
                          onChange={(event) => selectFormat(event.target.value)}
                        >
                          {product.variants.map((item) => (
                            <option key={item.id} value={item.id}>
                              {formatName(item.title)}
                              {!item.available ? " — Unavailable" : ""}
                            </option>
                          ))}
                        </select>
                        {layout !== "receipt" && (
                          <p className={styles.unitPrice} data-shop-unit-price>
                            {unitPrice} <span>/ unit</span>
                          </p>
                        )}
                      </>
                    )
                  ) : (
                    <div className={styles.singleFormat}>
                      <p data-shop-format>{format}</p>
                      {variant && layout !== "receipt" && (
                        <p className={styles.unitPrice} data-shop-unit-price>
                          {unitPrice} <span>/ unit</span>
                        </p>
                      )}
                      {variant && !variant.available && (
                        <p className={styles.availability}>Unavailable</p>
                      )}
                    </div>
                  )}
                </fieldset>

                <div className={styles.quantity}>
                  <span className={styles.label} id={`${id}-quantity-label`}>
                    <span className={styles.stepIndex} aria-hidden="true">
                      02
                    </span>
                    Quantity
                  </span>
                  <div
                    className={styles.stepper}
                    role="group"
                    aria-labelledby={`${id}-quantity-label`}
                    aria-describedby={
                      quantityRules ? `${id}-quantity-rules` : undefined
                    }
                  >
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
                  {quantityRules && (
                    <p
                      className={styles.quantityNote}
                      id={`${id}-quantity-rules`}
                    >
                      {quantityRules}
                    </p>
                  )}
                </div>

                <div className={styles.purchaseChoices}>
                  <PurchaseOptions />
                </div>
              </div>

              <div
                className={styles.checkout}
                role="group"
                aria-label="Order summary"
              >
                {layout === "receipt" && (
                  <div className={styles.receipt} data-shop-order-summary>
                    <p className={styles.receiptHeading}>Your order</p>
                    <p className={styles.receiptName}>{content.name}</p>
                    <dl className={styles.receiptLines}>
                      <div>
                        <dt>Selection</dt>
                        <dd>
                          {format} × {quantity}
                        </dd>
                      </div>
                      <div>
                        <dt>Unit price</dt>
                        <dd data-shop-unit-price>{unitPrice}</dd>
                      </div>
                    </dl>
                  </div>
                )}
                <div className={styles.total} aria-live="polite">
                  <span className={styles.label}>Total</span>
                  <strong data-shop-total>
                    {validTotal ? model.priceLabel : "—"}
                  </strong>
                </div>
                <div className={styles.add}>
                  <AddToCartButton
                    available={Boolean(variant?.available)}
                    pending={cart.adding}
                    disabled={cart.busy || !eligible}
                    onAdd={addToCart}
                  />
                </div>
              </div>
            </div>

            <div className={styles.material}>
              <ProductInformation content={content} />
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
