"use client";

import { useId, useRef } from "react";
import { getProductContent } from "@/lib/product-content";
import { MaterialProfile } from "./material-profile";
import { ProductInformation } from "./product-information";
import { ScrambleText } from "./scramble-text";
import type { ProductSelectionModel } from "./use-product-selection";
import styles from "./matcha-explorer.module.css";

export function MatchaExplorer({
  model,
  onShop,
}: {
  model: ProductSelectionModel;
  onShop: () => void;
}) {
  const id = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { catalog, loading, product, selectProduct, retry } = model;
  const unavailable = !catalog || catalog.status === "unavailable";
  const products = catalog?.products ?? [];
  const ready = !loading && !unavailable && products.length > 0;
  const content = ready && product ? getProductContent(product) : undefined;

  function retryCollection() {
    // The heading remains mounted through loading and results. Move focus
    // before removing this button; never reclaim it after the request finishes.
    headingRef.current?.focus({ preventScroll: true });
    retry();
  }

  return (
    <section className={styles.explorer} aria-labelledby={`${id}-title`}>
      {ready && (
        <div
          className={styles.products}
          role="group"
          aria-label="Matcha to explore"
        >
          {products.map((item) => (
            <button
              className={styles.productChoice}
              type="button"
              key={item.id}
              aria-pressed={item.id === product?.id}
              aria-controls={`${id}-details`}
              onClick={() => {
                if (item.id !== product?.id) selectProduct(item.id);
              }}
            >
              <ScrambleText
                text={getProductContent(item).name}
                interactive
                wrap
              />
            </button>
          ))}
        </div>
      )}
      <div id={`${id}-details`} className={styles.details} key="details">
        <h2
          ref={headingRef}
          className={styles.heading}
          id={`${id}-title`}
          tabIndex={-1}
        >
          {ready ? (content?.name ?? "Choose a matcha.") : "Explore matcha."}
        </h2>
        {loading ? (
          <p className={styles.state} role="status">
            Opening the collection…
          </p>
        ) : unavailable || products.length === 0 ? (
          <>
            <p className={styles.state} role="status">
              {unavailable
                ? "The collection couldn’t be loaded. Please try again."
                : "There are no matcha to explore just yet."}
            </p>
            <button
              className={styles.retry}
              type="button"
              onClick={retryCollection}
            >
              {unavailable ? "Try again" : "Check again"}{" "}
              <span aria-hidden="true">↻</span>
            </button>
          </>
        ) : content ? (
          <>
            <p className={styles.purpose}>
              <ScrambleText text={content.purpose} periodic connected wrap />
            </p>
            <p className={styles.summary}>
              <ScrambleText text={content.summary} periodic wrap />
            </p>
            <MaterialProfile content={content} />
            <div className={styles.actions}>
              <ProductInformation content={content} />
              <button className={styles.shop} type="button" onClick={onShop}>
                <ScrambleText text="Shop this matcha" interactive wrap />
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </>
        ) : (
          <p className={styles.state}>
            Select a matcha to explore its material.
          </p>
        )}
      </div>
    </section>
  );
}
