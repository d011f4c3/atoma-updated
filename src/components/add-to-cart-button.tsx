"use client";

import type { PointerEvent } from "react";
import { ScrambleText } from "./scramble-text";
import styles from "./add-to-cart-button.module.css";

type AddToCartButtonProps = {
  available: boolean;
  pending: boolean;
  disabled?: boolean;
  onAdd: () => void;
};

export function AddToCartButton({
  available,
  pending,
  disabled = false,
  onAdd,
}: AddToCartButtonProps) {
  function followPointer(event: PointerEvent<HTMLButtonElement>) {
    if (
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
      className={styles.button}
      type="button"
      disabled={!available || pending || disabled}
      aria-busy={pending}
      data-pending={pending}
      data-available={available}
      onClick={onAdd}
      onPointerMove={followPointer}
    >
      <span className={styles.surface} aria-hidden="true" />
      <span className={styles.label}>
        <ScrambleText
          text={
            pending
              ? "Adding…"
              : available
                ? "Add to cart"
                : "Currently unavailable"
          }
          interactive
          paused={pending || !available || disabled}
          wrap
        />
      </span>
      <span className={styles.action} aria-hidden="true">
        <span className={styles.plus}>{available ? "+" : "—"}</span>
        <svg className={styles.arrow} viewBox="0 0 20 20" fill="none">
          <path d="M4 10h11M10 5l5 5-5 5" />
        </svg>
        <span className={styles.spinner} />
      </span>
      <span className={styles.track} aria-hidden="true" />
    </button>
  );
}
