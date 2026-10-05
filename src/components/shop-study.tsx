"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useCart } from "./cart-drawer";
import { SpecimenHero } from "./specimen-hero";
import styles from "./shop-study.module.css";

const directions = [
  {
    value: "current",
    name: "Current",
    description:
      "The current format and quantity selection, kept as a baseline for comparison.",
  },
  {
    value: "sheet",
    name: "Order sheet",
    description:
      "A ruled order sheet brings format, quantity and total into a clear reading sequence.",
  },
  {
    value: "counter",
    name: "Counter",
    description:
      "Quantity takes the foreground, with the selected format and order total close at hand.",
  },
  {
    value: "card",
    name: "Checkout card",
    description:
      "A contained purchase card groups the selection and its total with a clear add-to-cart action.",
  },
  {
    value: "refined",
    name: "Current refined",
    description:
      "The same purchase sequence with a quieter type scale, spacing and value alignment.",
  },
  {
    value: "line",
    name: "Order line",
    description:
      "A compact order line aligns format and quantity, followed by the total and purchase action.",
  },
  {
    value: "split",
    name: "Split checkout",
    description:
      "Order controls sit beside a focused purchase summary, stacking into a compact sequence on phones.",
  },
  {
    value: "ledger",
    name: "Purchase ledger",
    description:
      "Numbered order rows give each choice its own space. A broad closing band brings the total and purchase action together.",
  },
  {
    value: "open",
    name: "Open checkout",
    description:
      "Available formats are visible at a glance, with quantity below and a quiet purchase dock. The current storefront header and left Slides stay in place.",
  },
  {
    value: "list",
    name: "Format list",
    description:
      "Ruled format rows align each size with its unit price. Quantity and the purchase action follow in a compact sequence.",
  },
  {
    value: "price",
    name: "Price first",
    description:
      "The order total leads, with the selected format and quantity beside it. Compact controls finish with a full-width purchase action.",
  },
] as const;

type ShopVariant = (typeof directions)[number]["value"];

export function ShopStudy() {
  const [variant, setVariant] = useState<ShopVariant>("open");
  const [tone, setTone] = useState<"dark" | "light">("light");
  const { busy } = useCart();
  const id = useId();
  const notesRef = useRef<HTMLDetailsElement>(null);
  const direction =
    directions.find((item) => item.value === variant) ?? directions[8];

  useEffect(() => {
    function dismiss(event: PointerEvent) {
      const notes = notesRef.current;
      if (
        notes?.open &&
        event.target instanceof Node &&
        !notes.contains(event.target)
      ) {
        notes.open = false;
      }
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);

  return (
    <div
      className={styles.study}
      data-shop-study
      data-shop-direction={variant}
      data-tone={tone}
    >
      <header className={styles.toolbar}>
        <h1>Shop study</h1>
        <div className={styles.field}>
          <label htmlFor={`${id}-layout`}>Shop layout</label>
          <select
            id={`${id}-layout`}
            value={variant}
            disabled={busy}
            onChange={(event) => {
              if (busy) return;
              setVariant(event.target.value as ShopVariant);
              if (notesRef.current) notesRef.current.open = false;
            }}
          >
            {directions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <details
          ref={notesRef}
          className={styles.notes}
          onKeyDown={(event) => {
            if (event.key !== "Escape" || !event.currentTarget.open) return;
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.open = false;
            event.currentTarget.querySelector("summary")?.focus();
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              event.currentTarget.open = false;
            }
          }}
        >
          <summary aria-label="About this layout">
            About
            <span className={styles.plus} aria-hidden="true">
              +
            </span>
          </summary>
          <div className={styles.notePanel}>
            <p className={styles.noteTitle}>{direction.name}</p>
            <p>{direction.description}</p>
            <div className={styles.noteLinks}>
              <Link
                href="/origins-study"
                aria-disabled={busy || undefined}
                onClick={(event) => {
                  if (busy) event.preventDefault();
                }}
              >
                Origins study <span aria-hidden="true">↗</span>
              </Link>
              <Link
                href="/selector-study"
                aria-disabled={busy || undefined}
                onClick={(event) => {
                  if (busy) event.preventDefault();
                }}
              >
                Selector study <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </details>
        <Link
          className={styles.home}
          href="/"
          aria-label="Current homepage"
          aria-disabled={busy || undefined}
          onClick={(event) => {
            if (busy) event.preventDefault();
          }}
        >
          <span className={styles.fullLabel}>Current homepage</span>
          <span className={styles.compactLabel} aria-hidden="true">
            Home
          </span>
          <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <div className={styles.preview}>
        <SpecimenHero
          tone={tone}
          onToneChange={setTone}
          shopPreviewVariant={variant}
          originPreviewVariant="split"
          initialView="builder"
          selectorVariant="slides"
          sectionSelectorVariant="tabs"
          selectorPlacement="left"
          startAtSelection
        />
      </div>
    </div>
  );
}
