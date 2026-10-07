"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

import { ScrambleText } from "./scramble-text";
import styles from "./purchase-options.module.css";

/** Selling plans are not yet available through the reviewed store connection. */
export function PurchaseOptions() {
  const { t } = useStorefrontLocale();
  return (
    <fieldset className={styles.options}>
      <legend>
        <ScrambleText text={t("Purchase")} periodic wrap />
      </legend>
      <div className={styles.choices}>
        <label className={styles.choice} data-selected="true">
          <input
            type="radio"
            checked
            readOnly
            aria-label={t("One-time purchase")}
          />
          <span>
            <ScrambleText text={t("One-time")} periodic wrap />
          </span>
          <span className={styles.mark} aria-hidden="true">
            ●
          </span>
        </label>
        <label className={styles.choice} data-unavailable="true">
          <input
            type="radio"
            disabled
            aria-label={t("Subscribe — unavailable")}
          />
          <span>
            <ScrambleText text={t("Subscribe")} periodic wrap />
            <small>{t("Not available yet")}</small>
          </span>
          <span className={styles.mark} aria-hidden="true">
            ○
          </span>
        </label>
      </div>
    </fieldset>
  );
}
