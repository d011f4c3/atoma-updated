"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

import type { CatalogProduct } from "@/lib/catalog-types";
import { getProductContent } from "@/lib/product-content";
import { getProductFieldEntries } from "@/lib/origins-content";
import {
  getPlacePath,
  getProductPlaceRecords,
  getProductDesignations,
} from "@/lib/origins-model";
import { useCart } from "./cart-drawer";
import { useOrigins } from "./origins-provider";
import { ProductDetails } from "./product-details";
import styles from "./retail-product-information.module.css";

type RetailProductInformationProps = {
  product: CatalogProduct;
  tone: "dark" | "light";
};

const originRoles = {
  grown: "Grown in",
  processed: "Processed in",
  packed: "Packed in",
  selected: "Selected in",
  dispatched: "Ships from",
};

export function RetailProductInformation({
  product,
  tone,
}: RetailProductInformationProps) {
  const { locale, t } = useStorefrontLocale();
  const content = getProductContent(product, locale);
  const { busy } = useCart();
  const { openOrigins } = useOrigins();
  // No lot is selected on this page. Keep origin claims at material scope;
  // the canonical field-note lookup retains its own editorial connections.
  const originRecords = getProductPlaceRecords(product.handle).filter(
    (record) => record.subjects.some((subject) => subject.kind === "material"),
  );
  const originContexts = [
    ...originRecords.map((record) => ({
      id: `${record.role}-${record.place.id}`,
      label: t(originRoles[record.role]),
      name: t(record.place.name),
      path: getPlacePath(record.place.id)
        .slice(0, -1)
        .reverse()
        .map((place) => t(place.name))
        .join(", "),
      paragraphs: [t(record.place.description)],
      placeId: record.place.id,
      action: t("Explore {place}", { place: t(record.place.name) }),
    })),
    ...getProductDesignations(product.handle).map((designation) => ({
      id: designation.id,
      label: t("Tea designation"),
      name: t(designation.name),
      path: t("Kyoto, Japan · regional context"),
      paragraphs: [t(designation.summary), t(designation.productNote)],
      placeId: designation.contextPlaceId,
      action: t("About Uji"),
    })),
  ];
  const fieldEntries = getProductFieldEntries(product.handle);
  const returnProduct = { title: product.title, handle: product.handle };

  return (
    <section
      className={styles.root}
      data-retail-product-information
      data-tone={tone}
      aria-label={t("Information about {product}", { product: content.name })}
    >
      <details
        className={styles.accordion}
        id="retail-specifications"
        open
        data-retail-specifications
      >
        <summary className={styles.trigger}>
          <span>{t("Specifications")}</span>
          <span className={styles.plus} aria-hidden="true">
            +
          </span>
        </summary>
        <div className={styles.body}>
          <ul
            className={styles.properties}
            aria-label={t("Material specifications")}
          >
            {content.materialProfile.map((property, index) => (
              <li key={index}>
                <details className={styles.property} data-retail-specification>
                  <summary>
                    <span className={styles.propertyLabel}>
                      {property.label}
                    </span>
                    <span className={styles.propertyValue}>
                      {property.value}
                    </span>
                    <span className={styles.plus} aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p className={styles.explanation}>{property.explanation}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </details>

      <details className={styles.accordion} data-retail-material-use>
        <summary className={styles.trigger}>
          <span>{t("Material & use")}</span>
          <span className={styles.plus} aria-hidden="true">
            +
          </span>
        </summary>
        <div className={`${styles.body} ${styles.prose}`}>
          <section>
            <h3>{t("Use & preparation")}</h3>
            <p>{content.preparation}</p>
          </section>
          {content.sections.map((section) => (
            <section key={section.id}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </section>
          ))}
          <section>
            <h3>{t("What to look for")}</h3>
            <ul>
              {content.lookFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <p className={styles.selectionNote}>{content.selectionNote}</p>
        </div>
      </details>

      <ProductDetails product={product} tone={tone} />

      <details
        className={styles.accordion}
        id="retail-origins"
        data-retail-origins
      >
        <summary className={styles.trigger}>
          <span>{t("Origins & field notes")}</span>
          <span className={styles.plus} aria-hidden="true">
            +
          </span>
        </summary>
        <div className={`${styles.body} ${styles.prose}`}>
          {originContexts.length ? (
            <div className={styles.places}>
              {originContexts.map((record) => (
                <section key={record.id}>
                  <p className={styles.caption}>{record.label}</p>
                  <h3 className={styles.placeName}>{record.name}</h3>
                  <p className={styles.placePath}>{record.path}</p>
                  {record.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <button
                    className={styles.action}
                    type="button"
                    aria-haspopup="dialog"
                    disabled={busy}
                    onClick={() =>
                      openOrigins({
                        tone,
                        placeId: record.placeId,
                        returnProduct,
                      })
                    }
                  >
                    {record.action}
                    <span aria-hidden="true">↗</span>
                  </button>
                </section>
              ))}
            </div>
          ) : (
            <section>
              <h3>{t("Product origin")}</h3>
              <p>
                {t("Origin details have not been published for this matcha.")}
              </p>
            </section>
          )}
          {content.originNote && <p>{content.originNote}</p>}
          {fieldEntries.length > 0 && (
            <section
              className={styles.fieldNotes}
              aria-label={t("Related field notes")}
            >
              <h3>{t("Related field notes")}</h3>
              {fieldEntries.map((entry) => (
                <button
                  className={styles.fieldEntry}
                  key={entry.slug}
                  type="button"
                  aria-haspopup="dialog"
                  disabled={busy}
                  onClick={() =>
                    openOrigins({ tone, entry: entry.slug, returnProduct })
                  }
                >
                  <span className={styles.caption}>{t(entry.region)}</span>
                  <span className={styles.entryTitle}>
                    {t(entry.title)}
                    <span aria-hidden="true">↗</span>
                  </span>
                  <span className={styles.entryDescription}>
                    {t(entry.dek)}
                  </span>
                </button>
              ))}
            </section>
          )}
          <button
            className={styles.action}
            type="button"
            aria-haspopup="dialog"
            disabled={busy}
            onClick={() => openOrigins({ tone, returnProduct })}
          >
            {t("All origins")}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </details>
    </section>
  );
}
