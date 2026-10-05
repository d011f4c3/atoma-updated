"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useCart } from "./cart-drawer";
import { SpecimenHero } from "./specimen-hero";
import styles from "./origins-study.module.css";

const directions = [
  {
    value: "current",
    name: "Current",
    description:
      "The current origin summary, with the full directory available to explore.",
  },
  {
    value: "sheet",
    name: "Field sheet",
    description:
      "A compact field sheet brings the growing place, photograph and context into the product view.",
  },
  {
    value: "split",
    name: "Split view",
    description:
      "A photograph and a concise place record sit alongside one another, keeping the origin in the selection flow.",
  },
  {
    value: "index",
    name: "Place index",
    description:
      "A place-led index connects the selected matcha to its growing location and related field notes.",
  },
  {
    value: "panorama",
    name: "Panorama",
    description:
      "The growing place leads, followed by a wide landscape and a quiet geographic record. Left Slides and the current storefront navigation stay in place.",
  },
  {
    value: "record",
    name: "Place record",
    description:
      "A tall regional photograph sits beside the place, geographic hierarchy and landscape notes, giving each a clear reading column.",
  },
] as const;

type OriginVariant = (typeof directions)[number]["value"];

export function OriginsStudy() {
  const [variant, setVariant] = useState<OriginVariant>("panorama");
  const [tone, setTone] = useState<"dark" | "light">("light");
  const { busy } = useCart();
  const id = useId();
  const notesRef = useRef<HTMLDetailsElement>(null);
  const direction =
    directions.find((item) => item.value === variant) ?? directions[4];

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
      data-origins-study
      data-origin-direction={variant}
      data-tone={tone}
    >
      <header className={styles.toolbar}>
        <h1>Origins study</h1>
        <div className={styles.field}>
          <label htmlFor={`${id}-layout`}>Origins layout</label>
          <select
            id={`${id}-layout`}
            value={variant}
            disabled={busy}
            onChange={(event) => {
              if (busy) return;
              setVariant(event.target.value as OriginVariant);
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
                href="/shop-study"
                aria-disabled={busy || undefined}
                onClick={(event) => {
                  if (busy) event.preventDefault();
                }}
              >
                Checkout study <span aria-hidden="true">↗</span>
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
          originPreviewVariant={variant}
          initialView="origins"
          selectorVariant="slides"
          sectionSelectorVariant="tabs"
          selectorPlacement="left"
          startAtSelection
        />
      </div>
    </div>
  );
}
