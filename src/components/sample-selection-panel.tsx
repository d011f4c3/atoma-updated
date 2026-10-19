"use client";

import { useId } from "react";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { ShopMaterialImage } from "./shop-material-image";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./sample-selection-panel.module.css";

export type SampleSelectionPanelVariant =
  "lead" | "equal" | "feature" | "split";

export function SampleSelectionPanel({
  variant,
  active,
  onSelect,
  disabled = false,
}: {
  variant: SampleSelectionPanelVariant;
  active: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const { t } = useStorefrontLocale();
  const descriptionId = useId();

  return (
    <div
      className={styles.panel}
      data-sample-selection-panel={variant}
      data-active={active}
      data-disabled={disabled || undefined}
    >
      <button
        className={styles.select}
        type="button"
        aria-label={t("Select {name}", { name: t("Sample Set") })}
        aria-describedby={descriptionId}
        aria-pressed={active}
        data-sample-select
        disabled={disabled}
        onClick={onSelect}
      >
        <span id={descriptionId} className={styles.accessibleDescription}>
          {t("Three matcha · 20 g each")}. {t("60 g total")}.{" "}
          {SAMPLE_SET_CONTENTS.map((item) => t(item.name)).join(", ")}.
        </span>
      </button>
      <div className={styles.content} aria-hidden="true">
        <div className={styles.introduction}>
          <span className={styles.eyebrow}>{t("Start with samples")}</span>
          <span className={styles.heading}>{t("Sample Set")}</span>
          <span className={styles.summary}>
            {t("Three matcha · 20 g each")}
          </span>
        </div>
        <span className={styles.selectionMark}>
          <svg viewBox="0 0 20 20" fill="none">
            {active ? (
              <path d="m5 10 3 3 7-7" />
            ) : (
              <path d="M5 10h10m-5-5v10" />
            )}
          </svg>
        </span>
        <div className={styles.materials}>
          {SAMPLE_SET_CONTENTS.map((item) => (
            <div className={styles.specimen} key={item.key}>
              <div className={styles.image} data-sample-selection-image>
                <ShopMaterialImage src={item.image} alt="" showWhilePreparing />
              </div>
              <span className={styles.materialName}>
                {t(item.name.replace(/ Matcha$/, ""))}
              </span>
            </div>
          ))}
        </div>
        <div className={styles.record}>
          <span>3 × 20 g</span>
          <span>{t("60 g total")}</span>
        </div>
      </div>
    </div>
  );
}
