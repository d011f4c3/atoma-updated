"use client";

import Link from "next/link";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { ShopMaterialImage } from "./shop-material-image";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./sample-experience-entry.module.css";

export type SampleEntrancePlacement = "selector" | "tile" | "panel" | "footer";

export function SampleExperienceEntry({
  placement,
  disabled = false,
}: {
  placement: SampleEntrancePlacement;
  disabled?: boolean;
}) {
  const { t } = useStorefrontLocale();
  return (
    <Link
      href="/samples"
      className={styles.entry}
      data-sample-entrance={placement}
      aria-label={t("Explore the Sample Set")}
      aria-disabled={disabled || undefined}
      onClick={(event) => {
        if (disabled) event.preventDefault();
      }}
    >
      {(placement === "tile" || placement === "panel") && (
        <span className={styles.swatches} aria-hidden="true">
          {SAMPLE_SET_CONTENTS.map((item) => (
            <span className={styles.swatch} key={item.key}>
              <ShopMaterialImage src={item.image} alt="" showWhilePreparing />
            </span>
          ))}
        </span>
      )}
      <span className={styles.copy}>
        <span className={styles.title}>{t("Sample Set")}</span>
        {placement === "panel" && (
          <span className={styles.heading}>
            {t("Three matcha.")} {t("One starting point.")}
          </span>
        )}
        <span className={styles.detail}>
          {placement === "footer"
            ? SAMPLE_SET_CONTENTS.map((item) =>
                t(item.name.replace(/ Matcha$/, "")),
              ).join(" · ")
            : t("Three matcha · 20 g each")}
        </span>
      </span>
      <span className={styles.action}>
        {(placement === "selector" ||
          placement === "footer" ||
          placement === "panel") && <span>{t("Explore the set")}</span>}
        <span aria-hidden="true">↗</span>
      </span>
      {placement === "footer" && (
        <span className={styles.weight}>3 × 20 g / {t("60 g total")}</span>
      )}
    </Link>
  );
}
