"use client";

import { useEffect, useId, useRef } from "react";
import { parseShippingCountry } from "@/lib/storefront-destination";
import { useCart } from "./cart-drawer";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./destination-selector.module.css";

export function DestinationSelector({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { t } = useStorefrontLocale();
  const id = useId();
  const selectRef = useRef<HTMLSelectElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const {
    destination,
    destinationPreference,
    destinationCountries,
    destinationBusy,
    destinationReviewRequired,
    reviewRequired,
    changeDestination,
    refreshCart,
    error,
  } = useCart();
  const country =
    destination?.countryCode ?? destinationPreference?.countryCode ?? "";
  const disabled = destinationBusy || reviewRequired || !country;
  useEffect(() => {
    if (!restoreFocus.current || destinationBusy) return;
    restoreFocus.current = false;
    const control = country ? selectRef.current : retryRef.current;
    if (
      !reviewRequired &&
      control?.getClientRects().length &&
      (document.activeElement === document.body ||
        document.activeElement === control)
    )
      control.focus({ preventScroll: true });
  }, [destinationBusy, reviewRequired, country]);
  return (
    <div
      className={styles.root}
      data-destination-control
      data-compact={compact || undefined}
      aria-busy={destinationBusy}
    >
      <label className={styles.label} htmlFor={id}>
        {t("Ship to")}
      </label>
      <select
        id={id}
        ref={selectRef}
        className={styles.select}
        data-destination-selector
        aria-label={t("Shipping country")}
        value={country}
        disabled={disabled}
        onChange={(event) => {
          const next = parseShippingCountry(event.target.value);
          if (next) {
            restoreFocus.current = true;
            void changeDestination(next);
          }
        }}
      >
        {!country && <option value="">—</option>}
        {destinationCountries.map((code) => (
          <option key={code} value={code}>
            {compact ? code : t(code === "US" ? "United States" : "Singapore")}
          </option>
        ))}
      </select>
      <span
        className={styles.currency}
        data-destination-currency
        aria-label={
          destination
            ? t("Prices in {currency}", { currency: destination.currency })
            : undefined
        }
      >
        {destination?.currency ?? "—"}
      </span>
      {!country && error && (
        <button
          ref={retryRef}
          className={styles.confirm}
          type="button"
          disabled={destinationBusy}
          onClick={() => {
            restoreFocus.current = true;
            void refreshCart();
          }}
        >
          {t("Try again")}
        </button>
      )}
      {destinationReviewRequired && !reviewRequired && country && (
        <button
          className={styles.confirm}
          type="button"
          disabled={destinationBusy}
          onClick={() => {
            const next = parseShippingCountry(country);
            if (next) void changeDestination(next);
          }}
        >
          {t("Confirm country")}
        </button>
      )}
    </div>
  );
}
