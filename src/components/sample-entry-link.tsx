"use client";

import Link from "next/link";
import { useId } from "react";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { useCart } from "./cart-drawer";
import { ShopMaterialImage } from "./shop-material-image";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./sample-entry-link.module.css";

export type SampleEntryVariant =
  "card" | "feature" | "rail" | "note" | "bar" | "collection" | "panel";

/** Shared entrances for the study; the existing Samples page owns the offer. */
export function SampleEntryLink({
  variant,
  point,
  disabled = false,
  onSelect,
  selected = false,
  controls,
}: {
  variant: SampleEntryVariant;
  point: string;
  disabled?: boolean;
  onSelect?: () => void;
  selected?: boolean;
  controls?: string;
}) {
  const { t } = useStorefrontLocale();
  const { busy } = useCart();
  const descriptionId = useId();
  const locked = disabled || busy;
  const photographic = variant !== "note" && variant !== "bar";
  const primary = variant === "feature" || variant === "collection";

  const content = (
    <>
      {variant === "collection" && (
        <span className={styles.topline}>
          <span>{t("Start with samples")}</span>
          <span>3 × 20 g</span>
        </span>
      )}
      {photographic && (
        <span className={styles.materials} aria-hidden="true">
          {SAMPLE_SET_CONTENTS.map((item) => (
            <span className={styles.specimen} key={item.key}>
              <span className={styles.image}>
                <ShopMaterialImage src={item.image} alt="" showWhilePreparing />
              </span>
              {variant === "collection" && (
                <span className={styles.materialName}>
                  {t(item.name.replace(/ Matcha$/, ""))}
                </span>
              )}
            </span>
          ))}
        </span>
      )}
      <span className={styles.copy}>
        {variant === "feature" && (
          <span className={styles.eyebrow}>{t("Start with samples")}</span>
        )}
        <span className={styles.title}>
          {t(variant === "note" ? "Start with samples" : "Sample Set")}
        </span>
        <span className={styles.detail} id={descriptionId}>
          {t("Three matcha · 20 g each")}
        </span>
        {variant === "collection" && (
          <span className={styles.total}>{t("60 g total")}</span>
        )}
      </span>
      <span className={styles.action} aria-hidden="true">
        {(primary || variant === "bar" || variant === "panel") && (
          <span>{t("Explore the set")}</span>
        )}
        <span className={styles.arrow}>{onSelect ? "→" : "↗"}</span>
      </span>
    </>
  );
  const entryProps = {
    className: styles.entry,
    "data-sample-entry": variant,
    "data-sample-entry-point": point,
    "aria-label": t("Explore the sample set"),
    "aria-describedby": descriptionId,
    "aria-disabled": locked || undefined,
  };

  return onSelect ? (
    <button
      {...entryProps}
      type="button"
      disabled={locked}
      aria-pressed={selected}
      aria-controls={controls}
      onClick={onSelect}
    >
      {content}
    </button>
  ) : (
    <Link
      {...entryProps}
      href="/samples"
      onClick={(event) => {
        if (locked) event.preventDefault();
      }}
      onNavigate={(event) => {
        if (locked) event.preventDefault();
      }}
    >
      {content}
    </Link>
  );
}
