"use client";

import { useId } from "react";
import type { CatalogProduct } from "@/lib/catalog-types";
import { getProductContent } from "@/lib/product-content";
import {
  getProductDisplayIndex,
  type ProductCodePlacement,
} from "@/lib/product-display-index";
import { productName } from "@/lib/product-name";
import { ScrambleText } from "./scramble-text";
import { ShopMaterialImage } from "./shop-material-image";
import styles from "./visual-product-selectors.module.css";

export type VisualSelectorVariant =
  "specimens" | "swatches" | "slides" | "menu" | "index" | "radio" | "stepper";
export type VisualSectionVariant =
  "text" | "tabs" | "segmented" | "menu" | "brackets" | "track";

type InformationView = "overview" | "specifications" | "origins" | "builder";

const sections: { value: InformationView; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "specifications", label: "Specifications" },
  { value: "origins", label: "Origins" },
  { value: "builder", label: "Shop" },
];

const sectionWeights = [1, 1.7, 0.9, 0.6] as const;

export function VisualProductSelectors({
  products,
  selectedId,
  variant,
  productCodePlacement,
  tone,
  disabled,
  onSelect,
}: {
  products: CatalogProduct[];
  selectedId?: string;
  variant: VisualSelectorVariant;
  productCodePlacement?: ProductCodePlacement;
  tone: "dark" | "light";
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  const radioName = useId();
  const selectedProduct = products.find((product) => product.id === selectedId);
  const selectedIndex = products.findIndex(
    (product) => product.id === selectedId,
  );

  function stepSelection(direction: -1 | 1) {
    const next = products[selectedIndex + direction];
    if (!disabled && selectedIndex >= 0 && next && next.id !== selectedId) {
      onSelect(next.id);
    }
  }

  return (
    <div
      className={styles.products}
      role="group"
      aria-label="Matcha to explore"
      data-visual-product-selectors={variant}
      data-variant={variant}
      data-tone={tone}
    >
      {variant === "stepper" ? (
        <>
          <button
            className={styles.stepperControl}
            type="button"
            aria-label="Previous matcha"
            disabled={disabled || selectedIndex <= 0}
            onClick={() => stepSelection(-1)}
          >
            <span aria-hidden="true">←</span>
          </button>
          <div
            className={styles.stepperSelection}
            data-homepage-selected-product={selectedProduct?.id}
            aria-live="polite"
            aria-atomic="true"
          >
            <span className={styles.stepperName}>
              {selectedProduct
                ? productName(selectedProduct.title)
                : "Choose matcha"}
            </span>
            <span
              className={styles.stepperPosition}
              data-homepage-product-position={selectedIndex + 1}
              data-product-count={products.length}
            >
              {selectedIndex >= 0
                ? String(selectedIndex + 1).padStart(2, "0")
                : "—"}
              <span aria-hidden="true"> / </span>
              <span className={styles.srOnly}> of </span>
              {String(products.length).padStart(2, "0")}
            </span>
          </div>
          <button
            className={styles.stepperControl}
            type="button"
            aria-label="Next matcha"
            disabled={
              disabled ||
              selectedIndex < 0 ||
              selectedIndex >= products.length - 1
            }
            onClick={() => stepSelection(1)}
          >
            <span aria-hidden="true">→</span>
          </button>
        </>
      ) : variant === "menu" ? (
        <>
          <div className={styles.menuPhoto} aria-hidden="true">
            {selectedProduct && (
              <div className={styles.menuPhotograph}>
                <ShopMaterialImage
                  src={getProductContent(selectedProduct).materialImage}
                  alt=""
                />
              </div>
            )}
          </div>
          <label className={styles.productMenu}>
            <span>Matcha type</span>
            <select
              aria-label="Matcha type"
              value={selectedProduct?.id ?? ""}
              disabled={disabled}
              onChange={(event) => {
                const next = event.currentTarget.value;
                if (!disabled && next !== selectedId) onSelect(next);
              }}
            >
              {!selectedProduct && (
                <option value="" disabled>
                  Choose matcha
                </option>
              )}
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {productName(product.title)}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : (
        products.map((product, index) => {
          const name = productName(product.title);
          const grade = name.replace(/\s+matcha$/i, "") || name;
          if (variant === "radio") {
            return (
              <label
                className={styles.radioChoice}
                key={product.id}
                data-selected={selectedId === product.id}
                data-disabled={disabled}
              >
                <input
                  type="radio"
                  name={radioName}
                  value={product.id}
                  aria-label={`Select ${name}`}
                  data-homepage-product-choice={product.id}
                  checked={selectedId === product.id}
                  disabled={disabled}
                  onChange={() => {
                    if (!disabled && selectedId !== product.id)
                      onSelect(product.id);
                  }}
                />
                <span>{grade}</span>
              </label>
            );
          }
          if (variant === "index") {
            return (
              <button
                className={styles.product}
                type="button"
                key={product.id}
                aria-label={`Select ${name}`}
                aria-pressed={selectedId === product.id}
                data-homepage-product-choice={product.id}
                disabled={disabled}
                onClick={() => {
                  if (!disabled && selectedId !== product.id)
                    onSelect(product.id);
                }}
              >
                <span className={styles.indexNumber} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={styles.indexGrade}>{grade}</span>
              </button>
            );
          }
          const content = getProductContent(product);
          return (
            <button
              className={styles.product}
              data-code-placement={
                variant === "slides" && getProductDisplayIndex(product.handle)
                  ? productCodePlacement
                  : undefined
              }
              type="button"
              key={product.id}
              aria-label={`Select ${name}`}
              aria-pressed={selectedId === product.id}
              data-homepage-product-choice={product.id}
              disabled={disabled}
              onClick={() => {
                if (!disabled && selectedId !== product.id)
                  onSelect(product.id);
              }}
            >
              <span className={styles.photo} aria-hidden="true">
                <span className={styles.photograph}>
                  <ShopMaterialImage src={content.materialImage} alt="" />
                </span>
              </span>
              <span
                className={styles.productLabel}
                data-display-index={
                  productCodePlacement && variant === "slides"
                    ? getProductDisplayIndex(product.handle)
                    : undefined
                }
              >
                {productCodePlacement &&
                  variant === "slides" &&
                  getProductDisplayIndex(product.handle) && (
                    <span className={styles.displayIndex} aria-hidden="true">
                      {getProductDisplayIndex(product.handle)}
                    </span>
                  )}
                <span className={styles.grade}>
                  <ScrambleText
                    text={grade}
                    interactive
                    animateOnMount={false}
                    wrap
                  />
                </span>
                {variant === "slides" && (
                  <span className={styles.materialLabel}>Matcha</span>
                )}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}

export function VisualSectionSelectors({
  variant,
  active,
  disabled,
  onSelect,
}: {
  variant: VisualSectionVariant;
  active: string;
  disabled: boolean;
  onSelect: (view: InformationView) => void;
}) {
  const activeIndex = Math.max(
    0,
    sections.findIndex((section) => section.value === active),
  );
  const totalWeight = sectionWeights.reduce<number>(
    (sum, weight) => sum + weight,
    0,
  );
  const precedingWeight = sectionWeights
    .slice(0, activeIndex)
    .reduce<number>((sum, weight) => sum + weight, 0);
  const trackFraction =
    (precedingWeight + (sectionWeights[activeIndex] ?? 1) / 2) / totalWeight;
  const trackPosition = `calc((100% - ${sectionWeights.length - 1} * var(--section-gap)) * ${trackFraction} + ${activeIndex} * var(--section-gap))`;

  return (
    <div
      className={styles.sections}
      role="group"
      aria-label="Shopping mode"
      data-visual-section-selectors={variant}
      data-variant={variant}
    >
      {variant === "menu" ? (
        <label className={styles.sectionMenu}>
          <span>View</span>
          <select
            aria-label="Information view"
            value={active}
            disabled={disabled}
            onChange={(event) => {
              const next = sections.find(
                (section) => section.value === event.currentTarget.value,
              );
              if (!disabled && next) onSelect(next.value);
            }}
          >
            {sections.map((section) => (
              <option key={section.value} value={section.value}>
                {section.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        sections.map((section) => (
          <button
            className={styles.section}
            type="button"
            key={section.value}
            aria-pressed={active === section.value}
            disabled={disabled}
            onClick={() => {
              if (!disabled) onSelect(section.value);
            }}
          >
            <ScrambleText
              text={section.label}
              interactive
              animateOnMount={false}
            />
          </button>
        ))
      )}
      {variant === "track" && (
        <span className={styles.track} aria-hidden="true">
          <span
            className={styles.trackMarker}
            style={{ left: trackPosition }}
          />
        </span>
      )}
    </div>
  );
}
