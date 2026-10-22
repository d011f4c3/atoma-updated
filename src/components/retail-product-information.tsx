"use client";

import { useId, useRef, useState } from "react";
import type { CatalogProduct } from "@/lib/catalog-types";
import { getProductContent } from "@/lib/product-content";
import { getProductFacts } from "@/lib/product-details";
import { getProductFieldEntries } from "@/lib/origins-content";
import {
  getPlacePath,
  getProductPlaceRecords,
  getProductDesignations,
} from "@/lib/origins-model";
import { useCart } from "./cart-drawer";
import { useOrigins } from "./origins-provider";
import { ScrambleText } from "./scramble-text";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./retail-product-information.module.css";

type RetailProductInformationProps = {
  product: CatalogProduct;
  tone: "dark" | "light";
  refreshing?: boolean;
};

type LearningView = "profile" | "preparation" | "origin";
const views: readonly { key: LearningView; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "preparation", label: "Preparation" },
  { key: "origin", label: "Origin" },
];
const originRoles = {
  grown: "Grown in",
  processed: "Processed in",
  packed: "Packed in",
  selected: "Selected in",
  dispatched: "Ships from",
};

/** One focused reader, with complete values and no repeated purchase controls. */
export function RetailProductInformation({
  product,
  tone,
}: RetailProductInformationProps) {
  const { locale, t } = useStorefrontLocale();
  const { busy } = useCart();
  const { openOrigins } = useOrigins();
  const [view, setView] = useState<LearningView>("profile");
  const [propertyIndex, setPropertyIndex] = useState(1);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const id = useId();
  const content = getProductContent(product, locale);
  const facts = getProductFacts(product.handle, undefined, locale);
  const property = content.materialProfile[propertyIndex];
  // The flavour leads the same seven authored properties; there is no score or
  // inferred measurement. Their source order remains stable across locales.
  const profileOrder = [
    1,
    ...content.materialProfile
      .map((_, index) => index)
      .filter((index) => index !== 1),
  ].filter((index) => content.materialProfile[index]);
  // No lot is selected. Growing relationships remain at material scope, while
  // the UJI designation has its own context and does not become a growing place.
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
      <div
        className={styles.tabs}
        role="tablist"
        aria-label={t("Learn about this matcha")}
      >
        {views.map((item, index) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            id={`${id}-${item.key}-tab`}
            aria-controls={`${id}-${item.key}-panel`}
            aria-selected={view === item.key}
            tabIndex={view === item.key ? 0 : -1}
            ref={(node) => {
              tabs.current[index] = node;
            }}
            data-retail-learning-tab={item.key}
            onClick={() => setView(item.key)}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? views.length - 1
                    : (index +
                        (event.key === "ArrowRight" ? 1 : -1) +
                        views.length) %
                      views.length;
              const nextView = views[next];
              if (!nextView) return;
              setView(nextView.key);
              tabs.current[next]?.focus();
            }}
          >
            <ScrambleText
              text={t(item.label)}
              interactive
              animateOnMount={false}
              wrap
            />
          </button>
        ))}
      </div>

      <div
        className={styles.panel}
        role="tabpanel"
        id={`${id}-profile-panel`}
        aria-labelledby={`${id}-profile-tab`}
        tabIndex={0}
        hidden={view !== "profile"}
        data-retail-learning-panel="profile"
        data-retail-learning-profile
        data-visible-product-profile
      >
        <ul
          className={styles.properties}
          aria-label={t("Material specifications")}
        >
          {profileOrder.map((index) => {
            const item = content.materialProfile[index];
            if (!item) return null;
            return (
              <li key={item.label} data-flavour={index === 1 || undefined}>
                <button
                  type="button"
                  className={styles.property}
                  aria-pressed={propertyIndex === index}
                  aria-controls={`${id}-explanation`}
                  data-retail-profile-property={index}
                  onClick={() => setPropertyIndex(index)}
                >
                  <span className={styles.propertyLabel}>{item.label}</span>
                  <span className={styles.propertyValue}>{item.value}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div
          className={styles.explanation}
          id={`${id}-explanation`}
          aria-live="polite"
          aria-atomic="true"
        >
          {property && <p>{property.explanation}</p>}
        </div>
      </div>

      <div
        className={`${styles.panel} ${styles.prose}`}
        role="tabpanel"
        id={`${id}-preparation-panel`}
        aria-labelledby={`${id}-preparation-tab`}
        tabIndex={0}
        hidden={view !== "preparation"}
        data-retail-learning-panel="preparation"
        data-retail-learning-preparation
      >
        <p className={styles.preparation}>{content.preparation}</p>
        <section className={styles.lookFor}>
          <h3>{t("What to look for")}</h3>
          <ul>
            {content.lookFor.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <details className={styles.guidance}>
          <summary>
            <span>{t("More guidance")}</span>
            <span aria-hidden="true" />
          </summary>
          <div>
            {content.sections.map((section) => (
              <section key={section.id}>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </section>
            ))}
            <p>{content.selectionNote}</p>
          </div>
        </details>
      </div>

      <div
        className={`${styles.panel} ${styles.prose}`}
        role="tabpanel"
        id={`${id}-origin-panel`}
        aria-labelledby={`${id}-origin-tab`}
        tabIndex={0}
        hidden={view !== "origin"}
        data-retail-learning-panel="origin"
        data-retail-learning-origin
        data-retail-origins
      >
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
                  <ScrambleText
                    text={record.action}
                    interactive
                    animateOnMount={false}
                    wrap
                  />
                  <span aria-hidden="true">↗</span>
                </button>
              </section>
            ))}
          </div>
        ) : (
          <p>{t("Origin details have not been published for this matcha.")}</p>
        )}
        {content.originNote && <p>{content.originNote}</p>}
        {facts.published.length > 0 && (
          <section className={styles.record} data-product-record>
            <h3>{t("Product record")}</h3>
            <dl>
              {facts.published.map((fact) => (
                <div key={fact.key} data-published-fact>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
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
                  <ScrambleText
                    text={t(entry.title)}
                    interactive
                    animateOnMount={false}
                    wrap
                  />
                  <span aria-hidden="true">↗</span>
                </span>
                <span className={styles.entryDescription}>{t(entry.dek)}</span>
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
          <ScrambleText
            text={t("All origins")}
            interactive
            animateOnMount={false}
            wrap
          />
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </section>
  );
}
