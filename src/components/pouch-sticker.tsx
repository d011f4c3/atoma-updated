"use client";

import Image from "next/image";
import { SAMPLE_SET_CONTENTS } from "@/lib/sample-set";
import { getSampleLabelPlace } from "@/lib/sample-label";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./pouch-sticker.module.css";

/** One live print system for sample and selected-format packaging. */
export function PouchSticker({
  title,
  application,
  productHandle,
  format,
  sample = false,
  attached = false,
  reference,
  onEditReference,
}: {
  title: string;
  application: string;
  productHandle?: string;
  format?: string;
  sample?: boolean;
  attached?: boolean;
  reference?: string;
  onEditReference?: () => void;
}) {
  const { t } = useStorefrontLocale();
  // Only an exact catalog identity can supply a product QR, code or place.
  const item = SAMPLE_SET_CONTENTS.find(
    (candidate) => candidate.productHandle === productHandle,
  );
  const place = productHandle ? getSampleLabelPlace(productHandle) : null;

  return (
    <span
      className={styles.sticker}
      data-pouch-sticker
      data-sample-sticker={sample ? item?.key : undefined}
      data-attached={attached || undefined}
    >
      <span className={styles.header}>
        <span className={styles.wordmark}>ATOMA</span>
        <span>{t(sample ? "Sample Set" : "Matcha")}</span>
      </span>
      <span className={styles.identity}>
        <span className={styles.name}>{t(title || "Matcha")}</span>
        {item && <span className={styles.code}>◇ {item.productCode}</span>}
      </span>
      <span className={styles.lower} data-has-qr={Boolean(item)}>
        <span className={styles.records}>
          {application && (
            <span className={styles.record}>
              <span>{t("Application")}</span>
              <span>{t(application)}</span>
            </span>
          )}
          {place && (
            <span className={styles.record}>
              <span>{t(place.label)}</span>
              <span>{t(place.value)}</span>
            </span>
          )}
          {format && (
            <span className={styles.record}>
              <span>{t("Net weight")}</span>
              <span className={styles.literal}>{format}</span>
            </span>
          )}
          {reference && (
            <span className={styles.record}>
              <span>{t("Reference")}</span>
              {onEditReference ? (
                <button
                  className={styles.reference}
                  type="button"
                  onClick={onEditReference}
                >
                  {reference}
                </button>
              ) : (
                <span className={styles.reference}>{reference}</span>
              )}
            </span>
          )}
        </span>
        {item && (
          <Image
            className={styles.qr}
            src={`/images/samples/qr/${item.key}.svg`}
            alt={t("Scan for product details")}
            width={196}
            height={196}
            unoptimized
          />
        )}
      </span>
      <span className={styles.footer}>
        <span>{t("Compare in your own preparation.")}</span>
        {item && <span>{t("Product details & preparation")}</span>}
      </span>
    </span>
  );
}
