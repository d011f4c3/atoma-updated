"use client";

import { useStorefrontLocale } from "./storefront-locale-provider";

import type { PointerEvent } from "react";
import { ScrambleText } from "./scramble-text";
import styles from "./add-to-cart-button.module.css";
import studyStyles from "./purchase-button-treatments.module.css";

export type AddToCartTreatment = "current" | "mineral" | "split" | "keyline";

type AddToCartButtonProps = {
  available: boolean;
  pending: boolean;
  disabled?: boolean;
  updating?: boolean;
  /** Saved study variants; storefront purchase buttons keep Current. */
  treatment?: AddToCartTreatment;
  onAdd: () => void;
};

export function AddToCartButton({
  available,
  pending,
  disabled = false,
  updating = false,
  treatment = "current",
  onAdd,
}: AddToCartButtonProps) {
  const { t } = useStorefrontLocale();
  const buttonStyles = treatment === "current" ? styles : studyStyles;
  const label = t(
    updating
      ? "Updating prices…"
      : pending
        ? "Adding…"
        : available
          ? "Add to cart"
          : "Currently unavailable",
  );
  function followPointer(event: PointerEvent<HTMLButtonElement>) {
    if (
      treatment !== "current" ||
      event.pointerType !== "mouse" ||
      !available ||
      pending ||
      disabled ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const button = event.currentTarget;
    const bounds = button.getBoundingClientRect();
    button.style.setProperty("--pointer-x", `${event.clientX - bounds.left}px`);
    button.style.setProperty("--pointer-y", `${event.clientY - bounds.top}px`);
  }

  return (
    <button
      className={buttonStyles.button}
      type="button"
      disabled={!available || pending || disabled || updating}
      aria-busy={pending || updating}
      data-pending={pending}
      data-available={available}
      data-treatment={treatment === "current" ? undefined : treatment}
      onClick={onAdd}
      onPointerMove={followPointer}
    >
      <span className={buttonStyles.surface} aria-hidden="true" />
      <span className={buttonStyles.label}>
        <ScrambleText
          text={label}
          interactive
          animateOnMount={treatment === "current"}
          paused={pending || updating || !available || disabled}
          wrap
        />
      </span>
      <span className={buttonStyles.action} aria-hidden="true">
        <span className={buttonStyles.plus}>{available ? "+" : "—"}</span>
        <svg className={buttonStyles.arrow} viewBox="0 0 20 20" fill="none">
          <path d="M4 10h11M10 5l5 5-5 5" />
        </svg>
        <span className={buttonStyles.spinner} />
      </span>
      <span className={buttonStyles.track} aria-hidden="true" />
    </button>
  );
}
