"use client";

import { useId, useRef } from "react";
import Image from "next/image";
import { getProductContent } from "@/lib/product-content";
import { getProductPlaceRecords, getPlacePath } from "@/lib/origins-model";
import { FIELD_ENTRIES } from "@/lib/origins-content";
import { useOrigins } from "./origins-provider";
import { useCart } from "./cart-drawer";
import { FocusedSpecifications } from "./focused-specifications";
import type { ProductCodePlacement } from "@/lib/product-display-index";
import { ProductCodeIdentity } from "./product-code-identity";
import { ScrambleText } from "./scramble-text";
import { ProductDetails } from "./product-details";
import { OriginPreview, type OriginPreviewVariant } from "./origin-preview";
import type { ProductSelectionModel } from "./use-product-selection";
import styles from "./homepage-product-information.module.css";

type HomepageProductInformationProps = {
  model: ProductSelectionModel;
  view: "overview" | "specifications" | "origins";
  tone: "dark" | "light";
  onShop: () => void;
  onSpecifications?: () => void;
  originPreviewVariant?: "current" | OriginPreviewVariant;
  productCodePlacement?: ProductCodePlacement;
};

function getPlacePhotograph(placeId: string) {
  for (const place of getPlacePath(placeId).reverse()) {
    const entry = FIELD_ENTRIES.find((item) =>
      item.placeIds.includes(place.id),
    );
    if (entry?.image) return entry;
  }
}

export function HomepageProductInformation({
  model,
  view,
  tone,
  onShop,
  onSpecifications,
  originPreviewVariant = "current",
  productCodePlacement,
}: HomepageProductInformationProps) {
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const { busy } = useCart();
  const { openOrigins } = useOrigins();
  const { catalog, loading, product, retry } = model;
  const products = catalog?.products ?? [];
  const unavailable = !catalog || catalog.status === "unavailable";
  const ready = !loading && !unavailable && products.length > 0;
  const content = ready && product ? getProductContent(product) : undefined;
  // The current product view has no chosen lot. Never flatten lot-only evidence
  // into a product-wide growing claim; the graph retains those scoped records.
  const originRecords = product
    ? getProductPlaceRecords(product.handle).filter((record) =>
        record.subjects.some((subject) => subject.kind === "material"),
      )
    : [];
  const growingOrigins = originRecords.filter(
    (record) => record.role === "grown",
  );
  const otherOrigins = originRecords.filter(
    (record) => record.role !== "grown",
  );

  function retryCollection() {
    root.current?.focus({ preventScroll: true });
    retry();
  }

  return (
    <section
      ref={root}
      className={styles.root}
      data-homepage-product-information
      data-view={view}
      data-tone={tone}
      aria-label="Matcha information"
      aria-busy={loading}
      tabIndex={-1}
    >
      {loading || !ready || !content ? (
        <div className={styles.state}>
          <h2 className={styles.heading} tabIndex={-1}>
            Explore matcha.
          </h2>
          <p role="status">
            {loading
              ? "Opening the collection…"
              : unavailable
                ? "The collection couldn’t be loaded. Please try again."
                : products.length === 0
                  ? "There are no matcha to explore just yet."
                  : "Select a matcha to explore its material."}
          </p>
          {!loading && (!ready || !content) && (
            <button
              className={styles.secondary}
              type="button"
              disabled={busy}
              onClick={retryCollection}
            >
              {unavailable ? "Try again" : "Check again"}
              <span aria-hidden="true">↻</span>
            </button>
          )}
        </div>
      ) : (
        <div className={styles.panels} data-homepage-product={product?.id}>
          <div
            className={styles.panel}
            id={`${id}-overview`}
            data-homepage-view-panel="overview"
            hidden={view !== "overview"}
          >
            <ProductCodeIdentity
              className={styles.identity}
              placement={productCodePlacement}
              handle={product?.handle}
            >
              <h2
                className={styles.heading}
                tabIndex={-1}
                data-homepage-product-name
              >
                {content.name}
              </h2>
              <p className={styles.application}>{content.application}</p>
            </ProductCodeIdentity>
            <p className={styles.purpose}>{content.purpose}</p>
            <p className={styles.summary}>{content.summary}</p>
            <div className={styles.actions}>
              {onSpecifications && (
                <button
                  className={styles.secondary}
                  type="button"
                  disabled={busy}
                  onClick={onSpecifications}
                >
                  <ScrambleText
                    text="View specifications"
                    interactive
                    animateOnMount={false}
                    wrap
                  />
                  <span aria-hidden="true">+</span>
                </button>
              )}
              <button
                className={styles.shop}
                type="button"
                disabled={busy}
                onClick={onShop}
              >
                <ScrambleText
                  text="Shop this matcha"
                  interactive
                  animateOnMount={false}
                  wrap
                />
                <span aria-hidden="true">→</span>
              </button>
            </div>
            {product && (
              <ProductDetails
                product={product}
                tone={tone}
                presentation="inline"
              />
            )}
          </div>

          <div
            className={styles.panel}
            id={`${id}-specifications`}
            data-homepage-view-panel="specifications"
            hidden={view !== "specifications"}
          >
            <FocusedSpecifications
              product={product}
              tone={tone}
              presentation="homepage"
              productCodePlacement={productCodePlacement}
            />
          </div>

          <div
            className={styles.panel}
            id={`${id}-origins`}
            data-homepage-view-panel="origins"
            hidden={view !== "origins"}
          >
            {originPreviewVariant !== "current" && product ? (
              <OriginPreview
                product={product}
                tone={tone}
                variant={originPreviewVariant}
                onShop={onShop}
              />
            ) : (
              <>
                <header className={styles.originIdentity}>
                  <h2
                    className={styles.originProduct}
                    tabIndex={-1}
                    data-homepage-product-name
                  >
                    {content.name}
                  </h2>
                </header>
                <div className={styles.originRecord}>
                  {growingOrigins.length ? (
                    <div className={styles.originPlaces}>
                      {growingOrigins.map((record) => {
                        const photograph = getPlacePhotograph(record.place.id);
                        const path = getPlacePath(record.place.id)
                          .slice(0, -1)
                          .reverse()
                          .map((place) => place.name)
                          .join(", ");
                        return (
                          <article
                            className={styles.originCard}
                            key={record.place.id}
                            aria-labelledby={`${id}-origin-${record.place.id}`}
                          >
                            {photograph && (
                              <figure className={styles.originPhoto}>
                                <div className={styles.originPhotoFrame}>
                                  <Image
                                    className={styles.originImage}
                                    src={photograph.image}
                                    alt={photograph.imageAlt}
                                    fill
                                    sizes="(max-width: 760px) calc(100vw - 40px), 40vw"
                                  />
                                </div>
                                <figcaption className={styles.originCaption}>
                                  {photograph.imageCaption}
                                </figcaption>
                              </figure>
                            )}
                            <div className={styles.originCardBody}>
                              <div className={styles.originPlaceHeading}>
                                <div>
                                  <p className={styles.originRole}>Grown in</p>
                                  <h3
                                    className={styles.originName}
                                    id={`${id}-origin-${record.place.id}`}
                                  >
                                    {record.place.name}
                                  </h3>
                                </div>
                                {path && (
                                  <p className={styles.originPath}>{path}</p>
                                )}
                              </div>
                              <p className={styles.originDescription}>
                                {record.place.description}
                              </p>
                              <button
                                className={styles.originExplore}
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  openOrigins({
                                    tone,
                                    placeId: record.place.id,
                                  })
                                }
                              >
                                <span>Explore {record.place.name}</span>
                                <span aria-hidden="true">↗</span>
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.originEmpty}>
                      <h3>Product origin</h3>
                      <p>
                        Origin details are not yet available for this matcha.
                      </p>
                    </div>
                  )}
                  {otherOrigins.length > 0 && (
                    <dl className={styles.otherOrigins}>
                      {otherOrigins.map((record) => (
                        <div key={`${record.role}-${record.place.id}`}>
                          <dt>
                            {
                              {
                                grown: "Grown in",
                                processed: "Processed in",
                                packed: "Packed in",
                                selected: "Selected in",
                                dispatched: "Ships from",
                              }[record.role]
                            }
                          </dt>
                          <dd>
                            <button
                              className={styles.originPlaceLink}
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                openOrigins({ tone, placeId: record.place.id })
                              }
                            >
                              {getPlacePath(record.place.id)
                                .reverse()
                                .map((place) => place.name)
                                .join(", ")}
                              <span aria-hidden="true">↗</span>
                            </button>
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
                <div className={styles.originActions}>
                  <button
                    className={styles.originFooterLink}
                    type="button"
                    disabled={busy}
                    onClick={() => openOrigins({ tone })}
                  >
                    <span>All origins</span> <span aria-hidden="true">↗</span>
                  </button>
                  <button
                    className={styles.originFooterLink}
                    type="button"
                    disabled={busy}
                    onClick={onShop}
                  >
                    <span>Shop this matcha</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
