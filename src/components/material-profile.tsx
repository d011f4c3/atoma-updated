"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

import { useId, useState } from "react";
import type { ProductContent } from "@/lib/product-content";
import { ScrambleText } from "./scramble-text";
import styles from "./material-profile.module.css";

export function MaterialProfile({
  content,
  activeIndex: controlledIndex,
  onSelect,
}: {
  content: ProductContent;
  activeIndex?: number;
  onSelect?: (index: number) => void;
}) {
  const { t } = useStorefrontLocale();
  const explanationId = useId();
  // Keeping the selected column across products lets a buyer compare the same
  // material property without opening it again after every product change.
  const [activeIndex, setActiveIndex] = useState(0);
  const properties = content.materialProfile;
  const selectedIndex = Math.min(
    controlledIndex ?? activeIndex,
    properties.length - 1,
  );
  const selected = properties[selectedIndex];

  if (!selected) return null;

  return (
    <section
      className={styles.profile}
      aria-label={t("Material profile for {product}", {
        product: content.name,
      })}
      data-material-profile
    >
      <div className={styles.caption}>
        <span>
          <ScrambleText text={t("SELECT A PROPERTY ↓")} periodic wrap />
        </span>
      </div>
      <div
        className={styles.properties}
        role="group"
        aria-label={t("Explore material properties")}
      >
        {properties.map((property, index) => (
          <button
            key={index}
            className={styles.property}
            type="button"
            aria-pressed={index === selectedIndex}
            aria-controls={explanationId}
            onClick={() => {
              setActiveIndex(index);
              onSelect?.(index);
            }}
          >
            <span className={styles.label}>
              <ScrambleText text={property.label} interactive periodic wrap />
            </span>
            <span className={styles.value}>
              <ScrambleText text={property.value} interactive periodic wrap />
            </span>
          </button>
        ))}
      </div>
      <p
        id={explanationId}
        className={styles.explanation}
        aria-live="polite"
        aria-atomic="true"
      >
        <span className={styles.explanationLabel}>
          <ScrambleText text={selected.label} periodic wrap />
        </span>
        <span>
          <ScrambleText text={selected.explanation} periodic wrap />
        </span>
      </p>
    </section>
  );
}
