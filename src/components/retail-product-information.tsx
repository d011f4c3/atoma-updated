"use client";

import type { CatalogProduct } from "@/lib/catalog-types";
import { getProductContent } from "@/lib/product-content";
import { getProductFieldEntries } from "@/lib/origins-content";
import { getPlacePath, getProductPlaceRecords } from "@/lib/origins-model";
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
  const content = getProductContent(product);
  const { busy } = useCart();
  const { openOrigins } = useOrigins();
  // No lot is selected on this page. Keep origin claims at material scope;
  // the canonical field-note lookup retains its own editorial connections.
  const originRecords = getProductPlaceRecords(product.handle).filter(
    (record) => record.subjects.some((subject) => subject.kind === "material"),
  );
  const fieldEntries = getProductFieldEntries(product.handle);
  const returnLabel = `Return to ${content.name}`;

  return (
    <section
      className={styles.root}
      data-retail-product-information
      data-tone={tone}
      aria-label={`Information about ${content.name}`}
    >
      <details
        className={styles.accordion}
        id="retail-specifications"
        open
        data-retail-specifications
      >
        <summary className={styles.trigger}>
          <span>Specifications</span>
          <span className={styles.plus} aria-hidden="true">
            +
          </span>
        </summary>
        <div className={styles.body}>
          <ul
            className={styles.properties}
            aria-label="Material specifications"
          >
            {content.materialProfile.map((property) => (
              <li key={property.label}>
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
          <span>Material & use</span>
          <span className={styles.plus} aria-hidden="true">
            +
          </span>
        </summary>
        <div className={`${styles.body} ${styles.prose}`}>
          <section>
            <h3>Use & preparation</h3>
            <p>{content.preparation}</p>
          </section>
          {content.sections.map((section) => (
            <section key={section.id}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </section>
          ))}
          <section>
            <h3>What to look for</h3>
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
          <span>Origins & field notes</span>
          <span className={styles.plus} aria-hidden="true">
            +
          </span>
        </summary>
        <div className={`${styles.body} ${styles.prose}`}>
          {originRecords.length ? (
            <div className={styles.places}>
              {originRecords.map((record) => (
                <section key={`${record.role}-${record.place.id}`}>
                  <p className={styles.caption}>{originRoles[record.role]}</p>
                  <h3 className={styles.placeName}>{record.place.name}</h3>
                  <p className={styles.placePath}>
                    {getPlacePath(record.place.id)
                      .slice(0, -1)
                      .reverse()
                      .map((place) => place.name)
                      .join(", ")}
                  </p>
                  <p>{record.place.description}</p>
                  <button
                    className={styles.action}
                    type="button"
                    aria-haspopup="dialog"
                    disabled={busy}
                    onClick={() =>
                      openOrigins({
                        tone,
                        placeId: record.place.id,
                        returnLabel,
                      })
                    }
                  >
                    Explore {record.place.name}
                    <span aria-hidden="true">↗</span>
                  </button>
                </section>
              ))}
            </div>
          ) : (
            <section>
              <h3>Product origin</h3>
              <p>Origin details have not been published for this matcha.</p>
            </section>
          )}
          {content.originNote && <p>{content.originNote}</p>}
          {fieldEntries.length > 0 && (
            <section
              className={styles.fieldNotes}
              aria-label="Related field notes"
            >
              <h3>Related field notes</h3>
              {fieldEntries.map((entry) => (
                <button
                  className={styles.fieldEntry}
                  key={entry.slug}
                  type="button"
                  aria-haspopup="dialog"
                  disabled={busy}
                  onClick={() =>
                    openOrigins({ tone, entry: entry.slug, returnLabel })
                  }
                >
                  <span className={styles.caption}>{entry.region}</span>
                  <span className={styles.entryTitle}>
                    {entry.title}
                    <span aria-hidden="true">↗</span>
                  </span>
                  <span className={styles.entryDescription}>{entry.dek}</span>
                </button>
              ))}
            </section>
          )}
          <button
            className={styles.action}
            type="button"
            aria-haspopup="dialog"
            disabled={busy}
            onClick={() => openOrigins({ tone, returnLabel })}
          >
            All origins<span aria-hidden="true">↗</span>
          </button>
        </div>
      </details>
    </section>
  );
}
