"use client";

import { useSearchParams } from "next/navigation";
import { SHOP_CATEGORIES, type ShopCategory } from "@/lib/shop-category-filter";
import { useCart } from "./cart-drawer";
import { Shop } from "./shop";
import { ShopCategoryFilters } from "./shop-category-filters";
import { useStorefrontLocale } from "./storefront-locale-provider";

export function ShopCollection() {
  const searchParams = useSearchParams();
  const { locale } = useStorefrontLocale();
  const { busy } = useCart();
  const category =
    SHOP_CATEGORIES.find((item) => item.value === searchParams.get("category"))
      ?.value ?? "all";

  function changeCategory(next: ShopCategory) {
    if (busy) return;
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", next);
    // Next synchronizes useSearchParams without navigation or a catalog reload.
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  return (
    <Shop
      sampleEntryDirection="connected"
      categoryFilter={{
        category,
        locale,
        onClear: () => changeCategory("all"),
        controls: ({ products, loading, disabled }) => (
          <ShopCategoryFilters
            products={products}
            category={category}
            direction="facets"
            showFuture
            loading={loading}
            disabled={disabled}
            locale={locale}
            onChange={changeCategory}
          />
        ),
      }}
    />
  );
}
