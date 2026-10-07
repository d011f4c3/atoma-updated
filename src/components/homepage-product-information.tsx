"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

import { useId, useRef } from "react";
import Image from "next/image";
import { getProductContent } from "@/lib/product-content";
import { getProductPlaceRecords, getPlacePath } from "@/lib/origins-model";
import { getOriginPreview } from "@/lib/origin-preview";
import { useOrigins } from "./origins-provider";
import { useCart } from "./cart-drawer";
import { FocusedSpecifications } from "./focused-specifications";
import type { ProductCodePlacement } from "@/lib/product-display-index";
import { ProductCodeIdentity } from "./product-code-identity";
import { ScrambleText } from "./scramble-text";
import { ProductDetails } from "./product-details";
import {
  OverviewStudyPanel,
  type OverviewStudyVariant,
} from "./overview-study-panel";
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
  overviewStudyVariant?: OverviewStudyVariant;
  productCodePlacement?: ProductCodePlacement;
};

export function HomepageProductInformation({
  model,
  view,
  tone,
  onShop,
  onSpecifications,
  originPreviewVariant = "current",
  overviewStudyVariant = "current",
  productCodePlacement,
}: HomepageProductInformationProps) {
  const { locale, t } = useStorefrontLocale();
  const id = useId();
  const root = useRef<HTMLElement>(null);
  const { busy } = useCart();
  const { openOrigins } = useOrigins();
  const { catalog, loading, product, retry } = model;
  const products = catalog?.products ?? [];
  const unavailable = !catalog || catalog.status === "unavailable";
  const ready = !loading && !unavailable && products.length > 0;
  const content =
    ready && product ? getProductContent(product, locale) : undefined;
  // The current product view has no chosen lot. Never flatten lot-only evidence
  // into a product-wide growing claim; the graph retains those scoped records.
  const originRecords = product
    ? getProductPlaceRecords(product.handle).filter((record) =>
        record.subjects.some((subject) => subject.kind === "material"),
      )
    : [];
  const originPreview = product
    ? getOriginPreview(product, undefined, undefined, locale)
    : null;
  const displayOrigins = originPreview
    ? [...originPreview.places, ...originPreview.designations]
    : [];
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
      aria-label={t("Matcha information")}
      aria-busy={loading}
      tabIndex={-1}
    >
      {loading || !ready || !content ? (
        <div className={styles.state}>
          <h2 className={styles.heading} tabIndex={-1}>
            {t("Explore matcha.")}
          </h2>
          <p role="status">
            {t(
              loading
                ? "Opening the collection…"
                : unavailable
                  ? "The collection couldn’t be loaded. Please try again."
                  : products.length === 0
                    ? "There are no matcha to explore just yet."
                    : "Select a matcha to explore its material.",
            )}
          </p>
          {!loading && (!ready || !content) && (
            <button
              className={styles.secondary}
              type="button"
              disabled={busy}
              onClick={retryCollection}
            >
              {t(unavailable ? "Try again" : "Check again")}
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
            {overviewStudyVariant !== "current" && product ? (
              <OverviewStudyPanel
                product={product}
                variant={overviewStudyVariant}
                productCodePlacement={productCodePlacement}
                busy={busy}
                onShop={onShop}
                onSpecifications={onSpecifications}
              />
            ) : (
              <>
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
                        text={t("View specifications")}
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
                      text={t("Shop this matcha")}
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
              </>
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
                  {displayOrigins.length ? (
                    <div className={styles.originPlaces}>
                      {displayOrigins.map((record) => {
                        const photograph = record.photograph;
                        const path = record.parents;
                        return (
                          <article
                            className={styles.originCard}
                            key={record.id}
                            aria-labelledby={`${id}-origin-${record.id}`}
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
                                  <p className={styles.originRole}>
                                    {record.roleLabel}
                                  </p>
                                  <h3
                                    className={styles.originName}
                                    id={`${id}-origin-${record.id}`}
                                  >
                                    {record.name}
                                  </h3>
                                </div>
                                {path && (
                                  <p className={styles.originPath}>{path}</p>
                                )}
                              </div>
                              <p className={styles.originDescription}>
                                {record.description}
                              </p>
                              <button
                                className={styles.originExplore}
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  openOrigins({
                                    tone,
                                    placeId: record.linkPlaceId,
                                  })
                                }
                              >
                                <span>
                                  {t("Explore {place}", { place: record.name })}
                                </span>
                                <span aria-hidden="true">↗</span>
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.originEmpty}>
                      <h3>{t("Product origin")}</h3>
                      <p>
                        {t(
                          "Origin details are not yet available for this matcha.",
                        )}
                      </p>
                    </div>
                  )}
                  {otherOrigins.length > 0 && (
                    <dl className={styles.otherOrigins}>
                      {otherOrigins.map((record) => (
                        <div key={`${record.role}-${record.place.id}`}>
                          <dt>
                            {t(
                              {
                                grown: "Grown in",
                                processed: "Processed in",
                                packed: "Packed in",
                                selected: "Selected in",
                                dispatched: "Ships from",
                              }[record.role],
                            )}
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
                                .map((place) => t(place.name))
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
                    <span>{t("All origins")}</span>{" "}
                    <span aria-hidden="true">↗</span>
                  </button>
                  <button
                    className={styles.originFooterLink}
                    type="button"
                    disabled={busy}
                    onClick={onShop}
                  >
                    <span>{t("Shop this matcha")}</span>
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
