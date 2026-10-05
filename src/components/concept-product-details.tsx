"use client";

import { useId, useRef, useState } from "react";
import { getProductContent } from "@/lib/product-content";
import { canPurchaseQuantity, money } from "@/lib/product-selection";
import type { ProductSelectionModel } from "./use-product-selection";
import { useCart } from "./cart-drawer";
import { AddToCartButton } from "./add-to-cart-button";
import { PurchaseOptions } from "./purchase-options";
import styles from "./concept-product-details.module.css";

export function ConceptProductDetails({
  selection,
  tone,
  view = "all",
  onExplore,
}: {
  selection: ProductSelectionModel;
  tone: "dark" | "light";
  view?: "all" | "shop";
  onExplore?: () => void;
}) {
  const id = useId();
  const cart = useCart();
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const { product, variant, quantity, priceLabel } = selection;
  const content = getProductContent(product);
  const locked = pending || cart.busy;
  const available = canPurchaseQuantity(variant, quantity);

  async function add() {
    if (!product || !variant || !available || locked || submitting.current)
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

  if (!product) {
    return (
      <div
        className={styles.root}
        data-tone={tone}
        data-view={view}
        data-concept-product-details
      >
        <div className={styles.state} role="status" id="shop">
          <span className={styles.eyebrow}>
            02 / Specifications & selection
          </span>
          <h2>
            {selection.loading
              ? "Opening the collection…"
              : selection.catalog?.status === "empty"
                ? "The next selection is taking shape."
                : "The collection couldn’t be loaded."}
          </h2>
          {!selection.loading && selection.catalog?.status !== "empty" && (
            <button type="button" onClick={selection.retry}>
              Try again <span aria-hidden="true">↻</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.root}
      data-tone={tone}
      data-view={view}
      data-concept-product-details
    >
      <div className={styles.rule}>
        <span>02 / The details</span>
        <span>Material → Selection</span>
      </div>
      <div className={styles.layout}>
        <div className={styles.material}>
          <header className={styles.heading}>
            <p className={styles.eyebrow}>Specifications & use</p>
            <h2 data-concept-product-name>{content.name}</h2>
            <p className={styles.intro}>{content.materialSummary}</p>
          </header>
          <div className={styles.profileHeader}>
            <span>Sample material profiles</span>
            <span>Expand to explore +</span>
          </div>
          <div className={styles.profiles} key={product.id}>
            {content.materialProfile.map((profile) => (
              <details className={styles.profile} key={profile.label}>
                <summary>
                  <span>{profile.label}</span>
                  <span>{profile.value}</span>
                  <span className={styles.plus} aria-hidden="true">
                    +
                  </span>
                </summary>
                <p>{profile.explanation}</p>
              </details>
            ))}
          </div>
          <details className={styles.preparation} key={`${product.id}-use`}>
            <summary>
              <span>In practice / {content.application}</span>
              <span className={styles.plus} aria-hidden="true">
                +
              </span>
            </summary>
            <p>{content.preparation}</p>
            <ul>
              {content.lookFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </details>
          <p className={styles.disclosure}>
            Illustrative sensory notes. These profiles are not measured lot
            specifications.
          </p>
        </div>
        <aside
          className={styles.purchase}
          id="shop"
          data-concept-purchase
          aria-labelledby={`${id}-shop`}
        >
          <div className={styles.purchaseTop}>
            <p className={styles.eyebrow}>Make your selection</p>
            <span
              className={styles.availability}
              data-available={Boolean(variant?.available)}
            >
              {variant?.available ? "Available" : "Unavailable"}
            </span>
          </div>
          <h3 id={`${id}-shop`}>{content.name}</h3>
          <p className={styles.application}>{content.application}</p>
          <fieldset className={styles.controls} disabled={locked}>
            <label htmlFor={`${id}-format`}>Format</label>
            <select
              id={`${id}-format`}
              value={variant?.id ?? ""}
              onChange={(event) => selection.selectVariant(event.target.value)}
            >
              {product.variants.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title === "Default Title" ? "Standard" : option.title}
                  {!option.available ? " — unavailable" : ""}
                </option>
              ))}
            </select>
            <div className={styles.quantityRow}>
              <span id={`${id}-quantity`}>Quantity</span>
              <div
                className={styles.quantity}
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
                <output aria-live="polite" aria-label="Selected quantity">
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
          </fieldset>
          {view === "shop" ? (
            <details className={styles.purchaseOptions}>
              <summary>
                <span>One-time purchase</span>
                <span>Options +</span>
              </summary>
              <PurchaseOptions />
            </details>
          ) : (
            <PurchaseOptions />
          )}
          <div className={styles.total}>
            <span>Selection total</span>
            <output aria-live="polite" aria-label="Selection total">
              {priceLabel || "—"}
            </output>
          </div>
          {variant && (
            <p className={styles.unitPrice}>
              {money(variant.priceMinor, variant.currency)} per selected format
            </p>
          )}
          <AddToCartButton
            available={available}
            pending={pending}
            disabled={locked}
            onAdd={add}
          />
          {cart.error && (
            <p className={styles.error} role="alert">
              {cart.error}
            </p>
          )}
          {onExplore ? (
            <button
              className={styles.return}
              type="button"
              disabled={locked}
              onClick={onExplore}
            >
              Explore another matcha <span aria-hidden="true">↗</span>
            </button>
          ) : (
            <a className={styles.return} href="#product">
              Explore another matcha <span aria-hidden="true">↗</span>
            </a>
          )}
        </aside>
      </div>
    </div>
  );
}
