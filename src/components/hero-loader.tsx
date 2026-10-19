"use client";

import { useSyncExternalStore } from "react";
import { useStorefrontLocale } from "./storefront-locale-provider";
import styles from "./hero-loader.module.css";

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

function LoadingReadout({
  label,
  progress,
}: {
  label: string;
  progress?: number;
}) {
  return (
    <div
      className={styles.register}
      aria-hidden={progress !== undefined || undefined}
    >
      <div className={styles.progress}>
        <div className={styles.rail} aria-hidden="true">
          <span
            className={styles.fill}
            data-indeterminate={progress === undefined || undefined}
            style={
              progress === undefined
                ? undefined
                : { clipPath: `inset(0 ${100 - progress}% 0 0)` }
            }
          />
        </div>
        <div className={styles.readout}>
          <span className={styles.status}>{label}</span>
          {progress !== undefined && (
            <span className={styles.percentage}>
              {String(progress).padStart(2, "0")}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** The existing readout, without a percentage for unknown network progress. */
export function CommerceLoader({
  label,
  inCart = false,
}: {
  label: string;
  inCart?: boolean;
}) {
  const { t } = useStorefrontLocale();
  const hydrated = useSyncExternalStore(subscribe, clientReady, serverReady);
  // Shopify requests begin on the client; no-JavaScript visitors must not
  // inherit a permanent network indicator from the server render.
  if (!hydrated) return null;
  return (
    <div
      className={styles.commerceLoader}
      data-commerce-loading
      data-in-cart={inCart || undefined}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <LoadingReadout label={t(label)} />
    </div>
  );
}

export function HeroLoader({
  progress,
  phase,
  tone,
}: {
  progress: number;
  phase: "loading" | "complete" | "leaving";
  tone: "light" | "dark";
}) {
  const { t } = useStorefrontLocale();
  const value = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div
      className={styles.loader}
      data-hero-loader
      data-state={phase}
      data-tone={tone}
      role="progressbar"
      aria-label={t("Loading ATOMA")}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <LoadingReadout
        label={t(value === 100 ? "READY" : "LOADING")}
        progress={value}
      />
    </div>
  );
}
