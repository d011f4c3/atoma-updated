"use client";

import Link from "next/link";
import { useState } from "react";
import type { ShopCategory } from "@/lib/shop-category-filter";
import { Shop } from "./shop";
import {
  ShopCategoryFilters,
  type ShopFilterDirection,
} from "./shop-category-filters";
import { useStorefrontTheme } from "./storefront-theme-provider";
import { useCart } from "./cart-drawer";
import styles from "./shop-filter-study.module.css";

const directions: {
  value: ShopFilterDirection;
  name: string;
  description: string;
}[] = [
  {
    value: "index",
    name: "Index",
    description:
      "A quiet text row. A fine underline keeps the selected category clear and the matcha in focus.",
  },
  {
    value: "tiles",
    name: "Category tiles",
    description:
      "More guidance at a glance. Each category pairs with its use, with generous targets for touch.",
  },
  {
    value: "facets",
    name: "Filter bar",
    description:
      "A compact starting point. Open Category to choose; additional filters can sit alongside it as the range grows.",
  },
];

export function ShopFilterStudy({
  initialDirection = "facets",
  initialTone,
  initialCategory = "all",
  initialFuture = false,
}: {
  initialDirection?: ShopFilterDirection;
  initialTone?: "light" | "dark";
  initialCategory?: ShopCategory;
  initialFuture?: boolean;
}) {
  const { tone: storefrontTone } = useStorefrontTheme();
  const { busy } = useCart();
  const [view, setView] = useState({
    direction: initialDirection,
    tone: initialTone ?? storefrontTone,
    category: initialCategory,
    future: initialFuture,
  });
  const selected = directions.find((item) => item.value === view.direction)!;

  function update(next: Partial<typeof view>) {
    if (busy) return;
    const value = { ...view, ...next };
    setView(value);
    const url = new URL(window.location.href);
    url.searchParams.set("direction", value.direction);
    url.searchParams.set("tone", value.tone);
    url.searchParams.set("category", value.category);
    if (value.future) url.searchParams.set("future", "1");
    else url.searchParams.delete("future");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  return (
    <div
      className={styles.study}
      data-shop-filter-study
      data-tone={view.tone}
      data-storefront-theme={view.tone}
    >
      <header className={styles.header} lang="en">
        <div className={styles.topline}>
          <span>ATOMA / Study 0211</span>
          <Link
            href="/shop"
            aria-disabled={busy || undefined}
            onClick={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            Return to Shop ↗
          </Link>
        </div>
        <div className={styles.titleRow}>
          <div>
            <h1>Find your matcha. Refine the way in.</h1>
            <p>Three filter directions in the current Shop.</p>
          </div>
          <div className={styles.settings}>
            <label className={styles.futureToggle}>
              <input
                type="checkbox"
                checked={view.future}
                disabled={busy}
                onChange={(event) => update({ future: event.target.checked })}
                data-study-future
              />
              Show future filters
            </label>
            <button
              type="button"
              className={styles.theme}
              role="switch"
              aria-label="Dark mode in filter study"
              aria-checked={view.tone === "dark"}
              disabled={busy}
              onClick={() =>
                update({ tone: view.tone === "light" ? "dark" : "light" })
              }
              data-study-tone
            >
              <span aria-hidden="true">{view.tone === "dark" ? "◐" : "◑"}</span>
              {view.tone === "light" ? "Mist" : "Blue hour"}
            </button>
          </div>
        </div>
        <div
          className={styles.directions}
          role="group"
          aria-label="Filter direction"
        >
          {directions.map((item, index) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={view.direction === item.value}
              disabled={busy}
              onClick={() => update({ direction: item.value })}
              data-filter-direction={item.value}
            >
              <span className={styles.number}>0{index + 1}</span>
              {item.name}
              <span className={styles.mark} aria-hidden="true">
                {view.direction === item.value ? "−" : "+"}
              </span>
            </button>
          ))}
        </div>
        <div className={styles.notes}>
          <p>{selected.description}</p>
          {view.future && (
            <p className={styles.futureNote}>
              Taste and region show future placement only. Category filters the
              current collection.
            </p>
          )}
        </div>
      </header>
      <Shop
        sampleEntryDirection="connected"
        studyTone={view.tone}
        onStudyToneChange={(tone) => update({ tone })}
        categoryFilter={{
          category: view.category,
          onClear: () => update({ category: "all" }),
          controls: ({ products, loading, disabled }) => (
            <ShopCategoryFilters
              products={products}
              loading={loading}
              disabled={disabled}
              category={view.category}
              direction={view.direction}
              showFuture={view.future}
              onChange={(category) => update({ category })}
            />
          ),
        }}
      />
    </div>
  );
}
