"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

import { useId, useRef, useState } from "react";
import type { CatalogProduct } from "@/lib/catalog-types";
import { getProductContent } from "@/lib/product-content";
import type { ProductCodePlacement } from "@/lib/product-display-index";
import { ProductCodeIdentity } from "./product-code-identity";
import { useDialogDismiss, useDialogScrollLock } from "./use-dialog-dismiss";
import styles from "./focused-specifications.module.css";

export function FocusedSpecifications({
  product,
  tone = "dark",
  presentation = "index",
  productCodePlacement,
}: {
  product: CatalogProduct | undefined;
  tone?: "dark" | "light";
  presentation?: "index" | "homepage";
  productCodePlacement?: ProductCodePlacement;
}) {
  const { locale, t } = useStorefrontLocale();
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const [activeProperty, setActiveProperty] = useState(0);
  const [open, setOpen] = useState(false);
  const dismiss = useDialogDismiss();
  useDialogScrollLock(open);
  const content = getProductContent(product, locale);
  const property =
    content.materialProfile[activeProperty] ?? content.materialProfile[0];

  function explain(index: number, button: HTMLButtonElement) {
    trigger.current = button;
    setActiveProperty(index);
    dialog.current?.showModal();
    setOpen(true);
    closeButton.current?.focus({ preventScroll: true });
  }

  if (!product || !property)
    return (
      <p className={styles.empty}>
        {t(
          product
            ? "Specifications aren’t available for this selection."
            : "Choose a matcha to see its specifications.",
        )}
      </p>
    );

  return (
    <div
      className={styles.root}
      data-focused-specifications
      data-tone={tone}
      data-presentation={presentation}
    >
      <ProductCodeIdentity
        className={styles.heading}
        handle={product.handle}
        placement={productCodePlacement}
      >
        <h2 data-focused-product-name tabIndex={-1}>
          {content.name}
        </h2>
        <p>{content.application}</p>
      </ProductCodeIdentity>
      <ul
        className={styles.properties}
        aria-label={t("Material specifications")}
      >
        {content.materialProfile.map((item, index) => (
          <li key={index}>
            <button
              type="button"
              data-specification
              aria-label={t("{label}: {value}. Read explanation", {
                label: item.label,
                value: item.value,
              })}
              aria-haspopup="dialog"
              aria-controls={`${id}-explanation`}
              onClick={(event) => explain(index, event.currentTarget)}
            >
              <span className={styles.label}>{item.label}</span>
              <span className={styles.value}>{item.value}</span>
              <span className={styles.plus} aria-hidden="true">
                +
              </span>
            </button>
          </li>
        ))}
      </ul>
      <dialog
        {...dismiss}
        className={styles.dialog}
        data-tone={tone}
        ref={dialog}
        id={`${id}-explanation`}
        aria-labelledby={`${id}-heading`}
        onClose={() => {
          setOpen(false);
          trigger.current?.focus({ preventScroll: true });
        }}
      >
        <div className={styles.dialogTop}>
          <span>
            {t("{product} / Specifications", { product: content.name })}
          </span>
          <button
            ref={closeButton}
            type="button"
            aria-label={t("Close specification explanation")}
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        <p className={styles.propertyLabel}>{property.label}</p>
        <h2 id={`${id}-heading`}>{property.value}</h2>
        <p className={styles.explanation}>{property.explanation}</p>
      </dialog>
    </div>
  );
}
