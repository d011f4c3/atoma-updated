"use client";

import Image from "next/image";
import { useId } from "react";
import type { CatalogProduct } from "@/lib/catalog-types";
import { getOriginPreview } from "@/lib/origin-preview";
import { useCart } from "./cart-drawer";
import { useOrigins } from "./origins-provider";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./origin-preview.module.css";

export type OriginPreviewVariant =
  "sheet" | "split" | "index" | "panorama" | "record";

type OriginPreviewProps = {
  product: CatalogProduct;
  tone: "dark" | "light";
  variant: OriginPreviewVariant;
  onShop: () => void;
};

const placeKind: Record<string, string> = {
  country: "Country",
  region: "Region",
  locality: "Locality",
  field: "Field",
  designation: "Designation",
  growing: "Growing place",
  processing: "Processing",
};

export function OriginPreview({
  product,
  tone,
  variant,
  onShop,
}: OriginPreviewProps) {
  const { locale, t } = useStorefrontLocale();
  const id = useId();
  const { busy } = useCart();
  const { openOrigins } = useOrigins();
  const preview = getOriginPreview(product, undefined, undefined, locale);
  const records = [...preview.places, ...preview.designations];

  return (
    <section
      className={styles.root}
      data-origin-preview={variant}
      data-tone={tone}
      aria-labelledby={`${id}-product`}
    >
      <header className={styles.product}>
        <h2 id={`${id}-product`} tabIndex={-1} data-homepage-product-name>
          {preview.name}
        </h2>
        <span>{t("Origin")}</span>
      </header>

      {records.length ? (
        <div className={styles.places}>
          {records.map((place) => {
            const parents = place.parents;
            const photograph = place.photograph;

            return (
              <article
                key={place.id}
                className={styles.place}
                data-origin-place={
                  place.kind === "place" ? place.id : undefined
                }
                data-origin-designation={
                  place.kind === "designation" ? place.id : undefined
                }
                data-has-photo={Boolean(photograph)}
                aria-labelledby={`${id}-${place.id}`}
              >
                <div className={styles.visual}>
                  {photograph && (
                    <figure className={styles.photograph}>
                      <div className={styles.imageFrame}>
                        <Image
                          className={styles.image}
                          src={photograph.image}
                          alt={photograph.imageAlt}
                          fill
                          sizes={
                            variant === "sheet" || variant === "panorama"
                              ? "(max-width: 760px) calc(100vw - 40px), 40vw"
                              : "(max-width: 760px) 40vw, 20vw"
                          }
                        />
                      </div>
                      <figcaption className={styles.caption}>
                        <span>{photograph.imageCaption}</span>
                        <span className={styles.observation}>
                          {photograph.observation}
                        </span>
                      </figcaption>
                    </figure>
                  )}

                  <div className={styles.facts}>
                    <header className={styles.location}>
                      <div>
                        <p className={styles.label}>{place.roleLabel}</p>
                        <h3 id={`${id}-${place.id}`}>{place.name}</h3>
                      </div>
                      {parents && <p className={styles.parents}>{parents}</p>}
                    </header>
                    <ol
                      className={styles.hierarchy}
                      aria-label={place.hierarchyLabel}
                    >
                      {place.path.map((ancestor, index) => (
                        <li key={`${ancestor.kind}-${ancestor.name}-${index}`}>
                          <span className={styles.kind}>
                            {t(placeKind[ancestor.kind] ?? ancestor.kind)}
                          </span>
                          <span className={styles.placeName}>
                            {ancestor.name}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                <p className={styles.context}>
                  {place.context?.text ?? place.description}{" "}
                  <button
                    className={styles.regionLink}
                    type="button"
                    disabled={busy}
                    aria-haspopup="dialog"
                    onClick={() =>
                      openOrigins({
                        tone,
                        placeId: place.linkPlaceId,
                        returnProduct: {
                          title: product.title,
                          handle: product.handle,
                        },
                      })
                    }
                  >
                    {place.aboutLabel}
                    <span aria-hidden="true"> ↗</span>
                  </button>
                </p>

                <div className={styles.actions}>
                  <button
                    type="button"
                    disabled={busy}
                    aria-haspopup="dialog"
                    onClick={() =>
                      openOrigins({
                        tone,
                        placeId: place.linkPlaceId,
                        returnProduct: {
                          title: product.title,
                          handle: product.handle,
                        },
                      })
                    }
                  >
                    <span>{place.exploreLabel}</span>
                    <span aria-hidden="true">↗</span>
                  </button>
                  <button type="button" disabled={busy} onClick={onShop}>
                    <span>{t("Shop this matcha")}</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>
          <h3>{t("Product origin")}</h3>
          <p>{t("Origin details are not yet available for this matcha.")}</p>
          <div className={styles.actions}>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                openOrigins({
                  tone,
                  returnProduct: {
                    title: product.title,
                    handle: product.handle,
                  },
                })
              }
            >
              <span>{t("Browse origins")}</span>
              <span aria-hidden="true">↗</span>
            </button>
            <button type="button" disabled={busy} onClick={onShop}>
              <span>{t("Shop this matcha")}</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
