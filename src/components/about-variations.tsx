"use client";

import Link from "next/link";
import { AboutExploration } from "./about-exploration";
import { AboutAtlas } from "./about-atlas";
import { AboutNotes } from "./about-notes";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { useCart } from "./cart-drawer";
import styles from "./about-variations.module.css";

export type AboutDirection = "studio" | "atlas" | "notes" | "original";

const directions = [
  {
    id: "studio",
    label: "01 / Studio",
    note: "A compact material study. Powder, precise type and a short selection register.",
  },
  {
    id: "atlas",
    label: "02 / Atlas",
    note: "A photographic spread. Offset images, small captions and a continuous reading flow.",
  },
  {
    id: "notes",
    label: "03 / Notes",
    note: "An editorial notebook. Margin notes, restrained imagery and a closer reading scale.",
  },
] as const;

export function AboutVariations({ direction }: { direction: AboutDirection }) {
  const { tone } = useStorefrontTheme();
  const { busy } = useCart();
  const selected = directions.find((item) => item.id === direction);
  return (
    <div
      className={styles.gallery}
      data-about-variations={direction}
      data-storefront-theme={tone}
      data-tone={tone}
    >
      <aside
        className={styles.comparison}
        aria-label="About exploration comparison"
        lang="en"
      >
        <div className={styles.bar}>
          <span className={styles.label}>About explorations</span>
          <nav aria-label="About direction">
            {directions.map((item) => (
              <Link
                key={item.id}
                href={`/about-exploration?direction=${item.id}`}
                aria-current={direction === item.id ? "page" : undefined}
                aria-disabled={busy || undefined}
                onClick={(event) => {
                  if (busy) event.preventDefault();
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            className={styles.reference}
            href="/about-exploration?direction=original"
            aria-current={direction === "original" ? "page" : undefined}
            aria-disabled={busy || undefined}
            onClick={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            Original ↗
          </Link>
        </div>
        <p>
          {selected?.note ??
            "The original large-scale exploration, kept here for comparison."}
          <span>English design studies</span>
        </p>
      </aside>
      {direction === "atlas" ? (
        <AboutAtlas />
      ) : direction === "notes" ? (
        <AboutNotes />
      ) : (
        <AboutExploration key={direction} compact={direction === "studio"} />
      )}
    </div>
  );
}
