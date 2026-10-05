"use client";

import { useId, useRef, useState } from "react";
import { getProductContent } from "@/lib/product-content";
import { canPurchaseQuantity, money } from "@/lib/product-selection";
import { AddToCartButton } from "./add-to-cart-button";
import { useCart } from "./cart-drawer";
import { PurchaseOptions } from "./purchase-options";
import type { ProductSelectionModel } from "./use-product-selection";
import styles from "./laboratory-collection.module.css";

export function LaboratoryCollection({
  selection,
  onPendingChange,
}: {
  selection: ProductSelectionModel;
  onPendingChange: (pending: boolean) => void;
}) {
  const id = useId();
  const cart = useCart();
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const { product, variant, quantity } = selection;
  const content = getProductContent(product);
  const locked = pending || cart.busy;
  const purchasable = canPurchaseQuantity(variant, quantity);
  const safeTotal =
    variant && Number.isSafeInteger(variant.priceMinor * quantity);

  async function add() {
    if (!product || !variant || !purchasable || locked || submitting.current)
      return;
    submitting.current = true;
    setPending(true);
    onPendingChange(true);
    try {
      await cart.addItem(product.handle, variant.id, quantity);
    } finally {
      submitting.current = false;
      setPending(false);
      onPendingChange(false);
    }
  }

  if (!product) return null;

  return (
    <section className={styles.purchase} aria-labelledby={`${id}-title`}>
      <header className={styles.heading}>
        <p className={styles.eyebrow}>Your selection</p>
        <h2 id={`${id}-title`}>{content.name}</h2>
        <div className={styles.byline}>
          <span>{content.application}</span>
          <span
            className={styles.availability}
            data-available={Boolean(variant?.available)}
          >
            <i aria-hidden="true" />
            {variant?.available ? "Available" : "Unavailable"}
          </span>
        </div>
      </header>
      <fieldset className={styles.controls} disabled={locked}>
        <legend className={styles.screenReaderOnly}>Format and quantity</legend>
        <div className={styles.format}>
          <span id={`${id}-format-label`}>Format</span>
          {product.variants.length === 1 && variant ? (
            <span id={`${id}-format`} className={styles.formatValue}>
              {variant.title === "Default Title" ? "Standard" : variant.title}
            </span>
          ) : product.variants.length > 1 ? (
            <select
              id={`${id}-format`}
              aria-labelledby={`${id}-format-label`}
              value={variant?.id ?? ""}
              onChange={(event) => {
                if (event.target.value !== variant?.id)
                  selection.selectVariant(event.target.value);
              }}
            >
              {product.variants.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title === "Default Title" ? "Standard" : option.title}
                  {!option.available ? " — unavailable" : ""}
                </option>
              ))}
            </select>
          ) : (
            <span>No published format</span>
          )}
        </div>
        <div className={styles.quantityRow}>
          <span id={`${id}-quantity`}>Quantity</span>
          <div
            className={styles.stepper}
            role="group"
            aria-labelledby={`${id}-quantity`}
          >
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={!variant?.available || quantity <= variant.minimum}
              onClick={selection.decrementQuantity}
            >
              −
            </button>
            <output aria-label="Selected quantity" aria-live="polite">
              {quantity}
            </output>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={!variant?.available || !selection.canIncrement}
              onClick={selection.incrementQuantity}
            >
              +
            </button>
          </div>
        </div>
        {variant &&
          (variant.minimum > 1 ||
            variant.increment > 1 ||
            variant.maximum !== null) && (
            <p className={styles.quantityNote}>
              Minimum {variant.minimum} · Increments of {variant.increment}
              {variant.maximum !== null && ` · Maximum ${variant.maximum}`}
            </p>
          )}
      </fieldset>
      <div className={styles.total}>
        <div>
          <span>Selection total</span>
          <small>One-time purchase</small>
        </div>
        <output aria-live="polite" aria-label="Selection total">
          {variant && safeTotal
            ? money(variant.priceMinor * quantity, variant.currency)
            : "—"}
        </output>
      </div>
      <AddToCartButton
        available={Boolean(variant?.available)}
        pending={pending}
        disabled={locked || !purchasable}
        onAdd={() => void add()}
      />
      {variant?.available && !purchasable && (
        <p className={styles.quantityNote}>
          This quantity is currently unavailable.
        </p>
      )}
      {cart.error && (
        <p className={styles.error} role="alert">
          {cart.error}
        </p>
      )}
      <details className={styles.purchaseOptions}>
        <summary>
          Purchase options <span aria-hidden="true">+</span>
        </summary>
        <PurchaseOptions />
      </details>
    </section>
  );
}
